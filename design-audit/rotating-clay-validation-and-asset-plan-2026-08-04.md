# 旋转开孔泥坯验证与正式素材制作包

日期：2026-08-04

> 状态：已被用户复核后的 V2 方案替代。当前二维整图旋转动画判定为不通过；仅保留最后的孔内旋纹转场。正式重制方案和提示词见 `design-audit/rotating-clay-generation-plan-v2-zh.md`。

## 1. 验证结论

本轮验证地址：`http://127.0.0.1:4173/?introValidation=rotating`

验证版只在查询参数打开，默认首页仍保持当前无手版，不影响已确认的运行路径。

- iPhone 与 Pixel 10 均完成 `accelerating → entering → hidden`。
- 点击后开孔泥坯会放大并进入孔内旋纹，孔内纹理可以接管到全屏。
- 首屏结束后磁州窑窑火入口正常显示。
- 窑火 → 器物层 → 牡丹梅瓶阅读均正常。
- 两种设备的本轮浏览器控制台均无 `error` / `warn`。

结论：**“开孔泥坯持续旋转，点击后加速入孔”作为正式方向可用。** 当前实现只是结构验证，不应直接作为最终视觉版本发布。

## 2. 验证版暴露的问题

1. 当前用一张二维 `clay-opened.webp` 整体旋转，能传达方向，但近看会有“平面贴纸转动”的风险；正式版需要同一泥坯的固定机位转台序列，或至少使用独立的拉坯纹理、高光和孔沿运动层。
2. `cavity-spiral-transition.webp` 当前作为整张矩形图层放大，进入阶段仍能看到矩形边界；正式版需要孔口遮罩和 alpha 边缘，让旋纹只从孔内出现。
3. 开孔泥坯的孔口偏小，作为静态停留帧可用，但作为入口锚点需要略微扩大并固定在画面中心。

## 3. 现有素材处理结论

| 素材 | 结论 | 正式用途 |
| --- | --- | --- |
| `public/assets/kilns/intro-v2/clay-opened.webp` | 保留 | `opened` 短暂停留、低性能回退、正式转台序列的视觉母版 |
| `public/assets/kilns/intro-v2/cavity-spiral-transition.webp` | 保留并加工 | 孔内旋纹的纹理来源；正式版需做孔口 alpha 遮罩与边缘融合 |
| `assets-source/intro-v2-reference/07-clay-opened-v1.png` | 保留 | 正式旋转泥坯的结构母图，锁定外轮廓、孔口和机位 |
| `assets-source/intro-v2-reference/05-style-mother-v1.png` | 保留 | 泥料、湿光、暗背景与整体色调参考 |
| `assets-source/intro-v2-reference/10-cavity-spiral-transition-v1.png` | 保留 | 孔内材质和磁州窑黑白曲线参考 |
| `public/assets/kilns/intro-v2/clay-centered.webp` | 暂不使用 | 历史备用，不参与当前无手版首屏 |
| `public/assets/kilns/intro-v2/hand-left-support.webp`、`hand-right-opening.webp` | 暂不使用 | 历史分层素材，不重新引入首屏 |
| `public/assets/kilns/fire-portals/` | 保留 | 窑火入口已经通过验证，不需要随首屏重做 |

## 4. 正式素材包

### A. 固定机位开孔泥坯转台序列

目标文件：`public/assets/kilns/intro-rotation/clay-turntable-01.webp` … `clay-turntable-16.webp`

推荐制作方式：优先使用同一个 3D 泥坯或同一个母图的固定机位 16 帧转台；不要让生成工具逐帧独立创作。每帧必须保持外轮廓、孔口中心、泥料颗粒和光线方向一致，只改变绕垂直轴的角度。

参考图打包：

- `assets-source/intro-v2-reference/07-clay-opened-v1.png`：主体外轮廓、孔口比例、机位。
- `assets-source/intro-v2-reference/05-style-mother-v1.png`：泥料、湿润光泽、黑背景。
- `assets-source/intro-v2-reference/04-cizhou-mobile-reference.png`：仅用于手机屏内主体尺度和安全区。

生成或编辑提示词：

