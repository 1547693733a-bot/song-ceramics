# 严格保真型项目接续文档

> 文档类型：原项目接续基线。目标是在新对话中继续同一项目，不重新规划、改写方案、优化、重构或替换实现。
>
> 生成日期：2026-08-04。当前接管任务：`019fcced-d13a-7e70-97c3-c836cb0bb93e`。

## 0. 使用规则与事实来源

- 项目根目录：`D:/vbcoding/宋瓷/1/kiln-wheel-demo`。
- 来源任务与当前任务共用同一工作目录；本项目没有第二份需要复制、合并或迁移的代码。
- 项目不在 Git 仓库中；没有可供回滚或审阅的提交历史。
- 当前项目文件的唯一可执行事实来源是源码、配置、资源和测试文件本身；本文件只压缩上下文，不替代这些文件。
- 必须先完整读取 `AGENTS.md`、本文件、`PROJECT_HANDOFF.md` 和相关源码，再决定任何后续动作。
- `PROJECT_HANDOFF.md` 中带有“轻捏”“双手定心”“最近窑口吸附”等内容的段落属于历史方案或历史记录；若与本节和当前源码冲突，以本节和当前源码为准。
- `design-audit/`、`assets-source/`、`qa/` 中的历史方案、提示词、截图和审查记录必须保留其原始路径与原始含义，不得将历史内容改写成当前运行方案。
- 信息缺失必须写成“未知”；不得推测、补全、纠错或优化。
- 信息冲突时暂停修改，列出冲突文件、原文和待确认项，等待用户确认。

## 1. 本次用户最终确认要求（原文保留）

> 请将当前项目上下文压缩为一份“严格保真型项目接续文档”。
>
> 这不是重新规划项目，也不是对项目进行总结性改写。目标是在新对话中继续原项目，同时保证项目目标、需求、结构、文件、参数、设计、接口、技术路线和已确认决策不发生变化。
>
> 请严格遵守以下要求：
>
> 一、只压缩表达，不改变信息
>
> 1. 可以删除重复表述。
> 2. 不得删除约束、例外、参数、路径、版本、依赖、决策原因和用户确认原文。
> 3. 不得合并含义不同的要求。
> 4. 不得使用更宽泛的表达替代精确要求。
> 5. 不得自行补全、推测、纠错或优化。
> 6. 缺失信息必须标记为“未知”。
>
> 二、明确区分以下内容
>
> 1. 不可变基线
> 2. 已完成并冻结的成果
> 3. 当前可修改范围
> 4. 尚未完成事项
> 5. 已确认事实
> 6. 推测
> 7. 尚未验证信息
> 8. 已否决方案
> 9. 当前错误和排查记录
>
> 三、不可变基线必须包含
>
> - 最终目标原文
> - 用户最近确认的要求
> - 功能范围
> - 禁止增加和禁止删除的内容
> - 技术架构
> - 文件和目录结构
> - 数据结构
> - API 契约
> - 配置和参数
> - 设计规范
> - 文件命名
> - 输出格式
> - 依赖版本
> - 已确认决策及原因
> - 已验收成果
> - 用户明确禁止的操作
>
> 四、原样保留
>
> 以下内容必须尽量逐字保留，不得概括：
>
> - 用户最终确认的关键措辞
> - 文件名和路径
> - 代码
> - 命令
> - 配置
> - 字段定义
> - 接口格式
> - 数值参数
> - 颜色值
> - 尺寸
> - 版本号
> - 错误信息
> - 提示词
> - 验收标准
>
> 五、明确执行边界
>
> 必须分别列出：
>
> - 允许执行的操作
> - 禁止执行的操作
> - 允许修改的文件和位置
> - 不得触碰的文件和位置
> - 哪些行为虽然被称为优化，但仍属于禁止变更
> - 信息缺失时的处理规则
> - 信息冲突时的暂停规则
> - 修改前后的检查要求
>
> 六、接续动作
>
> 文档末尾必须包含：
>
> 1. 下一位助手应执行的第一个单一动作。
> 2. 该动作必须优先是读取、校验或检查，不得直接修改项目。
> 3. 接续助手必须先复述冻结内容和允许修改范围。
> 4. 接续助手必须明确承诺不重新设计、不优化、不重构。
> 5. 未完成接续确认前不得修改任何文件。
>
> 请输出完整 Markdown 文档。不要附加新的建议，不要改变当前项目方案。

## 2. 不可变基线：最终目标、功能范围和当前方案

### 2.1 最终目标原文

以下原文来自 `PROJECT_HANDOFF.md`：

> 这是一个面向手机端、未来计划落到微信小程序的宋代八大名窑科普体验。产品以审美与氛围为先、信息功能为后：用户不是从列表进入窑口，而是在一个连续、无边界的球形“窑境”中游历。

### 2.2 当前有效首屏基线

- 当前首屏：`原始泥团 → 开孔泥坯 GLB 慢速旋转 → 点击加速并推进入孔 → 孔内旋纹转场 → 磁州窑球面`。
- 当前源码状态机：`idle → accelerating → entering → hidden`。
- 初始窑口索引：`INTRO_KILN_INDEX = 3`，对应磁州窑。
- 当前模型：`public/assets/kilns/intro-3d/opened-clay.glb`。
- GLB 加载失败的回退：`public/assets/kilns/intro-v2/clay-opened.webp`。
- 当前孔内转场：`public/assets/kilns/intro-v2/cavity-spiral-transition.webp`。
- 当前运行时不使用两张生成手部 WebP；它们只保留为历史归档。
- 当前不使用 `?introValidation=rotating` 作为实现路径。

### 2.3 功能范围（冻结）

- 八个窑口：哥窑、汝窑、官窑、磁州窑、龙泉窑、钧窑、耀州窑、定窑。
- 用户可向任意方向拖动球面；松手后有克制惯性；不自动吸附、不自动回中。
- `activeIndex` 只随最近视线方向更新；键盘方向键才执行明确窑口导航。
- 窑口气氛先于器物出现；釉色、纹理、光线和运动先建立身份。
- 哥窑、磁州窑、钧窑使用独立窑火入口；点击窑火后推进到原色器物层；器物可点击进入阅读层。
- 当前优先完成哥窑、磁州窑、钧窑三个 Demo，其余五窑暂不继续深化。
- `Escape` 退出器物阅读；返回主体验时保持当前球面位置。
- 这是移动端原型，未来计划落到微信小程序；实际小程序迁移实现：未知。

### 2.4 禁止增加和禁止删除

