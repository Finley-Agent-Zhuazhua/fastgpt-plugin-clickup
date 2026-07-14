import { ClickUpClient } from "./client";
import type {
  ClickUpSecrets,
  CreateTaskInput,
  EntityOutput,
  GetTaskInput,
  ListListsInput,
  ListOutput,
  ListSpacesInput,
  ListTasksInput,
  UpdateTaskInput,
} from "./schemas";

type WithSecrets<T> = T & ClickUpSecrets;
type JsonObject = Record<string, unknown>;

export async function listTeams(input: ClickUpSecrets): Promise<ListOutput> {
  const payload = asObject((await new ClickUpClient(input).listTeams()).payload, "teams response");
  return listResponse(payload, "teams", "teams");
}

export async function listSpaces(input: WithSecrets<ListSpacesInput>): Promise<ListOutput> {
  const payload = asObject((await new ClickUpClient(input).listSpaces(input)).payload, "spaces response");
  return listResponse(payload, "spaces", "spaces");
}

export async function listLists(input: WithSecrets<ListListsInput>): Promise<ListOutput> {
  const payload = asObject((await new ClickUpClient(input).listLists(input)).payload, "lists response");
  return listResponse(payload, "lists", "lists");
}

export async function listTasks(input: WithSecrets<ListTasksInput>): Promise<ListOutput> {
  const payload = asObject((await new ClickUpClient(input).listTasks(input)).payload, "tasks response");
  const response = listResponse(payload, "tasks", "tasks");
  const lastPage = payload.last_page;
  if (typeof lastPage !== "boolean") throw new Error("ClickUp tasks response last_page must be a boolean");
  return lastPage ? response : { ...response, hasMore: true, nextPage: input.page + 1 };
}

export async function getTask(input: WithSecrets<GetTaskInput>): Promise<EntityOutput> {
  return entityResponse((await new ClickUpClient(input).getTask(input.taskId)).payload, "task");
}

export async function createTask(input: WithSecrets<CreateTaskInput>): Promise<EntityOutput> {
  return entityResponse((await new ClickUpClient(input).createTask(input)).payload, "task");
}

export async function updateTask(input: WithSecrets<UpdateTaskInput>): Promise<EntityOutput> {
  return entityResponse((await new ClickUpClient(input).updateTask(input)).payload, "task");
}

function entityResponse(payload: unknown, kind: string): EntityOutput {
  return { success: true, data: asObject(payload, kind) };
}

function listResponse(payload: JsonObject, key: string, kind: string): ListOutput {
  const values = payload[key];
  if (!Array.isArray(values)) throw new Error(`ClickUp ${kind} response ${key} must be an array`);
  return {
    success: true,
    items: values.map((value) => asObject(value, `${kind} item`)),
    hasMore: false,
  };
}

function asObject(value: unknown, kind: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`ClickUp ${kind} must be an object`);
  return value as JsonObject;
}
