# FastGPT ClickUp 插件

将 ClickUp 的工作区、空间、列表和任务管理能力接入 FastGPT，适合项目管理问答、任务创建/更新和流程自动化。

## 能力

这是一个 `tool-suite`（工具集），包含：

- `listTeams`：查询当前 API Token 可访问的工作区
- `listSpaces`：查询工作区空间
- `listLists`：查询空间中的列表
- `listTasks`：分页查询列表任务
- `getTask`：读取单个任务
- `createTask`：创建任务，可设置描述、负责人、优先级和截止日期
- `updateTask`：更新任务字段、状态和负责人

所有 ClickUp 资源 ID 都按数字字符串校验。任务列表返回 `hasMore` 和 `nextPage`，下一次调用可把 `nextPage` 传回 `page`。

## Secret

在 FastGPT 中配置一个 secret：

- `apiToken`：ClickUp Personal API Token（或兼容 ClickUp API v2 的访问令牌）。请按最小权限原则配置，不要把 token 放进输入参数、README、测试或 Git 历史。

插件调用 ClickUp API v2：`https://api.clickup.com/api/v2`，认证请求头为 `Authorization: <apiToken>`。测试使用 mock fetch 覆盖请求构造、响应解析、分页和错误路径；本地没有 ClickUp 凭证，因此未执行真实 API 集成测试。

## 本地开发

```bash
pnpm install
pnpm test
pnpm type-check
pnpm build
pnpm check
pnpm run pack
```

`pnpm run pack` 会生成 `clickup.pkg`。不要提交本地 secret 文件、token 或生成目录。
