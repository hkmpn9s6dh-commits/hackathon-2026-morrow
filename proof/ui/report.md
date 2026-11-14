# UI 量测报告（自动生成）

生成：node scripts/measure-ui.mjs · 结论：**全过**

- 阅读文本：≥ 12px，对比度 ≥ 4.5:1
- 大写小标签：≥ 9.5px，对比度 ≥ 3:1（等宽、字距拉开、非连续阅读文本）
- 可点元素：高度 ≥ 32px；页面不得横向溢出；正文不得被截断
- 背景取区域实测底色（`.window` #0c0e11、页面 #090a0c），不是纯色量的

| 视口 | 选择器 | 档 | 字号 | 对比度 | 背景 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| desktop | `.line.elias p` | 阅读 | 24px | 16.4:1 | rgb(9,10,12) | ✓ |
| desktop | `.prompt` | 阅读 | 12px | 9.2:1 | rgb(9,10,12) | ✓ |
| desktop | `.speaker` | 标签 | 24px | 16.4:1 | rgb(9,10,12) | ✓ |
| desktop | `.plate` | 标签 | 10px | 4.3:1 | rgb(9,10,12) | ✓ |
| desktop | `.gauge-line` | 标签 | 11px | 9.2:1 | rgb(9,10,12) | ✓ |
| desktop | `.instruction` | 标签 | 10.5px | 10.5:1 | rgb(9,10,12) | ✓ |
| desktop | `.runhead` | 标签 | 10px | 6.1:1 | rgb(9,10,12) | ✓ |
| desktop | `.btn` | 标签 | 10.5px | 16.4:1 | rgb(9,10,12) | ✓ |
| desktop | `.tally` | 标签 | 10px | 4.3:1 | rgb(9,10,12) | ✓ |
| laptop | `.line.elias p` | 阅读 | 22.4px | 16.4:1 | rgb(9,10,12) | ✓ |
| laptop | `.prompt` | 阅读 | 12px | 9.2:1 | rgb(9,10,12) | ✓ |
| laptop | `.speaker` | 标签 | 22.4px | 16.4:1 | rgb(9,10,12) | ✓ |
| laptop | `.plate` | 标签 | 10px | 4.3:1 | rgb(9,10,12) | ✓ |
| laptop | `.gauge-line` | 标签 | 11px | 9.2:1 | rgb(9,10,12) | ✓ |
| laptop | `.instruction` | 标签 | 10.5px | 10.5:1 | rgb(9,10,12) | ✓ |
| laptop | `.runhead` | 标签 | 10px | 6.1:1 | rgb(9,10,12) | ✓ |
| laptop | `.btn` | 标签 | 10.5px | 16.4:1 | rgb(9,10,12) | ✓ |
| laptop | `.tally` | 标签 | 10px | 4.3:1 | rgb(9,10,12) | ✓ |
| phone | `.line.elias p` | 阅读 | 20px | 16.4:1 | rgb(9,10,12) | ✓ |
| phone | `.prompt` | 阅读 | 12px | 9.2:1 | rgb(9,10,12) | ✓ |
| phone | `.speaker` | 标签 | 20px | 16.4:1 | rgb(9,10,12) | ✓ |
| phone | `.plate` | 标签 | 10px | 4.3:1 | rgb(9,10,12) | ✓ |
| phone | `.gauge-line` | 标签 | 11px | 9.2:1 | rgb(9,10,12) | ✓ |
| phone | `.instruction` | 标签 | 10.5px | 10.5:1 | rgb(9,10,12) | ✓ |
| phone | `.runhead` | 标签 | 10px | 6.1:1 | rgb(9,10,12) | ✓ |
| phone | `.btn` | 标签 | 10.5px | 16.4:1 | rgb(9,10,12) | ✓ |
| phone | `.tally` | 标签 | 10px | 4.3:1 | rgb(9,10,12) | ✓ |

覆盖：desktop 11 节点 / 2 按钮；laptop 11 节点 / 2 按钮；phone 11 节点 / 2 按钮

## 待修
- 无
