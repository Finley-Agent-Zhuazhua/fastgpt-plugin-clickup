import type { InputSchemaMetaType, OutputSchemaMetaType, SecretSchemaMetaType } from "@fastgpt-plugin/sdk-factory";
import z from "zod";

const text = (title: string, description: string, max = 1024) =>
  z.string().min(1).max(max).meta({ title, description, toolDescription: description } satisfies InputSchemaMetaType);

const id = (title: string, description: string) =>
  text(title, description, 64).regex(/^\d+$/, "Use a numeric ClickUp resource ID.");

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").meta({
  title: "Due Date",
  description: "Due date in YYYY-MM-DD format.",
  toolDescription: "Task due date.",
} satisfies InputSchemaMetaType);

const page = z.number().int().min(0).max(1000).default(0).meta({
  title: "Page",
  description: "Zero-based task page number.",
  toolDescription: "Page number for task pagination.",
} satisfies InputSchemaMetaType);

const priority = z.number().int().min(1).max(4).meta({
  title: "Priority",
  description: "ClickUp priority: 1 urgent, 2 high, 3 normal, 4 low.",
  toolDescription: "Task priority from 1 (urgent) to 4 (low).",
} satisfies InputSchemaMetaType);

export const secretSchema = z.object({
  apiToken: z.string().min(1).max(4096).meta({
    title: "ClickUp API Token",
    description: "ClickUp Personal API Token. Store it as a FastGPT secret.",
    isSecret: true,
  } satisfies SecretSchemaMetaType),
});

export const emptyInputSchema = z.object({});

export const listSpacesInputSchema = z.object({
  teamId: id("Team ID", "ClickUp workspace/team identifier."),
  archived: z.boolean().default(false).meta({
    title: "Include Archived",
    description: "Whether to include archived spaces.",
    toolDescription: "Include archived spaces.",
  } satisfies InputSchemaMetaType),
});

export const listListsInputSchema = z.object({
  spaceId: id("Space ID", "ClickUp space identifier."),
  archived: z.boolean().default(false).meta({
    title: "Include Archived",
    description: "Whether to include archived lists.",
    toolDescription: "Include archived lists.",
  } satisfies InputSchemaMetaType),
});

export const listTasksInputSchema = z.object({
  listId: id("List ID", "ClickUp list identifier."),
  page,
  includeClosed: z.boolean().default(false).meta({
    title: "Include Closed",
    description: "Whether to include closed tasks.",
    toolDescription: "Include closed tasks.",
  } satisfies InputSchemaMetaType),
  subtasks: z.boolean().default(false).meta({
    title: "Include Subtasks",
    description: "Whether to include subtasks.",
    toolDescription: "Include subtasks.",
  } satisfies InputSchemaMetaType),
  includeMarkdownDescription: z.boolean().default(false).meta({
    title: "Markdown Description",
    description: "Whether task descriptions should include Markdown.",
    toolDescription: "Include Markdown task descriptions.",
  } satisfies InputSchemaMetaType),
  orderBy: z.enum(["created", "updated", "due_date", "priority"]).optional().meta({
    title: "Order By",
    description: "Optional ClickUp task ordering field.",
    toolDescription: "Order tasks by created, updated, due date, or priority.",
  } satisfies InputSchemaMetaType),
  reverse: z.boolean().default(false).meta({
    title: "Reverse Order",
    description: "Reverse the selected task order.",
    toolDescription: "Reverse task ordering.",
  } satisfies InputSchemaMetaType),
});

export const getTaskInputSchema = z.object({
  taskId: id("Task ID", "ClickUp task identifier."),
});

export const createTaskInputSchema = z.object({
  listId: id("List ID", "List that will contain the new task."),
  name: text("Task Name", "Name of the new task."),
  description: text("Description", "Optional task description.", 10000).optional(),
  assigneeIds: z.array(id("Assignee ID", "ClickUp user identifier.")).max(20).optional(),
  dueDate: date.optional(),
  dueDateTime: z.boolean().default(false).meta({
    title: "Due Date Has Time",
    description: "Whether the due date includes a time of day.",
    toolDescription: "Treat due date as a timestamp.",
  } satisfies InputSchemaMetaType),
  priority: priority.optional(),
  notifyAll: z.boolean().default(false).meta({
    title: "Notify All",
    description: "Notify all assignees when creating the task.",
    toolDescription: "Notify all assignees.",
  } satisfies InputSchemaMetaType),
});

export const updateTaskInputSchema = z.object({
  taskId: id("Task ID", "Task to update."),
  name: text("Task Name", "Replacement task name.").optional(),
  description: text("Description", "Replacement task description.", 10000).optional(),
  status: text("Status", "ClickUp status name.", 128).optional(),
  priority: priority.optional(),
  dueDate: date.optional(),
  dueDateTime: z.boolean().optional().meta({
    title: "Due Date Has Time",
    description: "Whether the due date includes a time of day.",
    toolDescription: "Treat due date as a timestamp.",
  } satisfies InputSchemaMetaType),
  addAssigneeIds: z.array(id("Assignee ID", "ClickUp user identifier.")).max(20).optional(),
  removeAssigneeIds: z.array(id("Assignee ID", "ClickUp user identifier.")).max(20).optional(),
  notifyAll: z.boolean().optional().meta({
    title: "Notify All",
    description: "Notify assignees about the update.",
    toolDescription: "Notify assignees.",
  } satisfies InputSchemaMetaType),
}).refine((value) => Object.keys(value).length > 1, "Provide at least one task field to update.");

const success = z.literal(true).meta({ title: "Success" } satisfies OutputSchemaMetaType);
const object = z.record(z.string(), z.unknown());

export const listOutputSchema = z.object({
  success,
  items: z.array(object),
  hasMore: z.boolean(),
  nextPage: z.number().int().min(0).optional(),
});

export const entityOutputSchema = z.object({ success, data: object });

export type ClickUpSecrets = z.output<typeof secretSchema>;
export type EmptyInput = z.output<typeof emptyInputSchema>;
export type ListSpacesInput = z.output<typeof listSpacesInputSchema>;
export type ListListsInput = z.output<typeof listListsInputSchema>;
export type ListTasksInput = z.output<typeof listTasksInputSchema>;
export type GetTaskInput = z.output<typeof getTaskInputSchema>;
export type CreateTaskInput = z.output<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.output<typeof updateTaskInputSchema>;
export type EntityOutput = z.output<typeof entityOutputSchema>;
export type ListOutput = z.output<typeof listOutputSchema>;