- 不得增加首屏可见说明文字、边框、Logo、持久化导航控件或可见导航控件。
- 不得增加持久化右下角窑口定位器、圆形定位器或星座控制器。
- 不得把球面变为线性走廊、传统 Carousel 或列表入口。
- 不得自动吸附或居中到窑口。
- 不得用 CSS 或 SVG 重画透明陶瓷器物；必须使用已提供的透明陶瓷 PNG。
- 不得把窑火烘焙进背景全景；火焰必须属于独立交互前景层。
- 不得使用两张生成手部层作为当前运行时首屏。
- 不得恢复单张二维 `clay-opened.webp` 的平面旋转作为正式动画。
- 不得将 `public/assets/kilns/intro/` 的旧版动漫手“两次轻捏”实现恢复为默认实现。
- 不得删除八窑球面、三窑实时窑火、器物阅读层、Escape 返回、iPhone / Pixel 10 预览框架或受保护移动端运行时。
- 不得把项目替换为独立页面、Vinext starter 或不带移动端运行时的页面。
- 不得修改、替换、删除或重建受保护运行时文件，除非用户明确要求修改移动端运行时本身。
- 不得为了通过检查而弱化、绕过或修改运行时完整性检查。
- 未经用户明确要求，不得部署、发布或分享到 Sites。

## 3. 不可变技术架构

```text
src/main.tsx
  └── React.StrictMode
      └── App
          └── MobileRuntime
              └── Prototype
                  └── MobileScroll
                      ├── 首屏 intro：原始泥团 + GLB + 孔内旋纹
                      └── 八窑球面：WebGL 全景 / 氛围 / 窑火 / 器物 / 阅读层
```

- React `19.2.7`；TypeScript `^5.9.3`；Vite `8.1.3`；React 插件 `6.0.3`。
- `three` `^0.185.1` + `GLTFLoader` + `@types/three` `0.185.3`。
- 球面和窑火为 `Prototype.tsx` 内部 WebGL Canvas、GLSL shader 与 `requestAnimationFrame`。
- 移动运行时由 `src/mobile/` 提供 `MobileRuntime`、`PhoneFrame`、`KeyboardProvider`、`MobileScroll`、`Carousel`、`FlowStack`、`BottomSheet`。
- 站点输出为静态 Vite 客户端 + `worker/index.js` Cloudflare Worker 回退逻辑。
- `.openai/hosting.json` 中 `d1` 和 `r2` 均为 `null`；当前没有已确认的 API、数据库、上传、鉴权或外部连接器。

入口链路：`src/main.tsx` → `src/App.tsx` → `src/mobile/MobileRuntime.tsx` → `src/Prototype.tsx`。应用专属修改入口是 `src/Prototype.tsx` 和 `src/prototype.css`。

## 4. 数据结构、状态和参数（原样保留）

### 4.1 `Kiln`、拖拽和状态接口

```ts
type KilnFireMotion = "ge" | "cizhou" | "jun";
type FireMotion = KilnFireMotion;

type Kiln = {
  id: string;
  name: string;
  vessel: string;
  feature: string;
  description: string;
  image: string;
  shape: "tall" | "round" | "wide" | "low";
  yaw: number;
  pitch: number;
  mapX: number;
  mapY: number;
  atlasX: number;
  atlasY: number;
  color: string;
  ink: string;
  text: string;
  mutedText: string;
  imageFilter: string;
  atmosphereFilter: string;
  panorama?: string;
  panoramaMotion?: "ge" | "cizhou" | "jun";
  fire?: string;
  fireMotion?: KilnFireMotion;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startYaw: number;
  startPitch: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  velocityYaw: number;
  velocityPitch: number;
  moved: boolean;
};

type PortalPhase = "fire" | "entering" | "artifact";
type IntroPhase = "idle" | "accelerating" | "entering" | "hidden";
```

### 4.2 八窑固定数据

数据唯一来源：`src/Prototype.tsx` 的 `const kilns: Kiln[]`。下表保留当前源码的 ID、名称、器物、坐标、颜色和资源；每条 `description`、`imageFilter`、`atmosphereFilter` 必须直接从源码读取，不得凭记忆重写。

| id | name | vessel | shape | yaw | pitch | mapX | mapY | atlasX | atlasY | color | ink | text | mutedText | panorama | fire |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| `ge` | 哥窑 | 双耳瓶 | `tall` | 0 | 0 | 50 | 50 | 50 | 52 | `#b7ad97` | `#4d473f` | `#ece4d2` | `#c7baa0` | `/assets/kilns/ge-panorama.png` / `ge` | `/assets/kilns/fire-portals/ge-fire-v1.png` / `ge` |
| `ru` | 汝窑 | 莲花式碗 | `low` | -72 | -34 | 24 | 24 | 19 | 25 | `#86a7a2` | `#344b4d` | `#e2efeb` | `#b8d0cc` | 未设置 | 未设置 |
| `guan` | 官窑 | 方琮式瓶 | `tall` | 70 | -36 | 76 | 24 | 70 | 22 | `#84939a` | `#39464d` | `#e5ecec` | `#b8c4c8` | 未设置 | 未设置 |
| `cizhou` | 磁州窑 | 牡丹梅瓶 | `tall` | -132 | 30 | 15 | 64 | 7 | 62 | `#c4bcae` | `#292724` | `#f2ead9` | `#cbbda5` | `/assets/kilns/cizhou-panorama.png` / `cizhou` | `/assets/kilns/fire-portals/cizhou-fire-v2.png` / `cizhou` |
| `longquan` | 龙泉窑 | 花卉盖罐 | `round` | 132 | 32 | 85 | 64 | 68 | 72 | `#667b68` | `#28372e` | `#dce8da` | `#aebfae` | 未设置 | 未设置 |
| `jun` | 钧窑 | 玫瑰紫花盆 | `low` | -45 | 58 | 35 | 83 | 86 | 49 | `#77606f` | `#382e37` | `#eee1eb` | `#cbb4c5` | `/assets/kilns/jun-panorama.png` / `jun` | `/assets/kilns/fire-portals/jun-fire-v1.png` / `jun` |
| `yaozhou` | 耀州窑 | 凤首提梁壶 | `round` | 46 | 58 | 65 | 83 | 72 | 79 | `#73806a` | `#30392b` | `#e2e9d7` | `#b8c3a9` | 未设置 | 未设置 |
| `ding` | 定窑 | 孩儿枕 | `wide` | 180 | -4 | 50 | 12 | 35 | 72 | `#d0c8b7` | `#5b554b` | `#fff7e8` | `#d8cdb7` | 未设置 | 未设置 |

### 4.3 首屏资源和时序

```ts
const INTRO_KILN_INDEX = 3;
const INTRO_KILN = kilns[INTRO_KILN_INDEX];
const INTRO_MODEL_URL = "/assets/kilns/intro-3d/opened-clay.glb";
const INTRO_ACCELERATE_DURATION = 760;
const INTRO_MODEL_ENTER_DURATION = 1120;
const INTRO_ASSETS = [
  "/assets/kilns/origin-clay-v1.png",
  "/assets/kilns/intro-v2/clay-opened.webp",
  "/assets/kilns/intro-v2/cavity-spiral-transition.webp",
] as const;
```

