# 开奖数字彩色显示组件使用说明

## 概述

这个组件用于以10种不同颜色显示开奖数字，每个位置对应一种固定颜色，提供了多种尺寸和样式选项。

## 颜色方案

| 位置 | 颜色代码 | 颜色名称 | 文字颜色 |
|------|----------|----------|----------|
| 第1位 | #FF6B6B | 红色 | 白色 |
| 第2位 | #4ECDC4 | 青色 | 白色 |
| 第3位 | #45B7D1 | 蓝色 | 白色 |
| 第4位 | #96CEB4 | 绿色 | 白色 |
| 第5位 | #FFEAA7 | 黄色 | 深色 |
| 第6位 | #DDA0DD | 紫色 | 白色 |
| 第7位 | #98D8C8 | 薄荷绿 | 深色 |
| 第8位 | #F7DC6F | 金色 | 深色 |
| 第9位 | #BB8FCE | 淡紫色 | 白色 |
| 第10位 | #85C1E9 | 天蓝色 | 白色 |

## 基本用法

### 1. 引入文件

```html
<!-- CSS -->
<link rel="stylesheet" href="styles/winning-numbers.css">

<!-- JavaScript -->
<script src="scripts/winning-numbers.js"></script>
```

### 2. 基本渲染

```javascript
// 开奖数字数组（必须包含10个数字）
const numbers = [3, 7, 1, 9, 5, 2, 8, 4, 6, 10];

// 基本渲染
const html = WinningNumbers.render(numbers);
document.getElementById('container').innerHTML = html;
```

## API 参考

### WinningNumbers.render(numbers, options)

渲染开奖数字的主要方法。

**参数：**
- `numbers` (Array): 开奖数字数组，必须包含10个数字
- `options` (Object): 配置选项
  - `size` (string): 尺寸，可选值：'small', 'medium', 'large'，默认 'medium'
  - `showPosition` (boolean): 是否显示位置标识，默认 false
  - `className` (string): 额外的CSS类名，默认 ''

**返回值：** HTML字符串

### WinningNumbers.renderCompact(numbers)

渲染紧凑版本，适用于历史记录列表。

```javascript
const html = WinningNumbers.renderCompact([1,2,3,4,5,6,7,8,9,10]);
```

### WinningNumbers.renderDetailed(numbers)

渲染详细版本，包含位置标识，适用于开奖结果展示。

```javascript
const html = WinningNumbers.renderDetailed([1,2,3,4,5,6,7,8,9,10]);
```

### WinningNumbers.getPositionColor(position)

获取指定位置的颜色信息。

**参数：**
- `position` (number): 位置索引（0-9）

**返回值：** 
```javascript
{
  backgroundColor: '#FF6B6B',
  textColor: '#FFFFFF'
}
```

### WinningNumbers.applyColorsToExisting(container, numbers)

为现有的数字元素添加颜色。

**参数：**
- `container` (HTMLElement): 容器元素
- `numbers` (Array): 开奖数字数组

## 使用示例

### 1. 在历史记录中使用

```javascript
// 替换原有的数字显示
historyList.innerHTML = rounds.map(round => `
    <div class="history-item">
        <span class="round-number">第${round.round_number}期</span>
        <span class="winning-numbers">
            ${WinningNumbers.renderCompact(round.winning_numbers)}
        </span>
        <span class="round-time">${formatTime(round.draw_time)}</span>
    </div>
`).join('');
```

### 2. 在模态框中使用

```javascript
const tableHTML = `
    <table class="data-table">
        <tbody>
            ${rounds.map(round => `
                <tr>
                    <td>第${round.round_number}期</td>
                    <td class="winning-numbers">
                        ${WinningNumbers.render(round.winning_numbers, { size: 'small' })}
                    </td>
                    <td>${formatTime(round.draw_time)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
`;
```

### 3. 开奖结果展示

```javascript
// 大尺寸，带位置标识
const resultHTML = WinningNumbers.renderDetailed(winningNumbers);
document.getElementById('lottery-result').innerHTML = resultHTML;
```

### 4. 添加动画效果

```javascript
// 渲染数字
container.innerHTML = WinningNumbers.render(numbers, { size: 'large' });

// 添加动画
const items = container.querySelectorAll('.winning-number-item');
items.forEach(item => {
    item.classList.add('animate');
});

// 动画结束后清理
setTimeout(() => {
    items.forEach(item => {
        item.classList.remove('animate');
    });
}, 2000);
```

## 样式定制

### CSS 变量

可以通过CSS变量自定义样式：

```css
.winning-numbers-container {
    --number-size: 32px;
    --number-gap: 4px;
    --border-radius: 6px;
}
```

### 自定义尺寸

```css
.winning-numbers-custom .winning-number-item {
    width: 40px;
    height: 40px;
    font-size: 16px;
}
```

## 响应式设计

组件已内置响应式设计，在不同屏幕尺寸下会自动调整：

- 桌面端：完整尺寸
- 平板端：适中尺寸
- 手机端：紧凑尺寸

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事项

1. 开奖数字数组必须包含恰好10个数字
2. 数字应该在1-10范围内（用于显示）
3. 组件会自动处理无效数据并显示错误信息
4. 建议在数据加载完成后再渲染组件
