石头剪刀布游戏
这是一个基于 Node.js 和 Cloudflare Workers 的石头剪刀布游戏，通过摄像头捕获用户手势并与 AI 对战。游戏使用 SiliconFlow 的 AI 模型进行手势识别和 AI 出拳，前端使用 HTML5 和 JavaScript 实现，部署在 Cloudflare Workers 上。
功能

实时手势识别：通过摄像头捕获用户的手势（石头、剪刀、布），并使用 AI 模型进行识别。
AI 对战：AI 随机出拳（石头、剪刀、布），并根据规则判断胜负。
图像优化：前端对捕获的图像进行压缩和调整大小，优化传输效率。
跨域支持：后端支持 CORS，允许前端部署在不同域名。
错误处理：包含健壮的错误处理机制，确保用户体验流畅。

技术栈

前端：HTML5, JavaScript, CSS
后端：Cloudflare Workers, JavaScript
AI 模型：
手势识别：Pro/Qwen/Qwen2.5-VL-7B-Instruct（SiliconFlow API）
AI 出拳：Qwen/Qwen3-8B（SiliconFlow API）


依赖：无额外前端框架，仅依赖浏览器原生 API 和 Cloudflare Workers 运行时

安装与部署
前提条件

Node.js（用于本地开发和测试，可选）
Cloudflare 账户和 Wrangler CLI（用于部署 Workers）
SiliconFlow API 密钥（用于手势识别和 AI 出拳）

安装步骤

克隆仓库：
git clone https://github.com/<你的用户名>/<仓库名>.git
cd <仓库名>


配置 SiliconFlow API 密钥：

注册 SiliconFlow 账户并获取 API 密钥。
在 Cloudflare Workers 控制面板中，进入你的 Worker 项目，添加环境变量：
变量名：API_KEY
变量值：<你的 SiliconFlow API 密钥>




部署到 Cloudflare Workers：

安装 Wrangler CLI（如果尚未安装）：npm install -g @cloudflare/wrangler


登录 Cloudflare：wrangler login


部署 worker.js：wrangler deploy worker.js


记录返回的 Worker URL（例如 https://rpsbackend.<你的账户>.workers.dev）。


部署前端：

将 index.html 托管到静态文件服务（如 Cloudflare Pages、Vercel 或 GitHub Pages）。
更新 index.html 中的 Worker URL（替换 https://rpsbackend.lucyfer81.workers.dev/ 为你的 Worker URL）：const response = await fetch('https://<你的 Worker URL>/', { ... });





本地开发（可选）

将 index.html 放入本地 Web 服务器（例如使用 http-server）：npm install -g http-server
http-server .


访问 http://localhost:8080 测试前端。
使用 wrangler dev 运行本地 Worker：wrangler dev worker.js



使用说明

打开游戏页面（部署后的 index.html）。
允许浏览器访问摄像头。
摆出石头、剪刀或布的手势。
点击“出拳”按钮，游戏将捕获你的手势，AI 同时出拳，并显示结果（例如“你出: 石头, AI 出: 布, 结果: AI 赢了”）。

注意：

确保手势清晰，背景简洁，以提高识别准确性。
如果遇到“无法访问摄像头”或“无法识别手势”错误，请检查摄像头权限或调整手势。

项目结构
├── index.html       # 前端页面，包含摄像头捕获和游戏逻辑
├── worker.js        # Cloudflare Workers 脚本，处理手势识别和 AI 出拳
└── README.md        # 项目说明

故障排除

错误：无法识别手势：
检查 SiliconFlow API 密钥是否正确配置。
确保手势清晰，背景无干扰。


错误：请求失败：
确认 Worker URL 是否正确。
检查网络连接或 Cloudflare Workers 的运行状态。


错误：摄像头无法访问：
确保浏览器已授予摄像头权限。
检查设备是否支持 navigator.mediaDevices.getUserMedia。



贡献
欢迎提交 Issue 或 Pull Request！请遵循以下步骤：

Fork 本仓库。
创建你的功能分支（git checkout -b feature/xxx）。
提交更改（git commit -m 'Add xxx feature'）。
推送到分支（git push origin feature/xxx）。
创建 Pull Request。

许可证
本项目使用 MIT 许可证。详情见 LICENSE 文件。
致谢

Cloudflare Workers：提供高效的后端运行环境。
SiliconFlow：提供强大的 AI 模型支持。
