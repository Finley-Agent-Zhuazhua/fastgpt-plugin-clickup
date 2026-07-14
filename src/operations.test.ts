import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTask, listSpaces, listTasks, updateTask } from "./operations";
import { secretSchema } from "./schemas";

const secrets = { apiToken: "unit-test-token" };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("ClickUp schemas", () => {
  it("requires a non-empty API token", () => {
    expect(() => secretSchema.parse({ apiToken: "" })).toThrow();
    expect(secretSchema.parse(secrets)).toEqual(secrets);
  });
});

describe("ClickUp operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("builds a paginated task request with ClickUp authentication", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      json({ tasks: [{ id: "task-1", name: "Ship docs" }], last_page: false }),
    );

    await expect(
      listTasks({
        ...secrets,
        listId: "123",
        page: 2,
        includeClosed: true,
        subtasks: true,
        includeMarkdownDescription: true,
        orderBy: "updated",
        reverse: true,
      }),
    ).resolves.toEqual({
      success: true,
      items: [{ id: "task-1", name: "Ship docs" }],
      hasMore: true,
      nextPage: 3,
    });

    const [request, init] = fetchMock.mock.calls[0]!;
    const url = new URL(String(request));
    expect(url.pathname).toBe("/api/v2/list/123/task");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("include_closed")).toBe("true");
    expect(url.searchParams.get("subtasks")).toBe("true");
    expect(url.searchParams.get("order_by")).toBe("updated");
    expect(url.searchParams.get("reverse")).toBe("true");
    expect(init?.headers).toMatchObject({ Authorization: "unit-test-token", Accept: "application/json" });
  });

  it("builds create and update task bodies without exposing credentials", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json({ id: "task-1", name: "Launch" }))
      .mockResolvedValueOnce(json({ id: "task-1", status: { status: "in progress" } }));

    await expect(
      createTask({
        ...secrets,
        listId: "456",
        name: "Launch",
        description: "Release checklist",
        assigneeIds: ["101", "202"],
        dueDate: "2026-08-01",
        dueDateTime: false,
        priority: 2,
        notifyAll: true,
      }),
    ).resolves.toEqual({ success: true, data: { id: "task-1", name: "Launch" } });

    await expect(
      updateTask({
        ...secrets,
        taskId: "task-1".replace("task-", ""),
        status: "in progress",
        addAssigneeIds: ["303"],
        removeAssigneeIds: ["101"],
        notifyAll: false,
      }),
    ).resolves.toEqual({ success: true, data: { id: "task-1", status: { status: "in progress" } } });

    const [createRequest, createInit] = fetchMock.mock.calls[0]!;
    expect(new URL(String(createRequest)).pathname).toBe("/api/v2/list/456/task");
    expect(JSON.parse(String(createInit?.body))).toEqual({
      name: "Launch",
      description: "Release checklist",
      assignees: [101, 202],
      due_date: Date.parse("2026-08-01T00:00:00.000Z"),
      due_date_time: false,
      priority: 2,
      notify_all: true,
    });

    const [updateRequest, updateInit] = fetchMock.mock.calls[1]!;
    expect(new URL(String(updateRequest)).pathname).toBe("/api/v2/task/1");
    expect(updateInit?.method).toBe("PUT");
    expect(JSON.parse(String(updateInit?.body))).toEqual({
      status: "in progress",
      notify_all: false,
      assignees: { add: [303], rem: [101] },
    });
  });

  it("parses spaces and rejects API and malformed-response errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json({ spaces: [{ id: "s1", name: "Product" }] }));
    await expect(listSpaces({ ...secrets, teamId: "789", archived: false })).resolves.toEqual({
      success: true,
      items: [{ id: "s1", name: "Product" }],
      hasMore: false,
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json({ err: "Not authorized", ECODE: "OAUTH_019" }, 401));
    await expect(listSpaces({ ...secrets, teamId: "789", archived: false })).rejects.toThrow(/Not authorized/);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("not-json", { status: 200 }));
    await expect(listSpaces({ ...secrets, teamId: "789", archived: false })).rejects.toThrow(/Invalid JSON/);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json({ spaces: "wrong" }));
    await expect(listSpaces({ ...secrets, teamId: "789", archived: false })).rejects.toThrow(/must be an array/);
  });
});