- `idle` → `accelerating`：点击、Enter、Space；`accelerating` 持续 `760ms`。
- `accelerating` → `entering`；`entering` 持续 `1120ms`。
- `entering` → `hidden`；`prefers-reduced-motion: reduce` 直接 `hidden`。
- `ClayModelIntro`：`PerspectiveCamera(24, 1, 0.01, 12)`；renderer `alpha: true`、`antialias: true`、`powerPreference: "high-performance"`；pixel ratio 上限 `1.5`；`THREE.SRGBColorSpace`；`THREE.ACESFilmicToneMapping`；`toneMappingExposure = 0.92`。
- 初始模型速度 `0.42`；加速阶段速度 `0.42 → 7.3`、zoom `1 → 1.24`、targetY `0.24 → 0.34`；入孔阶段速度 `7.3 → 11.2`、zoom `1.24 → 4.2`、targetY `0.34 → 0.39`。
- 当前相机：`camera.position.set(0, targetY + 0.92, 2.6 / zoom)`，`camera.lookAt(0, targetY, 0)`。

### 4.4 球面参数

- `normalizeYaw(value) = ((value + 540) % 360) - 180`。
- 拖拽阈值：`7px`；yaw 比例：`0.34`；pitch 比例：`0.23`。
- 速度平滑：旧值 `0.52`，新采样 `0.48`。
- 释放速度 clamp：yaw `±0.34`，pitch `±0.26`；合速度上限 `0.28`。
- 惯性减速度：`0.00024`；速度低于 `0.006` 停止。
- 键盘导航时长：`clamp(distance * 5.4, 280, 760)`。
- 方向键：`ArrowLeft={x:-1,y:0}`、`ArrowRight={x:1,y:0}`、`ArrowUp={x:0,y:-1}`、`ArrowDown={x:0,y:1}`。
- `Escape`：`setInspecting(false)`。

### 4.5 窑火参数

```ts
const fireMotionPreset = {
  ge: { speed: 0.54, turbulence: 0.82, pulse: 0.26, character: 1 },
  cizhou: { speed: 0.78, turbulence: 1.08, pulse: 0.86, character: 2 },
  jun: { speed: 0.62, turbulence: 1.02, pulse: 0.48, character: 3 },
} as const;
```

- 正常窑火进入 `920ms` 后 `artifact`；减少动态时 `120ms` 后 `artifact`。
- 哥窑：克制、安静的灰青裂焰；灰青外焰、细金热流、铁色暗隙。
- 磁州窑：刀削般连贯的黑白剔焰，强调白地黑彩与果断刀笔。
- 钧窑：天青乳浊、蓝紫、铜红渗化；运动黏稠、缓慢；亮度脉冲低调。

### 4.6 移动设备几何

```ts
iphoneGeometry = {
  device: { width: 511, height: 968 },
  screen: { x: 59, y: 58, width: 393, height: 852, radius: 42 },
  safeArea: { top: 54, bottom: 34 },
  keyboard: { height: 338 },
};

pixelGeometry = {
  device: { width: 566, height: 1022 },
  screen: { x: 70, y: 35, width: 427, height: 952, radius: 58 },
  safeArea: { top: 64, bottom: 48 },
  keyboard: { height: 316 },
};
```

- Pixel 10 camera circle：`32 x 32`，`top: 23`。
- Pixel 10 screen：`427 x 952`；Android navigation safe area：`48px`。
- iPhone screen：`393 x 852`；radius：`42px`；bottom safe area：`34px`。
- Pixel 10 使用 Roboto、Android indicators、顶部/左/右 `32px` padding；iPhone 使用系统字体和 iOS indicators。
- 状态栏使用实时钟表，不得硬编码 `9:41`。

### 4.7 移动组件接口

```ts
export type FlowScreen = {
  id: string;
  title?: string;
  header?: (flow: FlowControls) => ReactNode;
  headerHeight?: number;
  footer?: (flow: FlowControls) => ReactNode;
  footerHeight?: number;
  render: (flow: FlowControls) => ReactNode;
};

export type FlowControls = {
  current: FlowEntry;
  previous: FlowEntry | null;
  stack: FlowEntry[];
  canGoBack: boolean;
  push: (screen: FlowScreen) => void;
  pop: () => void;
  replace: (screen: FlowScreen) => void;
};
```

- `BottomSheet` props：`open`、`onOpenChange`、`title`、可选 `description`、可选 `snap`、`children`。
- `Carousel` props：`className`、`contentClassName`、`ariaLabel`、`showScrollbar`、`draggingEnabled`、`children`。
- `Carousel` 直接位于 `MobileScroll` 内；横向意图由 Carousel 处理，纵向意图交给父级；不得 CSS scroll snapping；不得对 Carousel 使用 `data-scroll-drag="ignore"`。
- 文本输入只能使用 `KeyboardInput`、`KeyboardTextarea` 或 `MobileTextField`。
- 打开 FlowStack route、BottomSheet、dialog、menu、navigation sheet 前调用 `keyboard.hide()`。

## 5. API 契约、配置和输出格式

### 5.1 Worker 契约（原码）

```js
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
```

已有静态资源原样返回；只有 `404 + Accept: text/html + GET/HEAD` 回退到 `/index.html`；API 404 和 POST 等写请求不得回退到应用壳。当前没有已确认的其他 API。

### 5.2 Vite、TypeScript、Sites 配置

`vite.config.ts`：

```ts
export default defineConfig({
  build: { outDir: "dist/client" },
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  plugins: [react()],
});
```

`tsconfig.json`：`target=ES2022`、`lib=[ES2022,DOM,DOM.Iterable]`、`allowJs=false`、`skipLibCheck=true`、`esModuleInterop=true`、`allowSyntheticDefaultImports=true`、`strict=true`、`forceConsistentCasingInFileNames=true`、`module=ESNext`、`moduleResolution=Bundler`、`resolveJsonModule=true`、`isolatedModules=true`、`noEmit=true`、`jsx=react-jsx`、`include=[src]`。

`.openai/hosting.json`：

```json
{
  "d1": null,
  "r2": null
}
```

### 5.3 命令与产物

```text
npm.cmd run check:runtime
npm.cmd run build
npm.cmd run test:sites
npm.cmd run test:runtime
```

`build` 实际命令：`tsc && vite build && node scripts/prepare-sites-build.mjs`；必须确认以下文件存在：

- `dist/client/index.html`
- `dist/server/index.js`
- `dist/.openai/hosting.json`
- `.openai/hosting.json`

`prepare-sites-build.mjs` 将 `worker/index.js` 复制到 `dist/server/index.js`，将 `.openai/hosting.json` 复制到 `dist/.openai/hosting.json`。

### 5.4 GLB 处理契约

文件：`scripts/process-intro-glb.mjs`。

