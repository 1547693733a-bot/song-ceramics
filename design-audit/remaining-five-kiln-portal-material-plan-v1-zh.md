# 剩余五窑窑口素材生成方案 V1

这份方案对应当前 Demo 的八窑球面入口。前三窑（哥窑、磁州窑、钧窑）已经建立了“环境先出现 → 窑口/窑火成为焦点 → 点击后器物显形”的交互节奏；剩余五窑先接入了同一交互结构和可替换的材质入口层，后续用本方案生成各自的背景与窑口素材。

## 一、统一素材契约

### 1. 窑口背景

- 文件：`{kiln}-panorama.png`
- 尺寸：`2048 × 1024` 起步，优先 `4096 × 2048`
- 比例：严格 `2:1` equirectangular，全景边缘左右无缝
- 内容：只生成窑口环境、釉面、刻花、裂纹、窑灰、漫反射和移动光感
- 禁止：火焰、窑口圆形入口、完整器物、人物、文字、印章、UI、边框、摄影棚地面
- 目标：背景先成为主体，用户只能从材质、光线和纹理判断窑口，不要一眼看到“素材贴图接缝”

### 2. 窑口入口层

- 文件：`{kiln}-fire-v1.png`
- 尺寸：`1024 × 1024`，透明 PNG，主体居中
- 内容：一个可点击的窑口/窑火视觉层，保持留白，四周必须有干净 alpha
- 禁止：完整器物、人物、窑炉外景、文字、标识、水印、矩形底板
- 动态方式：当前运行时会用透明 PNG 作为基础，通过上升、边缘扰动、局部亮度变化完成连续运动；不需要把整段视频烘焙进图片
- 构图：入口中心固定在画布 `50% / 57%` 附近，不能出现偏心主体或过大的外扩光晕

### 3. 统一锁定句

每一次生成都在提示词末尾追加：

> 严格保持参考图的主体位置、比例、留白、光线方向和黑色空间关系；只改变本次指定的窑口材质与运动线索；不新增器物、人物、文字、符号或装饰。

## 二、五个窑口的生成目标

| 窑口 | 背景主材质 | 窑口入口层 | 动态节奏 | 建议文件 |
| --- | --- | --- | --- | --- |
| 汝窑 | 天青、月白、湿润细雾、极轻开片 | 冷青色低亮窑火，像雨后云气被吸入深处 | 最慢、最安静，亮度变化很小 | `ru-panorama.png` / `ru-fire-v1.png` |
| 官窑 | 粉青、灰青、冰裂与铁线开片 | 灰白裂纹围成的暗口，边缘有很薄的银灰反光 | 裂纹轻微错动，中心不跳亮 | `guan-panorama.png` / `guan-fire-v1.png` |
| 龙泉窑 | 梅子青、粉青、厚釉玉质、含蓄刻花 | 青玉色低焰/釉光，像叶片和刻痕从暗处浮起 | 旋转缓慢，局部光沿刻花移动 | `longquan-panorama.png` / `longquan-fire-v1.png` |
| 耀州窑 | 橄榄青、灰绿、刀刻花纹、窑灰 | 黄绿与炭褐交叠的窑火，边缘有刀刻般的硬线 | 比汝窑更有方向性，像刻纹被侧光扫过 | `yaozhou-panorama.png` / `yaozhou-fire-v1.png` |
| 定窑 | 象牙白、暖白、细腻胎釉、印花暗纹 | 近白色低温火光，中心深、外圈柔，不做橙红火焰 | 最克制，几乎是呼吸式亮度和极轻上升 | `ding-panorama.png` / `ding-fire-v1.png` |

## 三、每个窑口的提示词骨架

下面的提示词以现有 Ge / Cizhou / Jun 入口截图为风格参考，先生成背景，再生成透明入口层。每个窑口都要单独生成，不能只改颜色。

### 汝窑 Ru

**背景提示词：**

> 宋代汝窑窑口内部的 2:1 equirectangular ceramic environment，天青与月白厚釉，湿润细雾，极细而克制的开片，柔和的雨后侧光，釉面像玉石一样深浅渐变，安静、冷静、留白充足，中心不要出现完整圆形窑口，画面只表现空间气候与釉面材质，no vessel, no flame, no text.