```text
以第一张参考图中的同一团开孔泥坯为唯一主体，制作手机竖屏首屏使用的固定机位转台序列。保持泥坯的外轮廓、厚度、顶部开孔、孔口中心、泥料颗粒、湿润高光、相机高度和黑色背景完全一致；只让泥坯绕垂直中心轴缓慢旋转，每一帧是同一件物体的连续角度，不改变形体，不新增或删除孔口，不生成瓶颈、瓶肩或完整器物。

略高于陶轮的正面近景，泥坯置于画面中心略下方，孔口始终落在同一个中心锚点附近。真实深褐湿陶土，粗颗粒、细小拉坯横纹、低饱和湿光，纯黑无边界背景。画面极简、安静、克制，适合从静止旋转逐渐加速并放大进入孔内。

必须生成同一件泥坯的连续转台角度；禁止每帧重新设计形体。不要手、陶轮矩形、工具、火焰、烟雾、文字、标志、完整花瓶、釉面、牡丹纹样、动漫风、塑料质感、强反光、镜头漂移、孔口漂移、外轮廓跳变。
```

验收标准：16 帧叠放后孔口中心漂移不超过 2% 画面宽度；外轮廓不得出现跳变；第一帧与 `clay-opened.webp` 的静态停留帧能自然衔接；循环 12 秒一圈时看不出硬切。

### B. 孔沿—内腔连接层

目标文件：`public/assets/kilns/intro-rotation/clay-rim-bridge.webp`

这不是新的全屏背景，而是一层只覆盖孔口的局部纹理。它负责把“泥坯顶部的孔”变成“可以进入的内腔”，持续约 300–500ms，再交给现有旋纹素材。

参考图打包：

- `assets-source/intro-v2-reference/07-clay-opened-v1.png`：孔口的实际形状和厚度。
- `assets-source/intro-v2-reference/10-cavity-spiral-transition-v1.png`：内腔旋纹的材质和方向。
- `assets-source/intro-v2-reference/02-cizhou-panorama-reference.png`：仅用于黑白曲线的终点气质。

生成或编辑提示词：

```text
生成一层用于手机首屏转场的“开孔泥坯孔沿—内腔连接纹理”。画面中心是一个与参考泥坯完全同轴的厚实圆形孔沿：外圈仍是深褐色湿陶土，边缘柔软、略有被拇指压开的不规则厚度；向内逐渐变成深暗湿泥内壁和连续的拉坯螺旋纹。纹理从孔口边缘向中心收拢，中心保持几乎纯黑，能让镜头产生进入内腔的深度。

保持真实陶土颗粒和克制湿光，不生成完整花瓶，不生成手，不生成火焰。外部背景必须透明或纯黑可被抠除；纹理边缘应柔和，不要出现矩形画布边界。旋纹要与参考图中的磁州窑黑白曲线在方向上有连续性，但在这一层仍以泥褐色为主。

禁止科幻虫洞、银河、霓虹、金属、大理石、规则同心圆图标、文字、水印、完整窑境、牡丹纹样和明显的平面贴图边框。
```

验收标准：叠加到转台序列时只能在孔口内部出现；放大到全屏时边缘不出现矩形；中心黑点始终与孔口中心重合。

### C. 纹理与高光运动层（不建议用生成工具）

目标文件：`clay-rake-highlight-loop.webp`、`clay-rim-shadow-loop.webp`。

这两层建议从 A 序列或 `07-clay-opened-v1.png` 做遮罩、位移和亮度合成，不建议用 AI 单独生成。它们只改变拉坯横纹、高光扫过和孔沿暗部，不改变泥坯的整体轮廓。这样可以避免逐帧 AI 生成造成泥坯“变形漂移”。

参考图打包：`07-clay-opened-v1.png`、`05-style-mother-v1.png`。

### D. 孔口 alpha 遮罩（手工制作）

目标文件：`clay-opening-mask.svg` 或 `clay-opening-mask.png`。

以 A 序列第一帧的孔口为基准，制作一个带轻微软边的固定遮罩；所有帧都以同一孔口中心作为转场锚点。遮罩不是视觉素材，不需要生成提示词。

## 5. 正式动画参数

- 静置：16 帧循环，12 秒一圈；主体只做轻微角度变化，不做上下漂浮。
- 点击后 0–120ms：孔内暗部加深，整体下沉约 2%，不立即放大过度。
- 120–650ms：转速由慢到快，主体放大到约 1.25–1.35 倍，孔口中心固定。
- 650–1100ms：孔沿连接层进入，旋纹只在 `clay-opening-mask` 内出现。
- 1100–1850ms：旋纹扩展到全屏，接管为磁州窑黑白窑境。
- 低性能或素材加载失败：回退到现有 `clay-opened.webp` + `cavity-spiral-transition.webp`，不能出现空白首屏。

## 6. 暂不重做的部分

现有磁州窑球面、三窑窑火、器物透明 PNG、移动端设备框架和受保护运行时均已通过本轮验证，不随旋转泥坯素材一起重做。正式素材完成后，只需要替换首屏资源和转场遮罩，再重新执行项目既有的 `check:runtime`、`build`、`test:sites` 及双设备视觉 QA。
