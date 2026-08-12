# 「器之初·定心开器」素材生成提示词

用途：为 `kiln-wheel-demo` 的首屏动画生成可拆分、可对齐的 raster 素材。  
原则：一类素材一个生成任务；所有动作帧使用同一张参考图和同一套风格锁定词。

## 使用方式

1. 先生成“锚点帧”：未定心泥团、左手扶泥、右手开孔。
2. 后续帧使用锚点帧作为 `Image 1: identity / composition reference`，只改变动作阶段，不改变比例、机位、光线和材质。
3. 手部与泥团分开生成，最后在 Canvas／WebGL 中合成；不要让模型一次生成完整动画或带手的泥团。
4. 需要透明素材时，先要求纯色 `#00ff00` 背景，再做本地色键清除；不要要求模型直接绘制透明棋盘格。
5. 每次生成都保留“无文字、无水印、无额外器物、无火焰”。

## 全局风格锁定词

将以下段落附加到每个提示词末尾：

```text
Song-dynasty Northern Chinese ceramic workshop mood, restrained material realism, warm dark earthen clay, subtle moisture sheen, tactile granular clay surface, soft directional light from upper left, deep pure-black negative space, quiet and contemplative, mobile-first vertical composition, centered object scale, realistic hand anatomy, imperfect handmade variation, no decorative fantasy, no modern studio equipment visible, no text, no logo, no watermark.
```

## 全局负面词

```text
Avoid: anime cel shading, saturated peach skin, thick comic outlines, cartoon fingers, glamour beauty lighting, jewelry, nail polish, long fingernails, costume sleeves, historical cosplay, pottery tools, finished vase, flowers, painted decoration, fire, sparks, smoke, colorful background, gray checkerboard transparency, cast shadow, floor plane, reflections outside the clay, extra hands, fused fingers, malformed fingers, duplicate objects, text, logo, watermark.
```

## 1. 定心泥团：锚点帧

用途：替代当前椭圆形悬浮泥块，作为动画第一帧。建议以项目现有 `origin-clay-v1.png` 做编辑参考，保留真实泥料纹理。

```text
Use case: precise-object-edit
Asset type: mobile interactive animation keyframe, raw clay on a pottery wheel
Input images: Image 1: existing raw-clay asset, identity and material reference; Image 2: Song Cizhou meiping silhouette, shape reference only
Primary request: change only the clay posture and support context. Turn the irregular suspended clay lump into a low, slightly tall mound placed exactly on the center of an implied pottery wheel. Keep the same real granular dark-brown clay texture, pores, small pits, dry-to-wet tonal variation, and soft natural highlight from Image 1.
Scene/backdrop: perfectly pure black negative space; only a barely visible dark wet elliptical rim under the clay, no visible machine
Subject: one centered mound of unformed clay, vertically stable, slightly wider at the base, enough mass for a future meiping vessel
Style/medium: restrained photorealistic clay macro photography, not illustration
Composition/framing: square asset, clay centered with generous black margin on all sides, full silhouette visible
Lighting/mood: one soft narrow wet highlight, very low contrast, no dramatic glow
Materials/textures: rough granular Northern Chinese stoneware clay, subtle moisture on the lower contact area
Constraints: preserve the original clay identity and texture; no finished vessel shape; no hands; no decoration; no text; no watermark
Avoid: side tilt, floating shadow, perfect 3D render, glossy plastic, synthetic cracks, orange-red heat
```

## 2. 定心泥团：完成帧

用途：手掌扶压之后的稳定状态。与第 1 帧保持同一机位和外轮廓基准。

```text
Use case: precise-object-edit
Asset type: clay-forming animation keyframe
Input images: Image 1: centered raw-clay mound from Prompt 1, identity and camera reference
Primary request: change only the clay shape. Show the same mound after centering on a slowly rotating wheel: a stable, slightly taller axisymmetric clay column with a softly rounded top, compressed sides, and faint horizontal-to-spiral wheel marks. Do not create a hollow opening yet.
Scene/backdrop: pure black negative space with the same barely visible wet elliptical wheel rim
Subject: one centered clay column, unfinished and heavy, no vessel neck, no rim, no hollow interior
Style/medium: restrained photorealistic clay macro photography
Composition/framing: exactly the same crop, scale, camera height, and object center as Image 1
Lighting/mood: same soft upper-left wet highlight; the center is calmer and more stable than the previous frame
Materials/textures: preserve the same granular brown clay, tiny pits and hand-compressed irregularities
Constraints: only change the clay posture; keep the background, camera, texture family, and scale unchanged
Avoid: finished pot, bottle, vase, neck, shoulders, painted patterns, hands, tools, text, watermark
```

## 3. 开孔泥团：锚点帧

用途：最重要的视觉节点。开孔必须是“顶部中心的内腔”，不是表面凹痕。

