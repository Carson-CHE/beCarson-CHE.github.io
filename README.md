# 数学王国 · 小学数学趣味学习平台

纯前端 H5 应用，无需服务器后端。本目录即 GitHub Pages 部署包，`index.html` 位于根目录。

## 网站结构

```
.
├── index.html        # 入口页面（已含移动端适配 meta）
├── css/style.css     # 样式（含 iPhone / iPad 响应式）
├── js/data.js        # 课程体系 / 等级 / 成就数据
├── js/gen.js         # 20 种题型生成器
├── js/app.js         # 主程序（账号、进度、错题本、推荐）
└── .nojekyll         # 跳过 GitHub Jekyll 处理
```

## 部署到 GitHub Pages（3 步）

### 方式一：网页上传（最快，无需命令行）

1. 登录 [github.com](https://github.com)，右上角 **+** → **New repository**
   - 仓库名建议：`math-kingdom`
   - 选择 **Public**（Pages 免费版必须公开）
   - 点击 **Create repository**
2. 在新仓库页面点击 **uploading an existing file**，
   把本目录里的 `index.html`、`css/` 文件夹、`js/` 文件夹、`.nojekyll` 全部拖进去
   （文件夹拖入后会自动保留目录结构），点击 **Commit changes**。
   > 提示：`.nojekyll` 是隐藏文件，浏览器可能选不中，可跳过——本站没有下划线开头的目录，不加也能正常工作。
3. 仓库 **Settings** → 左侧 **Pages** → **Branch** 选择 `main`，目录 `/ (root)`，点击 **Save**。

等待 1~2 分钟，访问：

```
https://<你的GitHub用户名>.github.io/math-kingdom/
```

即为可分享给任何人的永久链接。

### 方式二：命令行推送

```bash
cd math-kingdom-gh-pages
git init
git add -A
git commit -m "feat: 数学王国 v1"
git branch -M main
git remote add origin https://github.com/<你的用户名>/math-kingdom.git
git push -u origin main
```

然后同方式一第 3 步开启 Pages。

## 部署后

- **更新内容**：改完文件后重新 push（或网页重新上传覆盖），Pages 约 1 分钟自动生效
- **自定义域名**（可选）：Settings → Pages → Custom domain 填入你的域名并配置 DNS CNAME
- **换密码方案**：当前账号密码仅存于各设备浏览器 localStorage，用于区分进度，无服务器，属儿童练习用途的轻量方案

## 本地预览

```bash
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765
```
