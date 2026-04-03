# 沉浸式英语阅读器

点击单词听发音 · 逐句 AI 翻译 · 跟读高亮 · 生词本

---

## 🚀 一键部署到 Vercel（推荐，免费）

### 第一步：把代码上传到 GitHub

1. 打开 [github.com](https://github.com) 注册 / 登录
2. 点击右上角 **+** → **New repository**
3. 仓库名随便填，比如 `immersive-reader`，点 **Create repository**
4. 按页面提示，把这个项目文件夹上传上去：
   ```bash
   cd immersive-reader
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/你的用户名/immersive-reader.git
   git push -u origin main
   ```

### 第二步：部署到 Vercel

1. 打开 [vercel.com](https://vercel.com) 用 GitHub 账号登录
2. 点击 **Add New → Project**
3. 选择你刚创建的 `immersive-reader` 仓库
4. Framework 会自动识别为 **Next.js**，直接点 **Deploy**

### 第三步：添加 API Key（关键！）

部署完成后：
1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量（填其中一个即可）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | 从 [console.anthropic.com](https://console.anthropic.com) 获取 |
| `DEEPSEEK_API_KEY` | `sk-...` | 从 [platform.deepseek.com](https://platform.deepseek.com) 获取 |

3. 添加后点 **Deployments** → 最新部署旁边的 **···** → **Redeploy**
4. 等待重新部署完成（约 1 分钟）

完成！访问 Vercel 给你的网址即可使用。

---

## 💻 本地运行

需要：Node.js 18+

```bash
# 安装依赖
npm install

# 创建本地环境变量文件
cp .env.example .env.local
# 编辑 .env.local，填入你的 API Key

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

---

## 功能说明

- **点击单词**：立即播放英式发音，弹出 tooltip 显示音标和中文释义（AI 实时查词）
- **悬停句子**：显示「▶ 听」和「译」按钮，点译显示该句中文翻译
- **全文朗读**：底部控制栏，支持 0.7×～1.2× 速度，当前句高亮跟随
- **生词本**：点击 tooltip 中的「+ 加入生词本」手动收藏，支持点击复习发音
- **全文翻译**：底部折叠区域，进入阅读页后自动生成

## 费用参考

- **DeepSeek**：极便宜，翻译一篇 1000 词文章约 ¥0.01
- **Anthropic Claude Haiku**：查词用的是最轻量的 Haiku 模型，很便宜
