# 项目动态

官网的 `/activity.html` 读取这个 Worker 的公开 API。Worker 和网站一同维护，单独部署，不使用 OTA 服务或自定义域名。

## 首次部署

从本目录运行。先在浏览器授权 `pnpm exec cf auth login --no-browser`，再确认 `pnpm exec cf auth whoami` 显示的是预期的 Cloudflare 账号。

```sh
pnpm exec cf d1 create --name uwuaosp-activity
export ACTIVITY_D1_ID='<上一步返回的 uuid>'
pnpm exec cf d1 migrations apply "$ACTIVITY_D1_ID"
```

生成 Webhook Secret，在本机妥善保留。把它写入临时的 `0600` 权限文件，采用 `GITHUB_WEBHOOK_SECRET=<值>` 格式；使用 `pnpm exec cf deploy --secrets-file <临时文件>` 部署。确认部署成功后删除临时文件，不要提交文件或把 Secret 发到聊天里。后续部署继续使用同一个 `ACTIVITY_D1_ID`。

在 **uwuAOSP → Settings → Webhooks → Add webhook** 中填写：

- **Payload URL**：`https://<部署输出中的 Worker 主机名>/webhooks/github`
- **Content type**：`application/json`
- **Secret**：上面相同的值，保持 SSL verification 开启。
- **Let me select individual events**：选择 **Pushes、Pull requests、Issues、Releases、Repositories**。Repositories 用于仓库改名、删除或变为私有时同步。

在 Recent Deliveries 检查 `ping` 返回 `204`。页面公开显示的活动也可以通过 `GET /v1/activity` 查看。

搜索可用文本、`repo:uwuAOSP/platform_packages_apps_Updater`，也可以组合，例如 `repo:uwuAOSP/platform_packages_apps_Updater updater`。页面和 API 都用 `q` 参数传递查询。

官网默认读取已部署的 `uwuaosp-activity.uwuaosp-website.workers.dev`。测试其他环境时，可以在官网目录构建时覆盖 API 地址：

```sh
VITE_ACTIVITY_API_URL=https://<Worker 主机名>/v1/activity pnpm docs:build
```

## 补录近期动态

`node backfill.mjs <新的临时目录>` 读取 GitHub 公开仓库最近 30 天可查到的活动，生成 D1 批次文件，不直接写生产数据库。需要主机已登录 `gh`。核对范围后，从本目录按文件名顺序执行 `pnpm exec cf d1 query "$ACTIVITY_D1_ID" --batch @<批次.json>`。

补录使用 GitHub 记录的默认分支推送时间、PR 合并时间、公开发布和 Issue 时间线；已收录的记录不会被覆盖。GitHub 不会自动重投失败的 Webhook，可在组织 Webhook 的 Recent Deliveries 中手动重投。