- 默认源：`D:/工作/趣传/牛蒙蒙/e8c14c3f8c41fbd7e18d57fefd8781ab.glb`；当前是否存在：未知。
- 默认输出：`public/assets/kilns/intro-3d/opened-clay.glb`。
- `targetTriangleRatio = 0.22`；要求 `primitive.getMode() === 4`。
- 要求 indexed `POSITION`；失败原文：`Expected indexed POSITION primitive.`。
- simplify 参数包含 `3`、`requestedIndexCount`、`0.004`、`[]`。
- 普通纹理缩放 `2048`；名称包含 `normal`、`roughness`、`metallic` 的纹理缩放 `1024`。
- 外部工具：`ffmpeg.exe`；版本和当前可用性：未知。
- 输出 JSON 字段：`source`、`output`、`sourceTriangles`、`targetTriangles`、`simplificationError`、`textureStats`、`outputBytes`。

## 6. 依赖版本（当前 package.json）

```json
{
  "name": "kiln-wheel-demo",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "dependencies": {
    "@fontsource/roboto": "5.2.10",
    "@radix-ui/react-dialog": "1.1.19",
    "@radix-ui/react-dropdown-menu": "2.1.20",
    "@radix-ui/react-icons": "1.3.2",
    "@use-gesture/react": "10.3.1",
    "motion": "12.42.2",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "three": "^0.185.1"
  },
  "devDependencies": {
    "@gltf-transform/core": "4.4.2",
    "@playwright/test": "1.61.1",
    "@rolldown/binding-win32-x64-msvc": "^1.1.5",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "@types/three": "0.185.3",
    "@vitejs/plugin-react": "6.0.3",
    "lightningcss-win32-x64-msvc": "^1.32.0",
    "meshoptimizer": "1.2.0",
    "typescript": "^5.9.3",
    "vite": "8.1.3"
  }
}
```

当前 `npm.cmd ls --depth=0` 已确认无顶层 `extraneous`；`package-lock.json` 必须与 `package.json` 同步，并已包含 `@gltf-transform/core`、`meshoptimizer`、`@types/three`。

## 7. 文件和目录结构

```text
kiln-wheel-demo/
├── AGENTS.md
├── PROJECT_HANDOFF.md
├── PROJECT_CONTINUATION.md
├── package.json
├── package-lock.json
├── index.html
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── mobile-runtime.lock.json
├── .openai/hosting.json
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── Prototype.tsx
│   ├── prototype.css
│   ├── styles.css
│   ├── vite-env.d.ts
│   └── mobile/
│       ├── assets.ts
│       ├── BottomSheet.tsx
│       ├── Carousel.tsx
│       ├── COMPONENTS.md
│       ├── components.tsx
│       ├── Device.tsx
│       ├── FlowStack.tsx
│       ├── geometry.ts
│       ├── index.ts
│       ├── Keyboard.tsx
│       ├── MobileCursor.tsx
│       ├── MobileRuntime.tsx
│       ├── MobileScroll.tsx
│       └── PhoneFrame.tsx
├── scripts/
│   ├── check-mobile-runtime.mjs
│   ├── prepare-sites-build.mjs
│   ├── process-intro-glb.mjs
│   └── update-mobile-runtime-lock.mjs
├── worker/index.js
└── tests/
    ├── mobile-runtime.spec.ts
    ├── runtime-fixture.css
    ├── runtime-fixture.html
    ├── runtime-fixture.tsx
    └── sites-worker.test.mjs
```

资源目录和命名：

- 原始源素材：`assets-source/intro/`、`assets-source/intro-v2-reference/`。
- 设备资源：`public/assets/iphone/`、`public/assets/android/`、`public/assets/status/`。
- 器物资源：`public/assets/ceramics/`。
- 窑境资源：`public/assets/kilns/`。
- GLB：`public/assets/kilns/intro-3d/opened-clay.glb`。
- 首屏 WebP：`public/assets/kilns/intro-v2/clay-centered.webp`、`clay-opened.webp`、`hand-left-support.webp`、`hand-right-opening.webp`、`cavity-spiral-transition.webp`。
- 火焰：`public/assets/kilns/fire-portals/ge-fire-v1.png`、`cizhou-fire-v1.png`、`cizhou-fire-v2.png`、`jun-fire-v1.png`、`origin-fire-v1.png`。
- 全景：`public/assets/kilns/ge-panorama.png`、`cizhou-panorama.png`、`jun-panorama.png`；其余窑口使用 `public/assets/kilns/kiln-sphere-atlas.png`。
- 设计与审查：`design-audit/`、`design-qa.md`、`qa/`。
- 构建产物：`dist/client/`、`dist/server/index.js`、`dist/.openai/hosting.json`。
- 测试失败上下文：`test-results/`；临时包、GLB、日志：`tmp/` 和 `*.stdout.log` / `*.stderr.log`；用途和清理权限：未知，不得擅自删除。

## 8. 设计规范（冻结）

以下规则来自 `AGENTS.md`，不得用更宽泛的审美描述替代：

- 主体验是移动优先、审美先行的宋瓷探索原型。
- 首屏是纯黑的“器之初·定心开器”；使用 `public/assets/kilns/origin-clay-v1.png`；轮子仅极淡可见；直接顶部开孔；孔内旋纹转场揭示磁州窑球面。
- 首屏没有 intro copy、边框、Logo 和可见导航控件；初始焦点可使泥团触发器具备键盘可访问性，但不得产生可见 UI。
- 哥窑环境：厚重乳灰青 / 米黄色釉、交织深色与暖金开片、细微珍珠状釉泡。
- 背景是干净的 2:1 等距柱状陶瓷环境，不烘焙火焰、Portal、器物或焦点物；火焰属于独立前景。
- 哥窑开片与磁州窑刻花保持固定，只移动掠射光；钧窑只允许非常轻微漂移。
- 代表器物保持完整、独立可读、悬浮、可点击；有可靠源图时使用原始釉色。
- 三窑火焰：哥窑克制安静的灰青裂焰；磁州窑刀削般连贯黑白剔焰；钧窑天青、蓝紫、铜红渗化且黏稠缓慢的窑变焰。
- Cizhou 窑火动效是三窑 Demo 的质量与节奏基准；除非用户明确要求，不改变 Cizhou 方向。
- 哥窑加强内部上升、边缘运动和亮度变化，但总体仍克制安静。
- 钧窑接近 Cizhou 的持续燃烧质量，但保持天青、蓝紫、铜红配色；形成上升、分离的火舌，不是平滑呼吸液滴；亮度脉冲必须低调。
- 球面拖拽后不自动 snap 或 recenter；平滑、近线性减速；键盘导航是窑口间移动的显式辅助方式。
- 球面横纵轴连续，允许越过旧垂直边界；窑口身份可随最近视线方向改变，但不得把镜头拉回窑口。

### 8.1 移动端规范