```text
Use case: precise-object-edit
Asset type: clay-forming animation keyframe, open vessel interior
Input images: Image 1: centered clay column from Prompt 2, identity and camera reference
Primary request: change only the top center. Create a real, clean, round opening made by a potter’s thumb pressing vertically into the centered clay. The hole must visibly enter the mass and reveal a dark moist inner wall; show a narrow, even wall thickness around the opening. Keep the lower body unfinished and compact.
Scene/backdrop: pure black negative space with the same implied wheel rim
Subject: centered clay mound with its first internal cavity, no complete vessel
Style/medium: restrained photorealistic clay macro photography, tactile and historically plausible
Composition/framing: same crop and scale as Image 1; opening centered on the vertical axis and readable at mobile size
Lighting/mood: soft wet highlight around the rim; dark interior with no artificial glow
Materials/textures: real clay particles, damp finger-compressed rim, subtle spiral throwing marks inside
Constraints: the opening is the first volume of a vessel; preserve the outside silhouette; no hand visible in this isolated clay asset
Avoid: shallow fingerprint dent, crater, hole through the bottom, wide bowl, finished vase, glaze, decoration, fire, text, watermark
```

## 4. 轻微起壁：锚点帧

用途：只让观众看见“器壁萌芽”，不要提前完成梅瓶。

```text
Use case: precise-object-edit
Asset type: clay-forming animation keyframe, first lifted wall
Input images: Image 1: open clay mound from Prompt 3, identity and camera reference; Image 2: Song Cizhou meiping, proportion reference only
Primary request: change only the upper wall. Gently lift the clay wall around the opening by a very small amount, creating the first low cylindrical vessel wall and a hint of future shoulder, while keeping the body short, thick, unfinished, and clearly not a completed vase.
Scene/backdrop: pure black negative space, same implied wheel rim
Subject: one unfinished early vessel, opening visible, low wall only
Style/medium: restrained photorealistic clay macro photography
Composition/framing: same centered vertical crop and scale as Image 1
Lighting/mood: quiet wet earthen highlight, no spectacle
Materials/textures: same granular clay, soft pressure marks, faint throwing spiral
Constraints: preserve the opening; reveal only the beginning of a wall; no white slip, black paint, glaze, flowers, or fire
Avoid: complete meiping, narrow neck, ornate shoulder, symmetrical 3D render, text, watermark
```

## 5. 左手扶泥：透明手部素材

用途：定心阶段的外侧支撑手。建议生成一张开放手势锚点，再做进入／扶稳／退出编辑。

```text
Use case: background-extraction
Asset type: transparent hand cutout for a mobile ceramic-forming animation
Primary request: one adult potter’s left hand and partial forearm, palm gently cupped as if supporting the outside of a centered clay mound on a pottery wheel. The hand is relaxed, fingers slightly curved and separated, fingertips soft and practical, no forceful squeeze. The wrist enters from the lower-left edge and points toward the center.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal
Subject: single realistic clay-stained hand, cropped at the wrist, natural adult anatomy, short clean nails, small traces of dark wet clay on fingertips
Style/medium: semi-realistic documentary ceramic-workshop photography with restrained tonal grading, no cartoon rendering
Composition/framing: square asset, hand occupies roughly the right half of the frame, generous padding around fingertips and wrist, no clay object included
Lighting/mood: soft neutral light, even exposure, minimal edge shadow
Color palette: muted warm skin, dark brown clay traces, no saturated peach
Constraints: flat green background only; no cast shadow, no floor, no extra objects, no text, no watermark; keep all fingers fully separated and visible
Avoid: anime, cel shading, thick outline, jewelry, nail polish, long nails, extra fingers, fused fingers, distorted wrist, sleeve covering the hand
```

## 6. 右手开孔：透明手部素材

用途：定心后转为开孔动作。拇指必须从上方垂直进入，不能继续做横向捏合。

```text
Use case: background-extraction
Asset type: transparent hand cutout for a mobile ceramic-forming animation
Primary request: one adult potter’s right hand and partial forearm, shown in a precise opening gesture over a centered clay mound: the thumb points downward vertically toward the top center, the index and middle fingers gently stabilize the outside rim, the remaining fingers relaxed and naturally folded. This is the first opening of a vessel, not a pinch.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal
Subject: single realistic clay-stained hand, cropped at the wrist, natural adult anatomy, short clean nails, subtle wet clay on the thumb pad and fingertips
Style/medium: semi-realistic documentary ceramic-workshop photography with restrained tonal grading, no cartoon rendering
Composition/framing: square asset, hand enters from the lower-right and reaches toward the upper-center, thumb and fingertip positions fully visible, generous padding
Lighting/mood: soft neutral light with a gentle moist highlight on the thumb pad, no dramatic shadow
Color palette: muted warm skin, dark brown clay traces, deep neutral sleeve only if a tiny wrist edge is unavoidable
Constraints: flat green background only; thumb must be vertical and readable; no clay object included; no text; no watermark
Avoid: side pinch, OK hand sign, grabbing, fist, pointing gesture, anime, cel shading, thick outline, jewelry, nail polish, extra fingers, fused fingers, distorted wrist
```

