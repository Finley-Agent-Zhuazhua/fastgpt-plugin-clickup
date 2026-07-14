import { createToolHandler, defineToolSet } from "@fastgpt-plugin/sdk-factory";
import {
  createTask,
  getTask,
  listLists,
  listSpaces,
  listTasks,
  listTeams,
  updateTask,
} from "./src/operations";
import {
  createTaskInputSchema,
  emptyInputSchema,
  entityOutputSchema,
  getTaskInputSchema,
  listListsInputSchema,
  listOutputSchema,
  listSpacesInputSchema,
  listTasksInputSchema,
  secretSchema,
  updateTaskInputSchema,
  type ClickUpSecrets,
} from "./src/schemas";

function requireSecrets(secrets: ClickUpSecrets | undefined): ClickUpSecrets {
  if (!secrets?.apiToken?.trim()) throw new Error("ClickUp apiToken secret is required");
  return secrets;
}

const listTeamsHandler = createToolHandler({
  inputSchema: emptyInputSchema,
  outputSchema: listOutputSchema,
  secretSchema,
  handler: async (_input, ctx) => listTeams(requireSecrets(ctx.secrets)),
});

const listSpacesHandler = createToolHandler({
  inputSchema: listSpacesInputSchema,
  outputSchema: listOutputSchema,
  secretSchema,
  handler: async (input, ctx) => listSpaces({ ...input, ...requireSecrets(ctx.secrets) }),
});

const listListsHandler = createToolHandler({
  inputSchema: listListsInputSchema,
  outputSchema: listOutputSchema,
  secretSchema,
  handler: async (input, ctx) => listLists({ ...input, ...requireSecrets(ctx.secrets) }),
});

const listTasksHandler = createToolHandler({
  inputSchema: listTasksInputSchema,
  outputSchema: listOutputSchema,
  secretSchema,
  handler: async (input, ctx) => listTasks({ ...input, ...requireSecrets(ctx.secrets) }),
});

const getTaskHandler = createToolHandler({
  inputSchema: getTaskInputSchema,
  outputSchema: entityOutputSchema,
  secretSchema,
  handler: async (input, ctx) => getTask({ ...input, ...requireSecrets(ctx.secrets) }),
});

const createTaskHandler = createToolHandler({
  inputSchema: createTaskInputSchema,
  outputSchema: entityOutputSchema,
  secretSchema,
  handler: async (input, ctx) => createTask({ ...input, ...requireSecrets(ctx.secrets) }),
});

const updateTaskHandler = createToolHandler({
  inputSchema: updateTaskInputSchema,
  outputSchema: entityOutputSchema,
  secretSchema,
  handler: async (input, ctx) => updateTask({ ...input, ...requireSecrets(ctx.secrets) }),
});

export default defineToolSet({
  manifest: {
    pluginId: "clickup",
    name: { en: "ClickUp", "zh-CN": "ClickUp" },
    description: {
      en: "Manage ClickUp spaces, lists, tasks, and project workflows.",
      "zh-CN": "管理 ClickUp 空间、列表、任务和项目流程。",
    },
    version: "0.1.0",
    versionDescription: {
      en: "Initial ClickUp workspace and task-management tools.",
      "zh-CN": "初始 ClickUp 工作区和任务管理工具。",
    },
    toolDescription: "Use a ClickUp API token to inspect workspaces and manage project tasks.",
    tutorialUrl: "https://clickup.com/api",
    tags: ["tools", "productivity"],
    permission: [],
  },
  secretSchema,
  children: [
    {
      id: "listTeams",
      name: { en: "List Workspaces", "zh-CN": "查询工作区" },
      description: { en: "List accessible ClickUp workspaces.", "zh-CN": "查询可访问的 ClickUp 工作区。" },
      toolDescription: "List the workspaces available to the configured API token.",
      handler: listTeamsHandler,
    },
    {
      id: "listSpaces",
      name: { en: "List Spaces", "zh-CN": "查询空间" },
      description: { en: "List spaces in a ClickUp workspace.", "zh-CN": "查询 ClickUp 工作区中的空间。" },
      toolDescription: "List spaces for a workspace, optionally including archived spaces.",
      handler: listSpacesHandler,
    },
    {
      id: "listLists",
      name: { en: "List Lists", "zh-CN": "查询列表" },
      description: { en: "List task lists in a ClickUp space.", "zh-CN": "查询 ClickUp 空间中的任务列表。" },
      toolDescription: "List task lists for a space, optionally including archived lists.",
      handler: listListsHandler,
    },
    {
      id: "listTasks",
      name: { en: "List Tasks", "zh-CN": "查询任务" },
      description: { en: "List and paginate tasks in a ClickUp list.", "zh-CN": "分页查询 ClickUp 列表中的任务。" },
      toolDescription: "List tasks with closed-task, subtask, ordering, and pagination controls.",
      handler: listTasksHandler,
    },
    {
      id: "getTask",
      name: { en: "Get Task", "zh-CN": "读取任务" },
      description: { en: "Read one ClickUp task.", "zh-CN": "读取一个 ClickUp 任务。" },
      toolDescription: "Retrieve a task by its ClickUp ID.",
      handler: getTaskHandler,
    },
    {
      id: "createTask",
      name: { en: "Create Task", "zh-CN": "创建任务" },
      description: { en: "Create a ClickUp task in a list.", "zh-CN": "在 ClickUp 列表中创建任务。" },
      toolDescription: "Create a task with optional description, assignees, due date, and priority.",
      handler: createTaskHandler,
    },
    {
      id: "updateTask",
      name: { en: "Update Task", "zh-CN": "更新任务" },
      description: { en: "Update a ClickUp task and its assignees.", "zh-CN": "更新 ClickUp 任务及其负责人。" },
      toolDescription: "Update task fields, status, priority, due date, and assignees.",
      handler: updateTaskHandler,
    },
  ],
});
