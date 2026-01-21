---
description: 快速網頁開發的最佳實踐與避免常見陷阱
---

# 快速網頁開發最佳實踐

## 開發效率原則

### 1. 先簡後複雜
- 永遠從最簡單的實作開始
- 確認基礎功能正常後再加入進階效果
- 避免一開始就使用過度複雜的 CSS 技巧

### 2. 優先使用現代 CSS 屬性
| 需求 | 推薦方案 | 避免方案 |
|------|---------|---------|
| 元素裁切 | `clip-path` | `overflow: hidden` + 複雜定位 |
| 置中對齊 | `display: flex` | `line-height` 技巧 |
| 動畫 | `@keyframes` | 複雜的 `:hover` 狀態機 |
| 響應式 | CSS Variables + Media Query | 硬編碼數值 |

### 3. 本地測試優先
- 每次修改後立即在本地測試
- 使用 `file://` 協定直接開啟 HTML 檔案
- 確認本地正常後再部署

### 4. 簡化 DOM 結構
- 避免不必要的包裝元素 (`<span>`, `<div>`)
- 使用 CSS 選擇器直接操作目標元素
- 減少 JavaScript DOM 查詢的複雜度

## CSS 除錯技巧

### 常見 CSS 問題與解法

| 問題 | 原因 | 解法 |
|------|------|------|
| 上下半部數字不對齊 | line-height 計算錯誤 | 改用 `clip-path` |
| 動畫閃爍 | z-index 衝突 | 使用 keyframes 明確控制 |
| 元素重疊 | 定位基準不一致 | 統一使用 flexbox |
| 響應式失效 | 硬編碼尺寸 | 使用 CSS Variables |

### 強制重繪技巧
當需要重新觸發 CSS 動畫時：
```javascript
element.classList.remove('animating');
void element.offsetWidth;  // 強制重繪
element.classList.add('animating');
```

## 部署檢查清單

- [ ] 本地測試通過
- [ ] 所有資源路徑使用相對路徑
- [ ] 移除 console.log 除錯訊息
- [ ] 確認 Service Worker 快取版本更新
- [ ] 瀏覽器硬重新整理測試 (Ctrl+Shift+R)