- 保留 iPhone / Pixel 10 设备选择器及两套校准预设。
- 设备选择器保持轻量 Codex 样式：无边框透明触发器、内容自适应宽度、右对齐菜单、`3px` 紧凑 inset、hairline 和 elevation shadow。
- prototype root 和默认 app screen 保持白色。
- `PhoneFrame` 拥有设备框、screen portal、picker、camera cutout 和 custom cursor；资源失败时修复路径或恢复资源，不移除设备框、键盘或图片。
- Android 关闭键盘时 viewport 为底部导航栏保留区域；Android 键盘打开时隐藏单独黑色导航栏，因为键盘资源已包含 IME navigation strip。
- iOS 屏幕继续绘制到 home indicator 区域，并自行承担安全区内容 padding。
- 固定手机 chrome 不随 pushed screen 动画；状态栏、摄像头切口、preview chrome 保持固定。
- 键盘低于 home indicator / safe-area 层，高于普通 app UI；home indicator 是最顶层安全区层。
- 不允许浏览器原生图片/文件拖拽破坏手机框内滚动；保留 phone-level `dragstart` 抑制和不可拖拽图片样式。

### 8.2 MobileScroll / Carousel / FlowStack / Keyboard

- 简单单屏使用 `MobileScroll`；常规多屏流程使用 `FlowStack`。
- `FlowScreen.header` / `footer` 放路由自身固定头尾；`headerHeight` 不包含 StatusBar；`footerHeight` 是完整 app footer 高度；footer 是 overlay，内容自行添加 `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)`。
- 只有可滚动内容放进 `MobileScroll`；固定 header、nav、tabs、composer、overlay 放在外部。
- 越过 tap slop 后按钮、链接、卡片、图片仍允许拖拽滚动；仅少数必须独占手势的控件可用 `data-scroll-drag="ignore"`。
- 不得在普通内容 padding 中加 `var(--keyboard-height)`；keyboard-linked fixed chrome 使用 `useKeyboardInsets().bottomInset`；不得只使用 `keyboardHeight` 或固定 `bottom: 0`。
- 输入控件必须使用 `KeyboardInput`、`KeyboardTextarea`、`MobileTextField`。
- 打开 FlowStack route、BottomSheet、dialog、menu、navigation sheet 前调用 `keyboard.hide()`。
- Carousel 直接位于 `MobileScroll` 内；不得用自定义 `overflow-x` / pointer handlers 代替；不得 CSS scroll snapping；不得将 `data-scroll-drag="ignore"` 放在 Carousel 或外层。

## 9. 已完成并冻结的成果

- 八窑球面坐标、窑口定位、八节点定位器。
- 横向/纵向拖拽、松手惯性、最近窑口身份更新，且不自动吸附。
- 键盘方向键导航与 `Escape` 退出器物阅读。
- 哥窑、磁州窑、钧窑三套真实全景纹理接入 WebGL 等距柱状球面采样。
- 三窑差异化背景运动：哥窑与磁州窑纹理稳定，仅改变掠射光；钧窑只做极轻微低速流动。
- 八件器物素材和点击阅读层；三窑使用原色透明图。
- 三窑独立纯黑底火焰 PNG，并接入“火焰入口 → 推进熄入 → 原色器物显现 → 点击阅读”。
- 火焰主体层、柔化余焰层、滤色混合、错位、呼吸、漂浮、分窑节奏、WebGL 实时渲染和减少动态静态回退。
- iPhone / Pixel 10 双设备预览框架、移动安全区、状态栏和键盘运行时。
- 首屏 GLB 加载、慢速旋转、点击加速、推进入孔、孔内旋纹转场、磁州窑球面接管。
- GLB 处理脚本、运行时资产和构建依赖已写入依赖清单；当前顶层依赖无 `extraneous`。
- `npm.cmd run check:runtime`：通过，28 个受保护运行时文件完整。
- `npm.cmd run build`：通过；TypeScript、Vite、Sites 构建产物生成成功。
- `npm.cmd run test:sites`：通过，4/4。
- 历史本地预览已复核首屏、窑火、器物阅读和 Escape 返回；这不等同于本轮重新执行的浏览器测试。

## 10. 当前可修改范围与执行边界

### 10.1 允许执行

- 只读读取、校验、比对当前源码、资源、依赖、锁文件、构建产物和测试记录。
- 在用户明确指定的任务内修改 app-specific UI：`src/Prototype.tsx`、`src/prototype.css`。
- 按项目现有命令运行完整性检查、构建和 Sites Worker 测试。
- 用户明确要求文档时新增或更新文档；本次被请求新增 `PROJECT_CONTINUATION.md`。
- 只有用户明确要求修改移动端运行时本身时，才可进入受保护文件修改流程；修改后必须更新对应 lock hash，并先验证新的运行时行为。

### 10.2 禁止执行

- 未完成接续确认前修改任何文件。
- 重新设计首屏、球面、窑火、器物阅读或移动端运行时。
- 以“优化”“整理”“性能改进”“代码清洁”“重构”“统一风格”为名改变冻结行为、参数、层级、命名、交互、视觉或路径。
- 删除历史素材、QA 截图、日志、`tmp/` 文件或未知用途文件；当前是否可删除：未知。
- 修改、替换、删除或重建受保护的 `src/App.tsx`、`src/main.tsx`、`src/styles.css`、`src/mobile/`、`public/assets/iphone/`、`public/assets/android/`、`public/assets/status/`、`vite.config.ts`、`worker/index.js`、`scripts/prepare-sites-build.mjs`。
- 修改 `mobile-runtime.lock.json` 以掩盖受保护文件变化。
- 删除、替换、压缩或重命名现有资源而未得到明确授权。
- 安装、部署、发布、分享或调用外部服务，除非用户明确要求；Sites 当前只做本地构建验证。

### 10.3 虽称为优化但仍禁止

- 把 GLB 换成二维图以降低包体。
- 为了首屏加载删除 `clay-opened.webp` 回退层或孔内旋纹。
- 改变八窑数据、颜色、滤镜、yaw/pitch、图集坐标或原色器物。
- 增加 locator、导航菜单、intro copy、按钮文字、边框或 Logo。
- 恢复自动吸附、自动回中或改变无边球面拖拽规则。
- 去掉实时窑火 WebGL、减少动态回退、移动端安全区、键盘、状态栏、摄像头切口或设备框。
- 替换 `MobileRuntime`、`MobileScroll`、`Carousel`、`FlowStack` 或 `BottomSheet`。
- 替换为 Vinext starter、独立页面、不同 Worker 契约或不同 Sites 输出格式。

### 10.4 修改前后检查

修改前必须：完整读取 `AGENTS.md`；读取本文件对应章节和 `PROJECT_HANDOFF.md` 当前有效基线；列出拟修改的精确文件和区域；涉及受保护运行时时先取得用户明确授权；信息冲突时暂停。