## 7. 双手定心姿态参考图（仅用于对位，不直接上线）

用途：生成一张动作对照图，帮助后续单手素材的角度和触点一致。不要把这张图直接当运行素材。

```text
Use case: historical-scene
Asset type: ceramic-forming pose reference sheet for a mobile animation production team
Primary request: a clean three-quarter close-up study of two adult potter hands centering a single mound of dark clay on a pottery wheel, followed by a second pose where the right thumb opens the center while the left hand supports the outside wall
Scene/backdrop: dark neutral ceramic workshop, no visible modern machinery, no finished vessels
Subject: two hands only, first pose “cup and center”, second pose “support and open”, consistent anatomy and consistent clay mound
Style/medium: documentary ceramic craft reference photography, not a poster, not a finished illustration
Composition/framing: two side-by-side poses with identical camera height and clay center; clear hand-to-clay contact points; no labels or arrows
Lighting/mood: soft directional light, quiet and practical
Constraints: historically plausible wheel-throwing posture; no costume, no jewelry, no text, no watermark
Avoid: kneading on a table, side pinching, completed vase, theatrical gesture, anime, extra hands
```

## 8. 陶轮湿光层

用途：代码层单独叠加，暗示“泥团落在轮上”。不生成完整陶轮或工作室。

```text
Use case: stylized-concept
Asset type: transparent-compatible dark wet wheel-light texture for a mobile animation overlay
Primary request: a very subtle near-black elliptical wet sheen from a pottery wheel viewed almost front-on, with a few thin concentric water streaks and soft moving highlights, no visible wheel hardware
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal
Subject: one thin dark elliptical rim and faint concentric wet streaks only
Style/medium: restrained macro material texture, realistic wet clay and water, almost black on black
Composition/framing: square overlay, ellipse centered, generous empty space, no hard outer border
Lighting/mood: extremely low luminance, quiet, readable only against pure black
Constraints: no clay mound, no hand, no tools, no floor, no cast shadow, no text, no watermark; do not use #00ff00 in the subject
Avoid: glowing magic circle, neon ring, metallic turntable, bright reflections, complete pottery wheel
```

## 9. 内腔旋纹转场遮罩

用途：孔洞扩大后接入现有磁州窑全景。优先使用代码遮罩和现有 `cizhou-panorama.png`，此提示词只用于补充抽象过渡纹理。

```text
Use case: stylized-concept
Asset type: black-and-white ceramic interior transition texture
Primary request: an abstract close-up of the inside wall of a freshly wheel-thrown clay vessel, with curved spiral throwing marks that gradually stretch into bold black-and-white brush-like Cizhou ceramic carving lines
Scene/backdrop: no recognizable room, deep black field
Subject: one continuous spiral vortex, dark clay brown at the center fading toward ivory white and iron-black marks at the edges
Style/medium: tactile ceramic macro texture merging into restrained Song Cizhou ink-and-sgraffito abstraction
Composition/framing: square, vortex centered, clear radial flow toward the viewer, usable as a transition matte
Lighting/mood: dark, quiet, moist, no glow
Color palette: dark brown clay, charcoal black, warm ivory, very small muted gray highlights
Constraints: no vessel silhouette, no text, no flowers, no fire, no decorative border, no watermark
Avoid: galaxy, tunnel, marble, psychedelic vortex, neon, glossy 3D chrome, random calligraphy characters
```

## 10. 统一迭代指令

如果某一帧与锚点帧漂移，后续编辑只使用下面这种短指令，不要重写整段提示词：

```text
Keep the exact same camera, crop, object center, scale, clay texture, lighting direction, color grading, and silhouette from Image 1. Change only the hand/clay action stage from <previous stage> to <next stage>. No new objects, no new style, no text, no watermark.
```

如果手部边缘出现绿色溢色：

```text
Keep the hand anatomy, pose, proportions, and framing unchanged. Remove all green color spill from the hand edge and sleeve edge. Keep the background perfectly flat #00ff00 for local keying. No halo, no shadow, no restyling.
```

如果泥团被生成成完整器物：

```text
Reduce the forming stage to an unfinished early clay state. Keep the opening shallow and the wall thick. No neck, no shoulder, no foot, no glaze, no decoration, no finished vase silhouette.
```

## 推荐生成顺序

1. 先用现有 `origin-clay-v1.png` 做 Prompt 1–4 的编辑锚点。
2. 生成 Prompt 5–6 的左右手开放姿态，再编辑出定心、开孔、退出帧。
3. 用 Prompt 7 检查两只手的接触逻辑和相对位置。
4. 最后生成 Prompt 8–9 的叠加纹理；磁州窑全景继续使用项目现有素材，不重新生成。
5. 每张素材生成后先检查指头、孔口、轮廓和色键边缘，再进入动画合成。

