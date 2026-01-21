---
description: 使用 CSS clip-path 實作上下分割的翻頁卡片效果
---

# Split-Card Flip Animation (翻頁卡片動畫)

## 問題背景
在實作翻頁時鐘或類似的分割卡片動畫時，常見錯誤做法：
- 使用 `line-height` 技巧來裁切文字上下半部 → **會失敗**
- 使用 `transform: translateY()` 移動文字 → **對齊困難**
- 過度複雜的 CSS 嵌套結構 → **難以維護和除錯**

## 正確解決方案：clip-path

使用 `clip-path: inset()` 裁切元素的可見區域，是最可靠的方法。

### CSS 結構

```css
/* 容器 */
.flip-unit {
    position: relative;
    width: 120px;
    height: 160px;
    perspective: 400px;
}

.flip-card {
    position: relative;
    width: 100%;
    height: 100%;
}

/* 每個分割區塊 - 使用 clip-path 只顯示一半 */
.flip-card > div {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;  /* 注意：高度是 100%，不是 50% */
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 6rem;
    font-weight: bold;
    background: var(--card-bg);
    border-radius: 10px;
    backface-visibility: hidden;
}

/* 上半部 - 裁切掉下方 50% */
.flip-card .top {
    clip-path: inset(0 0 50% 0);  /* 上 右 下 左 */
    z-index: 3;
    transform-origin: bottom center;
}

/* 下半部 - 裁切掉上方 50% */
.flip-card .bottom {
    clip-path: inset(50% 0 0 0);
    z-index: 1;
}

/* 翻轉動畫 */
.flip-card.flipping .top {
    animation: flipTopDown 0.5s ease-in forwards;
}

@keyframes flipTopDown {
    0% { transform: rotateX(0deg); }
    100% { transform: rotateX(-180deg); }
}
```

### HTML 結構

```html
<div class="flip-unit">
    <div class="flip-card">
        <div class="top">00</div>
        <div class="bottom">00</div>
        <div class="top-back">00</div>
        <div class="bottom-back">00</div>
    </div>
</div>
```

### JavaScript 邏輯

```javascript
function flipUpdate(card, val, prev) {
    if (val === prev) return;

    const top = card.querySelector('.top');
    const bottom = card.querySelector('.bottom');
    const topBack = card.querySelector('.top-back');
    const bottomBack = card.querySelector('.bottom-back');

    // 首次執行，直接設定值
    if (prev === null) {
        top.textContent = val;
        bottom.textContent = val;
        topBack.textContent = val;
        bottomBack.textContent = val;
        return;
    }

    // 準備動畫：舊值在 top/bottom，新值在 back
    top.textContent = prev;
    bottom.textContent = prev;
    topBack.textContent = val;
    bottomBack.textContent = val;

    // 觸發動畫
    card.classList.remove('flipping');
    void card.offsetWidth;  // 強制重繪
    card.classList.add('flipping');

    // 動畫完成後更新
    setTimeout(() => {
        card.classList.remove('flipping');
        top.textContent = val;
        bottom.textContent = val;
    }, 500);
}
```

## 關鍵原則

1. **每個分割區塊都是 100% 高度**：讓文字正常置中，再用 clip-path 裁切
2. **clip-path 比 overflow 更可靠**：不會因為 transform 或 line-height 影響
3. **簡化 DOM 結構**：避免不必要的 span 或包裝元素
4. **使用 keyframes 而非 transition**：對於複雜的多步驟動畫更容易控制