修改后必须：

1. `npm.cmd run check:runtime`
2. `npm.cmd run build`
3. 确认 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json` 和源 `.openai/hosting.json` 存在。
4. `npm.cmd run test:sites`
5. 环境有 Chromium 时才运行 `npm.cmd run test:runtime`；缺失时记录原始错误。
6. 不得通过放宽检查、修改锁文件或删除测试制造通过结果。

## 11. 尚未完成、尚未验证、未知和推测

### 11.1 尚未完成事项（已确认）

- `npm.cmd run test:runtime` 的 8 项浏览器测试尚未进入测试断言；原因是本机缺少 Playwright Chromium 可执行文件。
- 其余五窑的独立全景和火焰素材尚未继续深化；不得擅自扩展为当前实现任务。
- 是否将原型实际迁移为微信小程序代码：未知。
- 是否部署或分享 Sites：未知且当前未获授权；不得默认执行。

### 11.2 尚未验证信息

- `ffmpeg.exe` 是否安装、版本和编码能力：未知。
- `D:/工作/趣传/牛蒙蒙/e8c14c3f8c41fbd7e18d57fefd8781ab.glb` 是否仍存在：未知。
- 补齐依赖和清理过期 CSS 后是否重新完成真实浏览器视觉 QA：未知；已完成的是 TypeScript/Vite/Sites 校验。
- 生产 Sites 的远端部署版本、URL 或权限：未知。
- 低性能真实设备帧率、浏览器 WebGL 兼容性和屏幕阅读器行为：未知；QA 文档明确指出截图不能证明这些行为。

### 11.3 推测

- 推测：无。任何未被源码、配置、测试输出或既有文档确认的内容都必须标记为“未知”。

## 12. 已确认事实

- 项目路径：`D:/vbcoding/宋瓷/1/kiln-wheel-demo`。
- 来源任务与当前任务使用同一工作目录，未复制第二份项目。
- 项目不在 Git 仓库中。
- 当前首屏是 GLB 版本，不是历史“两次轻捏”、不是双手运行时版本、不是单张二维旋转验证版本。
- `npm.cmd run check:runtime` 最近一次通过：28 个受保护文件。
- `npm.cmd run build` 最近一次通过；Vite 有 `Some chunks are larger than 500 kB after minification.` 警告。
- `npm.cmd run test:sites` 最近一次通过：4 项全部通过。
- `npm.cmd ls --depth=0` 最近一次无顶层 `extraneous`。
- `.openai/hosting.json` 中 `d1`、`r2` 均为 `null`。

## 13. 已否决方案、原因和历史边界

- `?introValidation=rotating` 中单张 `clay-opened.webp` 整体旋转：用户复核后认为二维泥坯旋转视觉不通过，不能作为正式动画；孔内旋纹转场可以保留。
- 旧版“两次轻捏泥核”动漫手方案：与进入窑境后的二级界面存在视觉与叙事割裂；旧资源保留为历史回退基线，不作为默认运行时。
- 自动吸附或回中：最终确认不采用；自由探索必须停在用户释放后的位置，窑口身份只随最近视线方向更新。
- 持久化右下角定位器、圆形/星座导航：不采用；球面依靠直接探索、当前窑口身份和键盘导航。
- 用 CSS/SVG 重画器物：不采用；必须使用提供的透明 PNG。
- 把整屏窑火概念稿作为运行时入口：不采用；实际入口只使用 `public/assets/kilns/fire-portals/` 下独立纯黑底 PNG。
- 独立页面替换移动端设备运行时：不采用；模板运行时和设备 chrome 受保护。

`PROJECT_HANDOFF.md` 中关于旧版首屏、历史设计调研和旧时序的原文必须保留，但不得把其历史内容当作当前实现；最新当前首屏以本文件第 2 节和 `src/Prototype.tsx` 为准。

## 14. 当前错误和排查记录

### 14.1 Playwright 浏览器缺失

执行 `npm.cmd run test:runtime` 时，8 项测试均未进入断言。原始错误：

```text
Error: browserType.launch: Executable doesn't exist at C:\Users\15476\AppData\Local\ms-playwright\chromium_headless_shell-1228\chrome-headless-shell-win64\chrome-headless-shell.exe
Looks like Playwright was just installed or updated.
Please run the following command to download new browsers:
npx playwright install
```

这是 Playwright Chromium 可执行文件缺失，不是应用断言失败。不得把这次失败改写为“运行时测试通过”，也不得为了通过而修改应用代码。

### 14.2 已解决的依赖迁移问题

- GLB 处理脚本使用 `@gltf-transform/core`、`meshoptimizer`，此前只存在于本机 `node_modules`，未登记在依赖中；已补入 `devDependencies` 和 `package-lock.json`。
- TypeScript 使用 `three` 类型声明；此前清理本机残留依赖后缺少 `@types/three`；已补入 `devDependencies` 和锁文件。
- 本机残留的 7 个无关顶层依赖已清理；当前 `npm ls --depth=0` 无 `extraneous`。

### 14.3 构建警告

Vite 构建成功，但提示：

```text
Some chunks are larger than 500 kB after minification.
```

该信息是警告，不是当前已授权的代码拆分或性能优化任务；不得自行处理。

## 15. 原文保留文件和提示词边界

以下文件包含不能凭记忆重写的原文，接续助手必须直接读取：

- `AGENTS.md`：完整移动端运行时、交互、视觉、编辑边界和键盘规则。
- `PROJECT_HANDOFF.md`：完整历史来源、旧方案、设计反馈、QA 记录和接管记录。
- `src/Prototype.tsx`：完整 `Kiln` 数据、颜色、滤镜、GLSL、状态机和运行逻辑。
- `src/prototype.css`：完整视觉值、动画、层级、滤镜和媒体查询。
- `src/mobile/COMPONENTS.md`：Carousel、Keyboard-linked surfaces、BottomSheet 原文契约。
- `design-audit/rotating-clay-generation-plan-v2-zh.md`：Prompt A/B/C/D、参考图、规格、参数、生成顺序、接入参数和失败判定原文。
- `design-audit/song-cizhou-meiping-intro-concept.md`：定心开器研究方案原文。
- `assets-source/intro-v2-reference/README.md`：参考素材角色、附图顺序和旧素材禁用原因原文。
- `qa/causal-flow-audit-2026-08-04/AUDIT.md`：因果链审查原文。
- `mobile-runtime.lock.json`：28 个受保护文件的 SHA-256 锁定值。

提示词、代码、配置、字段、参数、颜色、尺寸、版本号、错误信息和验收标准不得在新对话中凭记忆重写；需要它们时直接读取上述文件，并保留原路径、原文件名和原文。

## 16. 下一位助手的接续动作（必须先执行）

### 第一个单一动作

下一位助手的第一个动作必须是：

> **只读读取并校验 `PROJECT_CONTINUATION.md`、`AGENTS.md`、`PROJECT_HANDOFF.md`、`package.json`、`package-lock.json`、`mobile-runtime.lock.json` 和当前源码入口，确认冻结基线与工作区一致；不得修改任何文件。**

完成该单一只读动作后，下一位助手必须先向用户复述：

1. 不可变目标和当前 GLB 首屏方案；
2. 八窑球面、三窑窑火、器物阅读和移动端运行时必须保留；
3. 当前只允许在用户明确授权范围内修改；app-specific UI 默认仅限 `src/Prototype.tsx` 和 `src/prototype.css`；
4. `src/App.tsx`、`src/main.tsx`、`src/styles.css`、`src/mobile/`、设备资源、状态资源、`vite.config.ts`、`worker/index.js`、`scripts/prepare-sites-build.mjs` 等受保护文件不得触碰；
5. 必须明确承诺：**不重新设计、不优化、不重构、不替换当前项目方案**；
6. 在用户完成接续确认前，不得修改任何文件。

接续确认未完成前，只能读取、校验、报告事实和指出冲突；不得直接修复、清理、重命名、删除、安装、部署或改写项目。

## 附录 A：正式旋转泥坯计划与提示词原文

以下内容从 `design-audit/rotating-clay-generation-plan-v2-zh.md` 原样读取并保留。它是正式素材计划和提示词原文，不等同于当前运行时已接入素材；当前运行时仍以第 2 节和 `src/Prototype.tsx` 为准。

+Exit code: 0
Wall time: 0.2 seconds
Output:
# 「器心·入窑」旋转泥坯素材重制计划 V2

日期：2026-08-04

## 一、当前结论

- `?introValidation=rotating` 中使用单张 `clay-opened.webp` 整体旋转的方案不通过，不再继续微调为正式版本。
- 用户认可最后的孔内旋纹转场，因此保留：
  - 源素材：`assets-source/intro-v2-reference/10-cavity-spiral-transition-v1.png`
  - 运行素材：`public/assets/kilns/intro-v2/cavity-spiral-transition.webp`
- 新首屏仍从“已经开孔的泥坯”开始，不恢复原始泥团、双手或可见陶轮矩形。
- 需要重新生成的是“泥坯本身的真实旋转”和“点击后的加速入孔”，不是磁州窑转场和二级界面。

## 二、最终动画结构

1. **静置循环**：同一件开孔泥坯在不可见陶轮上缓慢、真实地旋转，镜头固定，6–8 秒一圈。
2. **点击反馈**：旋转迅速加速，孔内变暗，镜头开始沿孔口中心向前推进。
3. **入孔镜头**：同一泥坯继续旋转并放大，最终只剩孔沿与深色内腔。
4. **既有转场接管**：交叉淡入现有 `cavity-spiral-transition.webp`，再进入磁州窑球面。

推荐使用“母图 + 图生视频”的方案。若视频模型无法稳定保持形体，再改用同一个 3D 泥坯渲染转台序列；禁止让图片生成模型逐帧独立生成动画帧。

## 三、需要生成的四项素材

| 编号 | 素材 | 建议规格 | 用途 |
| --- | --- | --- | --- |
| A | 开孔旋转泥坯母图 | 2048×2048 PNG | 锁定唯一泥坯身份、机位、孔口和光线 |
| B | 慢速无缝旋转视频 | 1024×1024，6–8 秒，24fps | 首屏无限循环 |
| C | 入孔终点帧 | 2048×2048 PNG | 锁定加速镜头结束时的孔沿和内腔 |
| D | 加速入孔视频 | 1024×1024，1.2–1.6 秒，24fps | 点击后从 A 推进到 C |

最终运行时建议输出 WebM/VP9，并保留 MP4/H.264 作为兼容回退。黑色背景直接与首屏融合，不要求透明视频。

## 四、生成顺序

1. 用 Prompt A 生成 4 张独立母图候选，只选择一张；不要生成拼图或接触表。
2. 选定母图后，用 Prompt B 生成 2 个慢速循环版本。
3. 用选定母图和现有孔内旋纹参考图，通过 Prompt C 生成入孔终点帧。
4. 把选定母图作为首帧、入孔终点帧作为尾帧，用 Prompt D 生成 2 个加速入孔版本。
5. 只有 B 和 D 都通过“形体不漂移”检查后，才接入代码。

---

## Prompt A｜开孔旋转泥坯母图

### 需要附带的参考图

1. `assets-source/intro-v2-reference/07-clay-opened-v1.png`：只参考真实泥料、开孔泥坯类别和粗厚体量，不照搬其过高柱状轮廓。
2. `assets-source/intro-v2-reference/05-style-mother-v1.png`：只参考湿泥颗粒、低饱和高光和暗光质感，忽略双手。
3. `assets-source/intro-v2-reference/10-cavity-spiral-transition-v1.png`：只参考孔内深度、中心黑点和旋纹方向，暂不复制外围黑白纹样。
4. `assets-source/intro-v2-reference/04-cizhou-mobile-reference.png`：只参考手机画面中的主体尺度与中心位置，忽略手机框、文字、火焰和器物。

### 生成提示词

```text
根据四张参考图，重新生成一张用于手机竖屏首屏动画的“开孔旋转泥坯母图”。这不是成品陶器，而是一团刚刚完成开孔、仍然厚重朴拙的真实湿陶土。

