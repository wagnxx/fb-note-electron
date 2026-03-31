# 本地支持目录说明（app-settings.json）

此文件夹用于放置应用运行期的本地配置说明与样例。主要关注点是 `app-settings.json`（位于 `electron/support/app-settings.json`），该文件会被主进程读取以决定应用的数据/写入目录。

---

## 文件：`app-settings.json`

- 位置：`electron/support/app-settings.json`
- 格式：严格的 JSON，例如：

```json
{
  "settingsDir": "/Users/you/your/path/to/storage"
}
```

- 含义：
  - `settingsDir`：可选。指定应用的用户数据/写入目录（例如笔记、导出、写入内容等）。如果未设置，应用将使用内置的 `support/writing` 目录。

## 生效优先级（从高到低）

1. 环境变量 `SETTINGS_DIR`（若在启动环境中设置，则优先使用）
2. `electron/support/app-settings.json` 中的 `settingsDir` 字段
3. 应用内置默认：`support/writing` 目录（由 `getSupportPath('writing')` 计算得到）

## 安全与注意事项

- 不要把 `settingsDir` 指向项目根目录（仓库的根目录）。主进程里有保护逻辑会拒绝将项目根作为存储目录（除非它恰好就是默认的 `support` 目录）。
- `app-settings.json` 必须是合法 JSON；不要在该文件中放置注释（JSON 不支持注释），否则主进程在同步读取时可能抛出解析错误。
- 推荐的方式是通过应用内的设置界面更改存储目录，或在需要时手动编辑该文件并保证 JSON 合法。
- 如果你想记录注释或示例配置，请使用 `app-settings.json.example`（或本 README），不要向 `app-settings.json` 添加非标准字段或注释行。

## 示例与恢复

- 若不确定当前生效目录，可从应用设置里查看，或在主进程中读取（代码路径：`electron/src/modules/ipc/handlers/settings.ts`）。
- 如果误修改导致应用无法读取配置，删除或重命名 `app-settings.json`，应用会回退到默认 `support/writing` 目录。

---

如果你希望我把 `app-settings.json` 变成一个 `.jsonc` 注释样例或添加一个 `.example` 文件，我可以为你生成一个带注释的示例文件供参考。