---
description: 部署靜態網站到 GitHub Pages 的標準流程
---

# 部署到 GitHub Pages

## 前置條件
- 已有 Git 倉庫並推送到 GitHub
- 專案為靜態網站 (HTML/CSS/JS)

## 步驟

### 1. 建立 GitHub Actions Workflow

在專案根目錄建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 2. 提交並推送

```bash
git add -A
git commit -m "ci: add GitHub Actions workflow for Pages deployment"
git push origin main
```

### 3. 驗證部署

// turbo
前往 `https://github.com/{username}/{repo}/actions` 確認 workflow 執行成功

### 4. 存取網站

部署完成後，網站網址為：
`https://{username}.github.io/{repo}/`

## 注意事項

- 首次部署可能需要幾分鐘
- 如果網站未更新，嘗試清除瀏覽器快取或使用硬重新整理 (Ctrl+Shift+R)
- 確保 `index.html` 在專案根目錄