主体是一件轴心稳定、低矮厚实、下部略宽、上部轻微收拢的初始泥坯。顶部中心有一个清晰可进入的圆形孔口，孔口宽度约为泥坯整体宽度的 18%–22%；孔沿厚实、柔软、略有真实手工形成的不规则，内壁深暗并带连续细密的拉坯旋纹。孔必须是真正向下延伸的内腔，不是浅凹痕、陨石坑或贯穿洞。

镜头固定在略高于泥坯的正前方，约 20–25 度轻微俯视，让孔口清晰但仍能看见完整泥坯体量。泥坯位于正方形画面中心略下，主体宽度约占画面 46%，孔口中心位于画面水平中心、垂直方向约 43%–46%。背景为纯黑无边界空间，不出现可见陶轮平台。

材质是真实深褐色湿陶土：粗细混合颗粒、细小孔隙、克制的拉坯横纹和少量湿润高光。左前上方有柔和掠射光，右侧和底部自然进入暗部；高光不能像塑料或釉面。外轮廓大体轴对称，但保留极轻微手工不规则，使后续真实旋转时能看出空间变化。

整体气质安静、原始、朴拙、具有制陶中的力量，与磁州窑黑白窑境相协调。画面无文字、无 UI、无手、无人、无器物、无火焰、无烟雾。