**透明入口层提示词：**

> isolated transparent PNG of a Ru kiln entrance made from pale celadon mist and a very low cool ember，deep quiet center，soft wet glaze edge，subtle cloud-like upward flow，no orange flame，no vessel，no text，clean alpha background，centered circular silhouette，restrained luminance.

### 官窑 Guan

**背景提示词：**

> 宋代官窑粉青与灰青釉面形成的 2:1 equirectangular ceramic environment，冰裂开片与少量深色铁线，厚釉、冷静、低饱和，侧向掠过的光让裂纹逐段显现，背景连续且无焦点器物，no vessel, no flame, no text.

**透明入口层提示词：**

> isolated transparent PNG of a Guan kiln portal，a dark quiet opening surrounded by pale powder-blue glaze and thin iron-gray crackle lines，crackle network gently opening toward the center，no literal fireball，no vessel，no text，clean alpha background，centered and softly feathered edges.

### 龙泉窑 Longquan

**背景提示词：**

> 宋代龙泉窑梅子青厚釉的 2:1 equirectangular ceramic environment，玉质感、粉青到深青的层次，隐约刻花和竹叶形的浅浮雕，光线沿刻纹缓慢滑过，空间深沉但不黑，no vessel, no flame, no text.

**透明入口层提示词：**

> isolated transparent PNG of a Longquan celadon kiln portal，jade-green low flame and glaze light rising from a deep center，subtle carved-leaf contours，thick translucent glaze edge，no orange fire，no vessel，no text，clean alpha background，centered silhouette with restrained glow.

### 耀州窑 Yaozhou

**背景提示词：**

> 宋代耀州窑橄榄青与灰绿釉面的 2:1 equirectangular ceramic environment，刀刻花、剔刻纹和窑灰的层次清晰，侧向硬光掠过刻线，暗处有炭褐色沉积，材质有手工刀锋的节奏，no vessel, no flame, no text.

**透明入口层提示词：**

> isolated transparent PNG of a Yaozhou kiln portal，olive-green and charcoal-amber kiln glow，rising tongues separated by sharp carved-line edges，slightly more directional and graphic than Ru or Ding，no vessel，no text，clean alpha background，centered portal, no rectangular card.

### 定窑 Ding

**背景提示词：**

> 宋代定窑象牙白与暖白胎釉的 2:1 equirectangular ceramic environment，细腻如凝脂，极浅的印花暗纹在柔和侧光下慢慢出现，阴影温和，空间克制、安静、无炫光，no vessel, no flame, no text.

**透明入口层提示词：**

> isolated transparent PNG of a Ding kiln portal，ivory-white low-temperature glow around a deep quiet center，soft warm-beige rim，almost no saturated color，subtle upward movement implied by layered translucent shapes，no orange flame，no vessel，no text，clean alpha background，centered and very restrained.

## 四、生成和验收顺序

1. 先用五个背景提示词各生成 2:1 母图，统一检查接缝、中心留白和光线方向。
2. 选定背景后，再生成对应透明入口层；透明层必须以背景的色温、颗粒和亮度为参考。
3. 入口层先以静态 PNG 接入当前入口交互，确认点击前后“环境 → 入口 → 器物”的层级关系。
4. 再让现有的 procedural fire shader 接管内部上升、边缘扰动和局部亮度，避免生成视频与界面计时再次错位。
5. 最后在 iPhone 和 Pixel 10 两个预设中各检查一次：入口不露矩形边缘、点击后 0.9 秒内自然消失、器物在入口稳定后显形。

## 五、接入约定

当前代码已经为五个窑口接入了同一套入口状态，并用材质占位层保持交互完整。素材准备好后，按窑口把背景放到 `public/assets/kilns/`、入口 PNG 放到 `public/assets/kilns/fire-portals/`，再分别把对应路径写入 `Kiln` 数据；不要复制同一张火焰图，只通过 CSS 改色。

