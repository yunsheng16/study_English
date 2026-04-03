# 沉浸式英语阅读器 — Netlify 版

## 部署步骤

### 1. 把这个文件夹推到 GitHub

把 `immersive-reader` 文件夹整个推到你的 GitHub 仓库根目录。
确保仓库里能看到 `netlify.toml` 和 `package.json` 这两个文件在根目录。

### 2. 在 Netlify 配置 Build 设置

进入 Netlify → 你的项目 → **Site configuration → Build & deploy → Build settings**，点 **Configure**，填写：

| 字段 | 值 |
|------|----|
| Base directory | （留空） |
| Build command | `npm run build` |
| Publish directory | `.next` |

> ⚠️ 如果你之前填了 `immersive-reader` 作为 Base directory，**改成留空**，这是最常见的错误原因。

### 3. 添加 API Key（关键！）

进入 Netlify → **Site configuration → Environment variables**，点 **Add a variable**：

| 变量名 | 值 |
|--------|-----|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek Key（`sk-...`） |

或者用 Anthropic：

| 变量名 | 值 |
|--------|-----|
| `ANTHROPIC_API_KEY` | 你的 Claude Key（`sk-ant-...`） |

### 4. 重新部署

添加环境变量后，进入 **Deploys** 页面，点最新那条部署旁边的 **Retry deploy**。

---

## DeepSeek API Key 在哪里获取？

1. 打开 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册 / 登录
3. 左侧菜单 → **API Keys** → **Create new API key**
4. 复制以 `sk-` 开头的那串 Key
5. 粘贴到 Netlify 环境变量里

---

## 常见问题

**翻译失败 / 查询失败** → 检查环境变量名是否拼写正确（区分大小写），添加后必须重新部署才生效。

**Build 失败** → 确认 Base directory 是否留空，Publish directory 是否为 `.next`。