禁止：过高圆柱体、完整瓶颈或瓶肩、宽口碗、成品花瓶、手、陶轮矩形、工具、釉面、塑料质感、强镜面反光、动漫风、科幻隧道、磁州窑完整黑白纹样、牡丹图案、文字、标志、水印。
```

### 母图验收标准

- 孔口一眼可见，且是有深度的真实内腔。
- 泥坯不再像竖直石柱，也没有形成完整花瓶。
- 主体轴线清楚，适合绕垂直轴旋转。
- 黑背景干净，主体四周有足够放大空间。
- 只选定一张母图；后续所有视频都必须保持这件泥坯的身份。

---

## Prompt B｜慢速无缝旋转视频

### 需要附带的参考图

- 只上传最终选定的 Prompt A 母图，不再混入其他泥坯图。

### 图生视频提示词

```text
以参考图中的同一件开孔泥坯为唯一主体，生成一段固定镜头、无缝循环的真实陶轮旋转视频。

相机完全锁定：没有推拉、平移、摇镜、俯仰、景深变化或构图漂移。纯黑背景保持不动。泥坯绕自身垂直中心轴顺时针缓慢旋转一整圈，6–8 秒完成 360 度，速度恒定、安静、克制，像放在不可见陶轮上持续转动。

必须是真实三维物体旋转：泥坯表面的颗粒、拉坯纹、微小不规则和湿润高光随着空间角度自然移动；顶部孔口始终保持同一个真实内腔，孔口中心基本固定，外轮廓稳定。泥坯不能像平面贴纸在屏幕上旋转，也不能发生形变、呼吸、融化、摆动、上下漂浮或重新塑形。

第一帧和最后一帧必须在角度、构图、光线和形体上完全匹配，形成看不出接缝的循环。保持原图的真实深褐湿陶土、克制暗光、纯黑空间和主体尺度。

禁止：相机运动、主体缩放、孔口漂移、外轮廓跳变、表面纹理爬动、AI 形变、泥坯变成花瓶或碗、出现手或工具、出现陶轮矩形、火焰、烟雾、黑白纹样、文字、标志、水印。
```

### 视频验收标准

- 第一帧与最后一帧无缝。
- 孔口中心漂移不超过画面宽度的 1%。
- 外轮廓不呼吸、不融化、不忽大忽小。
- 表面细节随三维旋转移动，而不是整张平面图旋转。
- 循环观看三次仍看不出明显接缝。

---

## Prompt C｜入孔终点帧

### 需要附带的参考图

1. 最终选定的 Prompt A 母图：锁定同一件泥坯、泥料和光线。
2. `assets-source/intro-v2-reference/10-cavity-spiral-transition-v1.png`：锁定孔内旋纹中心和后续转场方向。

### 图片编辑提示词

```text
以第一张参考图中的同一件开孔泥坯为主体，制作“镜头即将进入孔内”的终点帧。严格保持泥料颜色、颗粒、湿润光泽、孔沿厚度和光线方向，不重新设计泥坯。

相机沿原始孔口中心轴向前推进，形成近距离俯视特写。泥坯外部轮廓大部分已经离开画面，只保留围绕画面中心的厚实湿泥孔沿和一段真实内壁。孔内拉坯旋纹向中心连续收拢，中心是深黑入口；画面仍以深褐湿陶土为主，不提前出现完整的磁州窑暖白和炭黑外围纹样。

构图必须与第二张参考图的旋纹中心完全同轴，方便后续交叉淡入。背景和画面边缘自然进入黑色，不出现矩形贴图边框。保持真实陶土微距摄影质感，安静、克制、有深度。

禁止：改变泥料身份、生成新的孔口、科幻虫洞、银河、霓虹、金属、大理石、完整磁州窑图案、火焰、烟雾、手、文字、标志、水印。
```

### 终点帧验收标准

- 中心黑点与现有 `10-cavity-spiral-transition-v1.png` 对齐。
- 孔沿和内壁仍属于 Prompt A 的同一件泥坯。
- 画面边缘没有矩形边界。
- 与现有旋纹转场做 150–250ms 交叉淡入时没有明显跳切。

---

## Prompt D｜点击后的加速入孔视频

### 需要附带的参考图

- 首帧：最终选定的 Prompt A 母图。
- 尾帧：最终选定的 Prompt C 入孔终点帧。

### 首尾帧图生视频提示词

```text
使用第一张参考图作为准确首帧，第二张参考图作为准确尾帧，生成一段 1.2–1.6 秒的“陶轮加速并进入孔内”镜头。必须是同一件泥坯、同一个孔口和同一套光线。

开始时泥坯沿自身垂直轴保持真实旋转；前 120 毫秒只做轻微点击反馈：孔内暗部加深，主体下沉约 2%，不突然跳动。随后旋转速度平滑提高到约每秒 1.2–1.5 圈，相机沿孔口中心轴稳定向前推进。孔口始终锁定在画面中心，泥坯逐渐放大，外部轮廓自然离开画面，最终准确到达第二张参考图中的孔沿和内腔特写。

运动应有真实重量和连续惯性，不做弹跳、不做呼吸缩放、不做眩晕式高速旋转。泥坯的颗粒、横纹和高光必须随真实三维旋转移动；形体、孔沿和内腔不能融化或重新生成。纯黑背景保持干净。

尾帧只到达深褐色孔沿和黑色内腔，不在本视频里生成磁州窑完整黑白旋纹；后续将由已有转场素材接管。

禁止：镜头偏离孔口中心、孔口漂移、泥坯变形、平面贴图旋转、突然切镜、过度动态模糊、科幻隧道、黑白纹样提前出现、火焰、烟雾、手、工具、文字、标志、水印。
```

### 加速视频验收标准

- 首帧与慢速循环中的母图角度一致，80–120ms 淡入后无跳变。
- 全程孔口保持中心锚点。
- 尾帧与 Prompt C 一致，可直接衔接现有孔内旋纹。
- 泥坯不变形、不融化，旋转速度平滑提升。

## 五、接入后的动画参数

- 静置：B 视频循环，正常速度播放。
- 点击后 0–100ms：从 B 交叉淡入 D，避免用户在任意循环角度点击时产生硬切。
- D 播放 1.2–1.6 秒。
- D 尾部最后 180–240ms 与现有 `cavity-spiral-transition.webp` 交叉淡入。
- 现有旋纹继续完成全屏接管并进入磁州窑球面。
- `prefers-reduced-motion: reduce` 使用 Prompt A 静态母图并快速淡入现有旋纹，不播放 B、D。

## 六、失败判定

出现以下任一情况即淘汰，不进入代码：

- 泥坯外轮廓在视频中持续呼吸或融化；
- 孔口位置明显漂移；
- 表面纹理像贴纸在平面上转；
- 首尾帧不能闭环；
- 加速视频自行生成了新场景或提前改变为磁州窑纹样；
- 为了掩盖形变而使用严重动态模糊。

如果两个视频版本都无法通过，停止继续抽卡，改用选定母图重建同一件 3D 泥坯并渲染转台与推镜动画。
