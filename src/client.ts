import type {
  ClickUpSecrets,
  CreateTaskInput,
  ListListsInput,
  ListSpacesInput,
  ListTasksInput,
  UpdateTaskInput,
} from "./schemas";

export const CLICKUP_API_URL = "https://api.clickup.com/api/v2";

type JsonObject = Record<string, unknown>;
type ResponseData = { payload: unknown; status: number; headers: Headers };
type RequestOptions = {
  method?: "GET" | "POST" | "PUT";
  query?: Array<[string, string | number | boolean | undefined]>;
  body?: unknown;
};

export class ClickUpClient {
  constructor(
    private readonly secrets: ClickUpSecrets,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly baseUrl = CLICKUP_API_URL,
  ) {
    if (!secrets.apiToken.trim()) throw new Error("ClickUp apiToken secret is required");
    validateBaseUrl(baseUrl);
  }

  listTeams() {
    return this.request("team");
  }

  listSpaces(input: ListSpacesInput) {
    return this.request(["team", input.teamId, "space"], {
      query: [["archived", input.archived]],
    });
  }

  listLists(input: ListListsInput) {
    return this.request(["space", input.spaceId, "list"], {
      query: [["archived", input.archived]],
    });
  }

  listTasks(input: ListTasksInput) {
    return this.request(["list", input.listId, "task"], {
      query: [
        ["page", input.page],
        ["include_closed", input.includeClosed],
        ["subtasks", input.subtasks],
        ["include_markdown_description", input.includeMarkdownDescription],
        ["order_by", input.orderBy],
        ["reverse", input.reverse],
      ],
    });
  }

  getTask(taskId: string) {
    return this.request(["task", taskId]);
  }

  createTask(input: CreateTaskInput) {
    return this.request(["list", input.listId, "task"], {
      method: "POST",
      body: {
        name: input.name,
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.assigneeIds?.length ? { assignees: input.assigneeIds.map(toNumberId) } : {}),
        ...(input.dueDate !== undefined
          ? { due_date: dateToMillis(input.dueDate), due_date_time: input.dueDateTime }
          : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        notify_all: input.notifyAll,
      },
    });
  }

  updateTask(input: UpdateTaskInput) {
    const body: JsonObject = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined
        ? { due_date: dateToMillis(input.dueDate), due_date_time: input.dueDateTime ?? false }
        : {}),
      ...(input.notifyAll !== undefined ? { notify_all: input.notifyAll } : {}),
    };
    if (input.addAssigneeIds !== undefined || input.removeAssigneeIds !== undefined) {
      body.assignees = {
        add: (input.addAssigneeIds ?? []).map(toNumberId),
        rem: (input.removeAssigneeIds ?? []).map(toNumberId),
      };
    }
    if (!Object.keys(body).length) throw new Error("ClickUp task update must include a field");
    return this.request(["task", input.taskId], { method: "PUT", body });
  }

  private async request(path: string | string[], options: RequestOptions = {}): Promise<ResponseData> {
    const segments = Array.isArray(path) ? path : [path];
    const url = new URL(segments.map(encodeURIComponent).join("/"), `${this.baseUrl.replace(/\/+$/, "")}/`);
    for (const [key, value] of options.query ?? []) {
      if (value !== undefined && value !== "") url.searchParams.append(key, String(value));
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: this.secrets.apiToken,
    };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    const response = await this.fetchFn(url, {
      method: options.method ?? "GET",
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    const payload = await parseJson(response, url.pathname);
    if (!response.ok) {
      throw new Error(`ClickUp ${options.method ?? "GET"} ${url.pathname} failed: ${errorMessage(payload, response.statusText)}`);
    }
    return { payload, headers: response.headers, status: response.status };
  }
}

function toNumberId(value: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new Error("ClickUp user ID must be a safe integer");
  return id;
}

export function dateToMillis(value: string) {
  const millis = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(millis)) throw new Error("ClickUp due date must be a valid YYYY-MM-DD date");
  return millis;
}

function validateBaseUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("ClickUp base URL must be a valid HTTP(S) URL");
  }
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password || url.search || url.hash) {
    throw new Error("ClickUp base URL must be an HTTP(S) URL without credentials, query parameters, or fragments");
  }
}

async function parseJson(response: Response, path: string): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Invalid JSON from ClickUp ${path}`);
  }
}

function errorMessage(value: unknown, fallback: string) {
  if (value && typeof value === "object") {
    const record = value as JsonObject;
    for (const key of ["err", "ECODE", "message"]) {
      if (typeof record[key] === "string" && record[key]) return record[key] as string;
    }
  }
  return fallback || "request failed";
}
