# 宋瓷 · 八窑

正式网页版 **1.0.0**。从旋转泥坯进入八窑世界，探索釉色、窑火和二十四幕器物生活场景。支持触屏拖动、键盘导航、器物解读与环境音。

## 运行与构建

需要 Node.js 22.12+（本次使用 24.15.0）和 npm。

```sh
npm ci
npm run dev
npm run build:release
```

开发默认入口也是正式页面；仅开发服务的 `/?preview=1` 保留 iPhone / Pixel 设备预览。生产构建始终使用正式页面，不含可启用的预览入口。手机使用实际视口与安全区，桌面保持适合竖屏内容的居中画幅。

`release/song-ceramics-web-1.0.0.zip` 是域名部署包；`dist/client` 是等价的静态网站目录。历史素材、源码、测试、node_modules 和环境配置不包含在 ZIP 中。发布包附带第三方许可、文件清单和 SHA256 校验值。

## 部署到域名

将 ZIP 解压到静态网站的**站点根目录**，配置 HTTPS 与正确的 MIME 类型。此版素材使用 `/assets/...` 绝对路径，不支持直接放在 `/some/subdirectory/` 下，也不能通过双击 HTML 的 `file://` 方式运行。

- `/` 提供 `index.html`，未知页面路由可以回退到该文件；缺失媒体应保持 404。
- 视频服务需支持 HTTP Range 请求（206），`video/mp4`；字体使用 `font/woff2`；GLB 使用 `model/gltf-binary`。
- `index.html` 和 `version.json` 使用重新验证缓存；带内容哈希的 JS/CSS 可长期缓存。
- 媒体文件名并非全部包含内容哈希，请使用重新验证或短缓存；更新时不要给这些固定文件名永久缓存。
- 可用 `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4180` 在本机检查生产构建。

项目原有 Sites/Cloudflare Worker 构建仍保留在 `dist/server` 和 `dist/.openai`。本次不修改线上站点；尚未配置 Git 远程地址或实际域名。

## 验证

```sh
npm run check:runtime
npm test
npm run test:runtime
npm run test:release
```

浏览器测试需要 Playwright Chromium，可用 `npx playwright install chromium` 安装，也可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定兼容的本地 Chromium。正式入口测试针对 `dist/client`，请先构建。包含手机/桌面布局、泥坯入口、器物阅读、三幕切换、返回与资源错误检查。

若受限环境无法自动停止子服务，可先单独启动测试服务，再设置 `PLAYWRIGHT_EXTERNAL_SERVER=1` 运行测试：正式版服务端口为 4180，运行时夹具使用 `MOBILE_RUNTIME_TEST_PORT`（默认 4174）。该开关仅取消测试工具代管服务，不跳过任何断言。

## 版本与限制

发布范围和验证结果见 `RELEASE_NOTES.md`，后续接手续读 `HANDOFF.md`；`PROJECT_HANDOFF.md` 保留早期设计历史，冲突时以当前代码与最新 `HANDOFF.md` 为准。

当前是在线网页版，无账号、后台数据库或离线缓存。音频需用户操作后开启；降低动态效果与播放失败回退沿用原实现。素材较多，建议通过支持 Range 的 CDN/静态服务发布。实际 iOS Safari、Android 真机性能仍需在目标设备上验收。
