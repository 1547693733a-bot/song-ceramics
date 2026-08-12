# 「器之初·定心开器」原始参考素材包

前四个文件是新首屏提示词需要附带的原始参考素材；后六个文件是本轮外部生成、经确认后归档的母图与分层源素材。运行时只使用 `public/assets/kilns/intro-v2/` 中压缩后的 WebP，不直接读取本目录。当前无手版方向实际只取原始泥团、开孔泥团和孔内旋纹三层；定心泥团与两张手部图层保留为历史归档，不参与首屏 DOM。

| 文件 | 生成时的角色 | 对应提示词 |
| --- | --- | --- |
| `01-origin-clay-reference.png` | 泥料材质、颗粒、湿润程度和基础体量参照 | Prompt 01、02、03 |
| `02-cizhou-panorama-reference.png` | 磁州窑二级界面的黑白关系、旋涡节奏与空间氛围参照 | Prompt 01、06 |
| `03-cizhou-meiping-reference.png` | 牡丹梅瓶的纵向比例、丰肩与收腹关系参照；不得在首屏直接生成完整器物 | Prompt 01、03 |
| `04-cizhou-mobile-reference.png` | 手机屏内的实际构图、文字位置与主视觉尺度参照 | Prompt 01 |
| `05-style-mother-v1.png` | 已选定的“定心开器”风格母图；锁定真实泥料、暗光和双手开孔姿态 | Prompt 02–06 |
| `06-clay-centered-v1.png` | 已选定的定心完成泥团；锁定 Prompt 03 的机位、外轮廓、材质与光线 | Prompt 03 |
| `07-clay-opened-v1.png` | 已选定的顶部开孔泥团；锁定后续手部接触点与孔口比例 | 手部合成 |
| `08-hand-left-support-green-v1.png` | 已选定的左侧扶泥原始图层；纯绿背景，实施时需去背 | 左手进入与扶泥 |
| `09-hand-right-opening-green-v1.png` | 已选定的右侧开孔原始图层；纯绿背景，实施时需去背 | 右手进入与拇指开孔 |
| `10-cavity-spiral-transition-v1.png` | 已选定的孔内旋纹转场；湿泥内腔逐步转为磁州窑暖白与炭黑曲线 | 孔内转场 |

## 生成时如何附图

生成 Prompt 01 时按以下顺序上传：

1. `01-origin-clay-reference.png`：保持真实陶土材质。
2. `02-cizhou-panorama-reference.png`：继承黑白、旋转和窑境气质。
3. `03-cizhou-meiping-reference.png`：只理解器形比例。
4. `04-cizhou-mobile-reference.png`：只理解手机内构图，不复制其中的文字或成品器物。

生成 Prompt 02 时使用 `05-style-mother-v1.png` 加上 `01-origin-clay-reference.png`。生成 Prompt 03 时只上传 `06-clay-centered-v1.png` 并以“编辑图片”模式执行，保持外轮廓和机位不变。左手已选定为 `08-hand-left-support-green-v1.png`，右手已选定为 `09-hand-right-opening-green-v1.png`；二者实施时均需色键去背。生成 Prompt 06 时使用 `02-cizhou-panorama-reference.png` 作为黑白气质参考。

## 特意未收录的素材

`assets-source/intro/hand-open-green.png`、`hand-pinch-green.png` 和 `clay-pinched-black.png` 属于旧版“横向轻捏泥团”动画。新方向要求“扶泥定心 → 拇指开孔”，它们会把生成结果拉回动漫手与侧向捏合，因此不应上传给新的提示词。
