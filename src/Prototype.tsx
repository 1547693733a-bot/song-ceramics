import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  ArrowLeftIcon,
  Cross2Icon,
  SpeakerLoudIcon,
  SpeakerOffIcon,
} from "@radix-ui/react-icons";
import { Carousel, MobileScroll, useKeyboard } from "./mobile";

gsap.registerPlugin(useGSAP);

type KilnPortalMotion = "ge" | "ru" | "guan" | "cizhou" | "longquan" | "jun" | "yaozhou" | "ding";
type KilnFireMotion = KilnPortalMotion;
type FireMotion = KilnFireMotion;
type KilnAtmosphereLevel = "quiet" | "balanced" | "active";

type KilnAtmospherePreset = {
  heat: number;
  maxSparks: number;
  spawnRange: readonly [number, number];
  colors: readonly [readonly [number, number, number], readonly [number, number, number]];
  halo: string;
  drift: number;
  seed: number;
};

type Kiln = {
  id: string;
  portalMotion: KilnPortalMotion;
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
  panoramaMotion?: KilnPortalMotion;
  fire?: string;
  fireMotion?: KilnFireMotion;
  atmosphere?: KilnAtmosphereLevel;
};

const kilnAtmospherePresets: Record<KilnAtmosphereLevel, KilnAtmospherePreset> = {
  quiet: {
    heat: 1.36,
    maxSparks: 12,
    spawnRange: [0.47, 0.86],
    colors: [[231, 199, 142], [159, 92, 57]],
    halo: "128 165 157",
    drift: 0.72,
    seed: 17,
  },
  balanced: {
    heat: 1.36,
    maxSparks: 12,
    spawnRange: [0.47, 0.86],
    colors: [[235, 195, 132], [155, 86, 52]],
    halo: "166 151 126",
    drift: 0.92,
    seed: 31,
  },
  active: {
    heat: 1.36,
    maxSparks: 12,
    spawnRange: [0.47, 0.86],
    colors: [[226, 184, 110], [144, 78, 43]],
    halo: "179 130 76",
    drift: 1.18,
    seed: 47,
  },
};

const kilns: Kiln[] = [
  {
    id: "ge",
    portalMotion: "ge",
    name: "哥窑",
    vessel: "双耳瓶",
    feature: "乳浊厚釉 · 交错开片",
    description: "传世哥窑器多见灰青或米黄厚釉与深浅相间的开片；其烧造年代和窑址归属，学界至今仍有讨论。",
    image: "/assets/ceramics/01-double-ear-original.webp",
    shape: "tall",
    yaw: 0,
    pitch: 0,
    mapX: 50,
    mapY: 50,
    atlasX: 50,
    atlasY: 52,
    color: "#b7ad97",
    ink: "#4d473f",
    text: "#ece4d2",
    mutedText: "#c7baa0",
    imageFilter: "brightness(1.08) contrast(1.08)",
    atmosphereFilter: "saturate(.78) contrast(1.03) brightness(.92)",
    panorama: "/assets/kilns/ge-panorama.webp",
    panoramaMotion: "ge",
    fire: "/assets/kilns/fire-portals/ge-fire-v1.webp",
    fireMotion: "ge",
    atmosphere: "balanced",
  },
  {
    id: "ru",
    portalMotion: "ru",
    name: "汝窑",
    vessel: "莲花式碗",
    feature: "天青釉色 · 支钉烧造",
    description: "北宋晚期汝窑以温润天青釉、细密开片和细小支钉痕著称，主要发现于河南宝丰清凉寺窑址。",
    image: "/assets/ceramics/03-lotus-bowl.webp",
    shape: "low",
    yaw: -72,
    pitch: -34,
    mapX: 24,
    mapY: 24,
    atlasX: 19,
    atlasY: 25,
    color: "#86a7a2",
    ink: "#344b4d",
    text: "#e2efeb",
    mutedText: "#b8d0cc",
    imageFilter: "grayscale(.72) sepia(.18) hue-rotate(112deg) saturate(.75) brightness(1.3)",
    atmosphereFilter: "hue-rotate(4deg) saturate(.88) contrast(1.1) brightness(.84)",
    panorama: "/assets/kilns/ru-panorama-v4.webp",
    panoramaMotion: "ru",
    fire: "/assets/kilns/fire-portals/ru-fire-v1.webp",
    fireMotion: "ru",
    atmosphere: "quiet",
  },
  {
    id: "guan",
    portalMotion: "guan",
    name: "官窑",
    vessel: "方琮式瓶",
    feature: "粉青厚釉 · 仿古器形",
    description: "南宋官窑重视釉色与器形，常见粉青、灰青厚釉和开片，并以瓶、洗及仿青铜礼器等形制见长。",
    image: "/assets/ceramics/04-square-vase.webp",
    shape: "tall",
    yaw: 70,
    pitch: -36,
    mapX: 76,
    mapY: 24,
    atlasX: 70,
    atlasY: 22,
    color: "#84939a",
    ink: "#39464d",
    text: "#e5ecec",
    mutedText: "#b8c4c8",
    imageFilter: "grayscale(.78) sepia(.12) hue-rotate(145deg) saturate(.58) brightness(1.2)",
    atmosphereFilter: "hue-rotate(18deg) saturate(.62) contrast(1.06) brightness(.68)",
    panorama: "/assets/kilns/guan-panorama-v3.webp",
    panoramaMotion: "guan",
    fire: "/assets/kilns/fire-portals/guan-fire-v1.webp",
    fireMotion: "guan",
    atmosphere: "balanced",
  },
  {
    id: "cizhou",
    portalMotion: "cizhou",
    name: "磁州窑",
    vessel: "牡丹梅瓶",
    feature: "白地黑花 · 民间绘事",
    description: "磁州窑以白色化妆土配合铁质黑彩形成鲜明装饰，题材贴近日常生活，是宋金时期北方重要民窑体系。",
    image: "/assets/ceramics/02-cizhou-original.webp",
    shape: "tall",
    yaw: -132,
    pitch: 30,
    mapX: 15,
    mapY: 64,
    atlasX: 7,
    atlasY: 62,
    color: "#c4bcae",
    ink: "#292724",
    text: "#f2ead9",
    mutedText: "#cbbda5",
    imageFilter: "brightness(1.03) contrast(1.06)",
    atmosphereFilter: "grayscale(.7) sepia(.14) contrast(1.18) brightness(.62)",
    panorama: "/assets/kilns/cizhou-panorama.webp",
    panoramaMotion: "cizhou",
    fire: "/assets/kilns/fire-portals/cizhou-fire-v2.webp",
    fireMotion: "cizhou",
    atmosphere: "active",
  },
  {
    id: "longquan",
    portalMotion: "longquan",
    name: "龙泉窑",
    vessel: "花卉盖罐",
    feature: "粉青梅子青 · 厚釉如玉",
    description: "龙泉窑兴起于北宋，南宋至元达到高峰；粉青、梅子青厚釉与简洁器形共同形成温润如玉的审美。",
    image: "/assets/ceramics/05-lidded-jar.webp",
    shape: "round",
    yaw: 132,
    pitch: 32,
    mapX: 85,
    mapY: 64,
    atlasX: 68,
    atlasY: 72,
    color: "#667b68",
    ink: "#28372e",
    text: "#dce8da",
    mutedText: "#aebfae",
    imageFilter: "hue-rotate(78deg) saturate(.48) brightness(1.08)",
    atmosphereFilter: "hue-rotate(42deg) saturate(.72) contrast(1.08) brightness(.58)",
    panorama: "/assets/kilns/longquan-panorama-v2.webp",
    panoramaMotion: "longquan",
    fire: "/assets/kilns/fire-portals/longquan-fire-v1.webp",
    fireMotion: "longquan",
    atmosphere: "balanced",
  },
  {
    id: "jun",
    portalMotion: "jun",
    name: "钧窑",
    vessel: "玫瑰紫花盆",
    feature: "乳浊青釉 · 铜红窑变",
    description: "钧窑釉色以天青、月白为基础，部分器物在高温烧成中呈现蓝、紫、红交融的自然窑变。",
    image: "/assets/ceramics/06-jun-original.webp",
    shape: "low",
    yaw: -45,
    pitch: 58,
    mapX: 35,
    mapY: 83,
    atlasX: 86,
    atlasY: 49,
    color: "#77606f",
    ink: "#382e37",
    text: "#eee1eb",
    mutedText: "#cbb4c5",
    imageFilter: "brightness(1.04) contrast(1.04)",
    atmosphereFilter: "hue-rotate(298deg) saturate(.74) contrast(1.06) brightness(.62)",
    panorama: "/assets/kilns/jun-panorama.webp",
    panoramaMotion: "jun",
    fire: "/assets/kilns/fire-portals/jun-fire-v1.webp",
    fireMotion: "jun",
    atmosphere: "active",
  },
  {
    id: "yaozhou",
    portalMotion: "yaozhou",
    name: "耀州窑",
    vessel: "凤首提梁壶",
    feature: "橄榄青釉 · 刻印花纹",
    description: "北宋中晚期耀州窑青瓷以刻花最具特色，斜刀形成深浅起伏，釉料在凹处积聚后显出清晰层次。",
    image: "/assets/ceramics/07-phoenix-ewer.webp",
    shape: "round",
    yaw: 46,
    pitch: 58,
    mapX: 65,
    mapY: 83,
    atlasX: 72,
    atlasY: 79,
    color: "#73806a",
    ink: "#30392b",
    text: "#e2e9d7",
    mutedText: "#b8c3a9",
    imageFilter: "grayscale(.62) sepia(.28) hue-rotate(58deg) saturate(.78) brightness(1.12)",
    atmosphereFilter: "hue-rotate(62deg) saturate(.66) contrast(1.08) brightness(.58)",
    panorama: "/assets/kilns/yaozhou-panorama-v9-1.webp",
    panoramaMotion: "yaozhou",
    fire: "/assets/kilns/fire-portals/yaozhou-fire-v2.webp",
    fireMotion: "yaozhou",
    atmosphere: "active",
  },
  {
    id: "ding",
    portalMotion: "ding",
    name: "定窑",
    vessel: "孩儿枕",
    feature: "温润白釉 · 刻划印塑",
    description: "河北曲阳定窑在北宋达到高峰，以温润白釉和刻花、划花、印花、捏塑等多样装饰见长。",
    image: "/assets/ceramics/08-boy-pillow.webp",
    shape: "wide",
    yaw: 180,
    pitch: -4,
    mapX: 50,
    mapY: 12,
    atlasX: 35,
    atlasY: 72,
    color: "#d0c8b7",
    ink: "#5b554b",
    text: "#fff7e8",
    mutedText: "#d8cdb7",
    imageFilter: "grayscale(.9) sepia(.2) saturate(.42) brightness(1.42)",
    atmosphereFilter: "grayscale(.42) sepia(.12) saturate(.46) contrast(1.02) brightness(.78)",
    panorama: "/assets/kilns/ding-panorama-v3.webp",
    panoramaMotion: "ding",
    fire: "/assets/kilns/fire-portals/ding-fire-v1.webp",
    fireMotion: "ding",
    atmosphere: "quiet",
  },
];

const INTRO_KILN_INDEX = 3;
const INTRO_KILN = kilns[INTRO_KILN_INDEX];
const portalLabels: Record<KilnPortalMotion, string> = {
  ge: "触火 · 观裂",
  ru: "观云 · 入窑",
  guan: "触火 · 观釉",
  cizhou: "触火 · 烧成",
  longquan: "循青 · 入窑",
  jun: "触火 · 入窑",
  yaozhou: "寻刻 · 入窑",
  ding: "纳火 · 凝光",
};
const INTRO_MODEL_URL = "/assets/kilns/intro-3d/opened-clay.glb";
const INTRO_PORTAL_URL = "/assets/kilns/intro-v2/cavity-spiral-transition.webp";
const INTRO_ACCELERATE_DURATION = 320;
const INTRO_MODEL_ENTER_DURATION = 2380;
const INTRO_SETTLE_DURATION = 900;
const INTRO_HIDE_DELAY = INTRO_MODEL_ENTER_DURATION + INTRO_SETTLE_DURATION;
const INTRO_MOTION_DURATION = INTRO_ACCELERATE_DURATION + INTRO_MODEL_ENTER_DURATION;
const INTRO_CAMERA_HEIGHT = 3.8;
const INTRO_CAMERA_DEPTH = 0.32;
const INTRO_ASSETS = [INTRO_PORTAL_URL] as const;
const CIZHOU_FIRED_PANORAMA = "/assets/kilns/cizhou-knowledge/cizhou-panorama-fired-v3.webp";
const CIZHOU_HEAT_MASK = "/assets/kilns/cizhou-knowledge/cizhou-ink-heat-mask-v1.webp";
const CIZHOU_FIRING_DURATION = 3800;
const CIZHOU_HANDOFF_FADE_DURATION = 1200;
const CIZHOU_KNOWLEDGE_DELAY = CIZHOU_FIRING_DURATION + CIZHOU_HANDOFF_FADE_DURATION;
const JUN_KILNCHANGE_PANORAMA = "/assets/kilns/jun-knowledge/jun-panorama-kilnchange-v2.webp";
const JUN_KNOWLEDGE_DELAY = 4400;
const YAOZHOU_GLAZE_PANORAMA = "/assets/kilns/yaozhou-knowledge/yaozhou-panorama-glaze-depth-v2.webp";
const YAOZHOU_DEPTH_MASK = "/assets/kilns/yaozhou-knowledge/yaozhou-carving-depth-mask-v2.webp";
const YAOZHOU_KNOWLEDGE_DELAY = 4600;
const GE_CRACKLE_MASK = "/assets/kilns/ge-knowledge/ge-crackle-dual-mask-v1.webp";
const GE_KNOWLEDGE_DELAY = 4800;
const GUAN_KNOWLEDGE_PANORAMA = "/assets/kilns/guan-panorama-v3.webp";
const GUAN_FIRING_MASK = "/assets/kilns/guan-knowledge/guan-firing-mask-v1.webp";
const GUAN_KNOWLEDGE_DELAY = 5100;
const LONGQUAN_KNOWLEDGE_DELAY = 5200;
const RU_FIRED_PANORAMA = "/assets/kilns/ru-knowledge/ru-panorama-fired-v1.webp";
const RU_KNOWLEDGE_DELAY = 5200;
const DING_FIRED_PANORAMA = "/assets/kilns/ding-knowledge/ding-panorama-fired-v2.webp";
const DING_KNOWLEDGE_DELAY = 5000;

const preloadIntroAssets = () =>
  Promise.all(
    INTRO_ASSETS.map(
      (src) =>
        new Promise<void>((resolve) => {
          const image = new window.Image();
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            resolve();
          };

          image.onload = finish;
          image.onerror = finish;
          image.decoding = "sync";
          image.src = src;
          if (image.complete) finish();
        }),
    ),
  ).then(() => undefined);

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const normalizeYaw = (value: number) => ((value + 540) % 360) - 180;

const wrapIndex = (value: number, length: number) => ((value % length) + length) % length;

const angularDistanceToKiln = (yaw: number, pitch: number, kiln: Kiln) => {
  const viewPitch = (pitch * Math.PI) / 180;
  const kilnPitch = (kiln.pitch * Math.PI) / 180;
  const yawDelta = (normalizeYaw(kiln.yaw - yaw) * Math.PI) / 180;
  const cosine =
    Math.sin(viewPitch) * Math.sin(kilnPitch) +
    Math.cos(viewPitch) * Math.cos(kilnPitch) * Math.cos(yawDelta);
  return Math.acos(clamp(cosine, -1, 1));
};

const nearestKilnIndex = (yaw: number, pitch: number) => {
  let closest = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  kilns.forEach((kiln, index) => {
    const distance = angularDistanceToKiln(yaw, pitch, kiln);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = index;
    }
  });

  return closest;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startYaw: number;
  startPitch: number;
  tapTarget: "portal" | "vessel" | null;
  moved: boolean;
};

type PortalPhase = "fire" | "entering" | "artifact";
type IntroPhase = "idle" | "accelerating" | "entering" | "hidden";
type KnowledgePhase = "idle" | "heating" | "knowledge";
type CizhouArrivalPhase = "transitioning" | "ready";

type CizhouTraitHotspot = {
  id: string;
  label: string;
  title: string;
  body: string;
  x: number;
  y: number;
};

type CizhouTrait = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  vessel: string;
  period: string;
  image: string;
  video?: string;
  videoLoop?: "trim" | "native" | "none";
  videoStart?: number;
  videoEnd?: number;
  audioSource?: "scene" | "video";
  prop?: string;
  occlusion?: "cart";
  atmosphere: string;
  motion: "none" | "smoke" | "dust" | "candle";
  audio?: string;
  soundscape: string;
  fact: string;
  reconstruction: string;
  sourceLabel: string;
  sourceUrl: string;
  hotspots: readonly CizhouTraitHotspot[];
};

const cizhouTraits: readonly CizhouTrait[] = [
  {
    id: "kiln-yard",
    number: "01",
    title: "出匣初明",
    tagline: "匣钵护火，黑彩成器。",
    vessel: "磁州窑白地黑花梅瓶",
    period: "出窑 · 匣钵、垫饼与检选",
    image: "/assets/kilns/cizhou-one-shot/01-kiln-yard-closeup-song-v4.webp",
    video: "/assets/kilns/cizhou-one-shot/cizhou-vase-in-kiln-interior-v1.mp4",
    videoLoop: "trim",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-smoke-v1.webp",
    motion: "none",
    audio: "/assets/kilns/cizhou-traits/audio/02-carved-interior-v1.m4a",
    soundscape: "窑体余温、窑口轻烟与清晨院落风声",
    fact: "观台磁州窑宋金地层出土匣钵、垫饼、支钉等装烧窑具；匣钵是器物入窑烧成时真正所属的保护空间。",
    reconstruction: "窑门外低矮冷却检选台、匣钵与窑具位置，是依据观台窑址出土窑具和北方窑炉流程完成的克制复原；不对应某次具体出窑记录。",
    sourceLabel: "北京大学 · 观台磁州窑址发掘简报",
    sourceUrl: "https://ir.pku.edu.cn/handle/20.500.11897/7267",
    hotspots: [
      {
        id: "saggar",
        label: "看窑具",
        title: "匣钵护器，隔开窑火与落灰",
        body: "匣钵把器物包在耐火窑具中烧成，减少火焰与窑灰直接侵扰。出窑后，器物才会被逐件取出检选。",
        x: 64,
        y: 61,
      },
      {
        id: "firing-pad",
        label: "看垫饼",
        title: "一枚垫饼，托住器底",
        body: "垫饼等支烧窑具承托器底、控制器物与窑具的接触。它们留下的痕迹，也是辨认烧造方法的重要线索。",
        x: 68,
        y: 72,
      },
    ],
  },
  {
    id: "northbound-cart",
    number: "02",
    title: "车辙北行",
    tagline: "一车载瓷，器走北方。",
    vessel: "磁州窑白地黑花梅瓶",
    period: "流通 · 北方陆路车载",
    image: "/assets/kilns/cizhou-one-shot/02-cizhou-land-loading-v3-meiping-tree.webp",
    video: "/assets/kilns/cizhou-one-shot/02-cizhou-land-loading-v3-meiping-tree.mp4",
    videoLoop: "trim",
    audioSource: "video",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-dust-v1.webp",
    motion: "none",
    soundscape: "窑场院落微风、树叶沙沙、竹篾与草衬轻响",
    fact: "宋代绘画保存了牛车和载重车辆在山路、驿路间运输的图像。重货北行依靠车体、牵引和道路共同完成。",
    reconstruction: "梅瓶置于已捆扎货包上方，瓶底以草窝承托，外设竹编护架与颈部柔性垫护，表现最后封盖前的陆路装运准备；具体包装结构属于结合同时代陶瓷运输材料的艺术推断。",
    sourceLabel: "台北故宫博物院 · 雪栈牛车图",
    sourceUrl: "https://digitalarchive.npm.gov.tw/Collection/Detail/1474?dep=P",
    hotspots: [
      {
        id: "cart-load",
        label: "看车载",
        title: "车板承重，木轮走远路",
        body: "梅瓶不再被当作市场摆设，而是成为货车上的易碎载荷。车板、车轮和牵引方向共同交代它正在北运。",
        x: 64,
        y: 61,
      },
      {
        id: "packing",
        label: "看包裹",
        title: "草束填塞，绳索稳住器身",
        body: "低矮护套围住瓶底，草绳从两侧收紧；柔性填塞吸收车板震动，避免完整器物无遮拦地立在车上。",
        x: 68,
        y: 78,
      },
    ],
  },
  {
    id: "tavern",
    number: "03",
    title: "酒肆入席",
    tagline: "瓶中有酒，瓷上有人间。",
    vessel: "磁州窑剔黑玉壶春瓶",
    period: "功用 · 宋代盛酒器",
    image: "/assets/kilns/cizhou-one-shot/03-wine-shop-yuhuchunping-reference-with-white-black-bowl-v6.webp",
    video: "/assets/kilns/cizhou-one-shot/cizhou-tavern-generated-v2.mp4",
    videoLoop: "trim",
    videoStart: 0,
    audioSource: "video",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-candle-v1.webp",
    motion: "none",
    soundscape: "门外微风、酒旗布面轻响、树叶沙沙与稀疏鸟鸣",
    fact: "中国国家博物馆所藏北宋磁州窑剔黑玉壶春瓶，撇口、细颈、下垂腹、浅圈足，通体黑釉，瓶身剔黑缠枝牡丹花，肩部剔卷叶纹；白地黑花碗类则以白色化妆土和铁黑彩形成黑白对比。",
    reconstruction: "酒肆门槛、木格门、酒旗和木案构成宋代生活场景；主瓶严格参考馆藏剔黑玉壶春瓶，旁置一只白地黑彩小碗，木勺和布巾仅作为非陶瓷酒铺用具。",
    sourceLabel: "中国国家博物馆、故宫博物院 · 磁州窑器物资料",
    sourceUrl: "https://www.chnmuseum.cn/zp/zpml/csp/202203/t20220315_254286.shtml",
    hotspots: [
      {
        id: "shape",
        label: "看器形",
        title: "撇口细颈，腹部下垂",
        body: "玉壶春瓶的撇口、细颈、下垂腹与浅圈足形成流畅的承酒器形；黑釉剔花让缠枝牡丹和卷叶纹在器表显出黑白层次。",
        x: 64,
        y: 61,
      },
      {
        id: "wine-cup",
        label: "看小碗",
        title: "白地黑彩，黑白相映",
        body: "桌面的小碗采用白色化妆土与铁黑彩的黑白对比，仅作为与剔黑玉壶春瓶并置的饮酒小器，不增加未经核实的瓷器。",
        x: 13,
        y: 70,
      },
    ],
  },
] as const;

type KilnStoryMotion =
  | "ru-after-rain"
  | "ru-river"
  | "ru-window"
  | "guan-storage"
  | "none"
  | "ding-ash"
  | "ding-packing"
  | "ding-lamp";

type KilnStoryScene = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  vessel: string;
  period: string;
  image: string;
  video?: string;
  videoLoop?: "native" | "trim" | "crossfade" | "none";
  audio?: string;
  motion: KilnStoryMotion;
  fact: string;
  reconstruction: string;
  sourceLabel: string;
  sourceUrl: string;
  hotspots: readonly CizhouTraitHotspot[];
};

type DingAshMote = {
  x: string;
  y: string;
  size: string;
  blur: string;
  dx: string;
  dy: string;
  midDx: string;
  midDy: string;
  duration: string;
  delay: string;
  alpha: string;
  lowAlpha: string;
};

const dingAshMotes: readonly DingAshMote[] = [
  { x: "8%", y: "32%", size: "1.1px", blur: "0.15px", dx: "2px", dy: "-1px", midDx: "1px", midDy: "-0.5px", duration: "7.2s", delay: "-2.4s", alpha: "0.56", lowAlpha: "0.42" },
  { x: "15%", y: "39%", size: "1.5px", blur: "0.3px", dx: "-2px", dy: "1px", midDx: "-1px", midDy: "0.5px", duration: "8.4s", delay: "-4.1s", alpha: "0.62", lowAlpha: "0.47" },
  { x: "23%", y: "45%", size: "0.9px", blur: "0.1px", dx: "1px", dy: "-2px", midDx: "0.5px", midDy: "-1px", duration: "6.8s", delay: "-1.2s", alpha: "0.48", lowAlpha: "0.34" },
  { x: "31%", y: "51%", size: "1.25px", blur: "0.22px", dx: "-2px", dy: "1px", midDx: "-1px", midDy: "0.5px", duration: "7.8s", delay: "-3.7s", alpha: "0.58", lowAlpha: "0.41" },
  { x: "40%", y: "57%", size: "1.7px", blur: "0.55px", dx: "2px", dy: "-1px", midDx: "1px", midDy: "-0.5px", duration: "9.2s", delay: "-5.1s", alpha: "0.6", lowAlpha: "0.44" },
  { x: "48%", y: "63%", size: "1px", blur: "0.16px", dx: "-1px", dy: "1px", midDx: "-0.5px", midDy: "0.5px", duration: "8.6s", delay: "-2.2s", alpha: "0.46", lowAlpha: "0.33" },
  { x: "9%", y: "59%", size: "0.85px", blur: "0.1px", dx: "1px", dy: "-1px", midDx: "0.5px", midDy: "-0.5px", duration: "6.4s", delay: "-4.8s", alpha: "0.44", lowAlpha: "0.31" },
  { x: "18%", y: "68%", size: "1.35px", blur: "0.38px", dx: "-2px", dy: "1px", midDx: "-1px", midDy: "0.5px", duration: "8.9s", delay: "-1.8s", alpha: "0.52", lowAlpha: "0.38" },
  { x: "29%", y: "74%", size: "0.95px", blur: "0.12px", dx: "1px", dy: "-1px", midDx: "0.5px", midDy: "-0.5px", duration: "7.6s", delay: "-3.2s", alpha: "0.42", lowAlpha: "0.3" },
  { x: "41%", y: "80%", size: "1.2px", blur: "0.24px", dx: "-1px", dy: "1px", midDx: "-0.5px", midDy: "0.5px", duration: "9.6s", delay: "-5.7s", alpha: "0.46", lowAlpha: "0.32" },
  { x: "12%", y: "28%", size: "0.75px", blur: "0.08px", dx: "1px", dy: "0px", midDx: "0.5px", midDy: "0px", duration: "6.1s", delay: "-0.7s", alpha: "0.4", lowAlpha: "0.28" },
  { x: "27%", y: "36%", size: "1px", blur: "0.18px", dx: "-1px", dy: "1px", midDx: "-0.5px", midDy: "0.5px", duration: "8.1s", delay: "-2.9s", alpha: "0.5", lowAlpha: "0.35" },
] as const;

type DingKilnSpark = {
  x: string;
  y: string;
  size: string;
  rise: number;
  drift: number;
  duration: number;
  delay: number;
  alpha: number;
  tone: "gold" | "amber" | "red";
};

const dingKilnSparks: readonly DingKilnSpark[] = [
  { x: "46%", y: "76%", size: "3.8px", rise: 65, drift: -5, duration: 9.0, delay: -0.3, alpha: 0.8, tone: "gold" },
  { x: "54%", y: "69%", size: "3px", rise: 44, drift: 4, duration: 7.5, delay: -1.1, alpha: 0.67, tone: "amber" },
  { x: "39%", y: "82%", size: "2.6px", rise: 28, drift: -3, duration: 6.8, delay: -0.72, alpha: 0.6, tone: "red" },
  { x: "61%", y: "80%", size: "3.3px", rise: 86, drift: 6, duration: 11.5, delay: -1.8, alpha: 0.7, tone: "gold" },
  { x: "49%", y: "63%", size: "2px", rise: 22, drift: 2, duration: 6.2, delay: -0.42, alpha: 0.5, tone: "amber" },
  { x: "32%", y: "73%", size: "2.2px", rise: 58, drift: -7, duration: 10.0, delay: -1.46, alpha: 0.52, tone: "red" },
  { x: "68%", y: "72%", size: "2.4px", rise: 38, drift: 8, duration: 8.0, delay: -0.94, alpha: 0.5, tone: "amber" },
  { x: "57%", y: "88%", size: "1.9px", rise: 24, drift: -1, duration: 6.4, delay: -0.12, alpha: 0.46, tone: "red" },
  { x: "43%", y: "58%", size: "1.8px", rise: 18, drift: 3, duration: 5.8, delay: -0.62, alpha: 0.4, tone: "gold" },
  { x: "73%", y: "84%", size: "1.8px", rise: 46, drift: 5, duration: 8.8, delay: -1.22, alpha: 0.44, tone: "amber" },
] as const;

type KilnStoryDefinition = {
  id: "ge" | "ru" | "guan" | "longquan" | "jun" | "yaozhou" | "ding";
  ariaLabel: string;
  vesselIntegrated: boolean;
  vesselImage: string;
  vesselFilter: string;
  scenes: readonly KilnStoryScene[];
};

const kilnStories: Record<KilnStoryDefinition["id"], KilnStoryDefinition> = {
  ge: {
    id: "ge",
    ariaLabel: "识窑 · 哥窑三幕",
    vesselIntegrated: true,
    vesselImage: "",
    vesselFilter: "none",
    scenes: [
      {
        id: "fish-ear-censer",
        number: "01",
        title: "鱼耳承古",
        tagline: "一炉承古，厚釉把晨光收进静处。",
        vessel: "传世哥窑鱼耳炉",
        period: "陈设 · 宫廷式香事空间",
        image: "/assets/kilns/ge-one-shot/01-fish-ear-censer-palace-v1.webp",
        video: "/assets/kilns/ge-one-shot/01-fish-ear-censer-palace-v2-loop.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "故宫博物院所述传世哥窑器多见乳浊的灰青或米黄釉，器类包括炉、瓶、碗、盘、洗等；鱼耳炉属于借鉴古代礼器形制的陈设器。",
        reconstruction: "哥窑的烧造年代与窑址归属尚无定论。画面仅依据传世哥窑器的分类和宫廷式陈设语境进行艺术复原，不指认具体窑场。",
        sourceLabel: "故宫博物院 · 哥窑与传世哥窑研究",
        sourceUrl: "https://www.dpm.org.cn/lemmas/239358.html",
        hotspots: [
          {
            id: "fish-ears",
            label: "看鱼耳",
            title: "仿古之形，先由双耳建立器物秩序",
            body: "双鱼形耳与炉身共同构成对称的仿古轮廓。厚釉覆盖器表后，开片会随釉层状态自然形成，而不是后加的规则纹样。",
            x: 52,
            y: 66,
          },
        ],
      },
      {
        id: "long-neck-crackle",
        number: "02",
        title: "开片之纹",
        tagline: "冷光缓行，金丝铁线才从厚釉里浮现。",
        vessel: "传世哥窑长颈瓶",
        period: "赏鉴 · 宫廷式书斋陈设",
        image: "/assets/kilns/ge-one-shot/02-long-neck-bottle-crackle-v1.webp",
        video: "/assets/kilns/ge-one-shot/02-long-neck-bottle-crackle-v2-loop.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "传世哥窑器常见粗深与细浅两类开片交错，后世以“金丝铁线”概括其视觉效果；这是一种对釉面开片层次的描述，并非金属装饰。",
        reconstruction: "场景以稳定侧光帮助观察器表开片，木案、素布与格窗仅承担赏鉴语境，不代表某件传世瓶的确切历史摆放位置。",
        sourceLabel: "故宫博物院 · 哥窑与传世哥窑研究",
        sourceUrl: "https://www.dpm.org.cn/show/246117.html",
        hotspots: [
          {
            id: "double-crackle",
            label: "看开片",
            title: "粗线为骨，细线在其间继续生长",
            body: "长颈与圆腹提供了连续釉面，使粗深开片和细密暖色纹路能够同时被侧光读出；动态只改变反射，不让裂纹本身移动。",
            x: 51,
            y: 61,
          },
        ],
      },
      {
        id: "lobed-bowl",
        number: "03",
        title: "紫口铁足",
        tagline: "釉薄处露骨，口沿与足端留下胎色。",
        vessel: "传世哥窑葵口碗",
        period: "日用 · 宫廷式内室清供",
        image: "/assets/kilns/ge-one-shot/03-lobed-bowl-purple-rim-v1.webp",
        video: "/assets/kilns/ge-one-shot/03-lobed-bowl-purple-rim-v2-loop.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "部分传世哥窑器在口沿等薄釉处透出较深胎色，足端露胎亦呈深色，后世常以“紫口铁足”概括这一类外观。",
        reconstruction: "漆案、素布与木匙用于补足安静的生活痕迹；画面是基于传世器物特征的宫廷式使用想象，不对应某一历史房间。",
        sourceLabel: "故宫博物院 · 哥窑与传世哥窑研究",
        sourceUrl: "https://www.dpm.org.cn/lemmas/239358.html",
        hotspots: [
          {
            id: "rim-foot",
            label: "看口足",
            title: "一圈薄釉，把胎骨从青灰釉色中显出来",
            body: "葵口边缘的褐紫色与圈足的深胎色互相呼应。暖光只沿口沿和漆桌反射缓慢移动，器物、布与木匙都保持静止。",
            x: 52,
            y: 63,
          },
        ],
      },
    ],
  },
  ru: {
    id: "ru",
    ariaLabel: "识窑 · 汝窑三幕",
    vesselIntegrated: true,
    vesselImage: "/assets/ceramics/03-lotus-bowl.webp",
    vesselFilter: "grayscale(.76) sepia(.12) hue-rotate(190deg) saturate(.62) brightness(1.6)",
    scenes: [
      {
        id: "kiln-rain",
        number: "01",
        title: "雨歇开窑",
        tagline: "雨过天青，釉从火里醒来。",
        vessel: "北宋汝窑莲花式碗",
        period: "出窑 · 清凉寺窑场检选",
        image: "/assets/kilns/ru-one-shot/01-kiln-after-rain-integrated-v2.webp",
        motion: "ru-after-rain",
        fact: "清凉寺窑址所见汝器以厚润青釉、细密开片与支钉烧造痕迹著称；传世汝器的生产年代集中在北宋晚期。",
        reconstruction: "雨后窑场、石案与远处工匠为依据清凉寺窑址环境完成的克制复原，画面不对应某一件传世器物的确切出窑记录。",
        sourceLabel: "大英博物馆 · 北宋汝窑碗",
        sourceUrl: "https://www.britishmuseum.org/collection/object/A_PDF-3",
        hotspots: [
          {
            id: "glaze",
            label: "看釉色",
            title: "天青不是平涂，是厚釉里浮出的冷光",
            body: "汝釉在灰青、淡蓝与微带紫意的乳浊层之间缓慢过渡。细开片只在近看时出现，不应该压过器形本身。",
            x: 67,
            y: 72,
          },
        ],
      },
      {
        id: "river-tribute",
        number: "02",
        title: "水路入京",
        tagline: "器物离窑，水运连接产地与都城。",
        vessel: "北宋汝窑莲花式碗",
        period: "流通 · 北宋水路运输复原",
        image: "/assets/kilns/ru-one-shot/02-river-transport-no-people-v2.webp",
        video: "/assets/kilns/ru-one-shot/02-river-transport-no-people-v2.mp4",
        videoLoop: "trim",
        motion: "ru-river",
        fact: "清凉寺窑址出土器与传世汝器表明，汝窑在北宋晚期曾烧造宫廷用瓷；其生产延续时间较短，传世完整器数量有限。",
        reconstruction: "目前没有材料能够证明画面中的某一次具体运输。码头、货船和装匣方式依据北宋水运条件作情境化复原，用于说明器物离开窑场后的流通环节。",
        sourceLabel: "故宫博物院 · 汝窑瓷器专题",
        sourceUrl: "https://www.dpm.org.cn/show/226231.html",
        hotspots: [
          {
            id: "packing",
            label: "看奉运",
            title: "稀少不只来自烧造，也来自长途保存",
            body: "厚釉与纤细器形在运输中需要稳固承托。画面以草衬木匣缓冲碰撞，再用绳扎货箱、跳板与货船串起沿汴水奉运的完整路径。",
            x: 68,
            y: 82,
          },
        ],
      },
      {
        id: "palace-study",
        number: "03",
        title: "清供照影",
        tagline: "宫窗微明，器物只留一层静气。",
        vessel: "北宋汝窑莲花式碗",
        period: "宫用 · 北宋内廷清供",
        image: "/assets/kilns/ru-one-shot/03-palace-study-sunlight-v1.webp",
        motion: "ru-window",
        fact: "故宫博物院相关展览将传世汝器与清凉寺窑址出土器对照研究，并以支钉痕、釉色和器形等特征说明其宫廷用瓷属性。",
        reconstruction: "宫中书斋与清供台面以格窗强光、少陈设和近景器物表现汝器釉面的含蓄反光；具体陈设关系属于艺术复原。",
        sourceLabel: "故宫博物院 · 汝窑瓷器专题",
        sourceUrl: "https://www.dpm.org.cn/show/226231.html",
        hotspots: [
          {
            id: "quiet-light",
            label: "看清供",
            title: "器物越静，窗光越能显出釉层深浅",
            body: "侧窗冷光沿莲瓣口缘移动，厚釉处仍保留天青体色，薄处只出现一线柔亮，不做金属般的高光。",
            x: 67,
            y: 72,
          },
        ],
      },
    ],
  },
  ding: {
    id: "ding",
    ariaLabel: "识窑 · 定窑三幕",
    vesselIntegrated: true,
    vesselImage: "/assets/ceramics/08-boy-pillow.webp",
    vesselFilter: "grayscale(.9) sepia(.2) saturate(.42) brightness(1.42)",
    scenes: [
      {
        id: "kiln-inspection",
        number: "01",
        title: "火退牙白",
        tagline: "窑火收住，白釉才显出温度。",
        vessel: "北宋定窑白釉孩儿枕",
        period: "出窑 · 曲阳窑场检选",
        image: "/assets/kilns/ding-one-shot/01-kiln-inspection-firelight-v1.webp",
        audio: "/assets/kilns/ding-one-shot/audio/01-kiln-inspection-ambience-v1.m4a",
        motion: "ding-ash",
        fact: "北宋定窑以白釉瓷器为主，常见划花、刻花、印花与捏塑装饰；孩儿枕把捏塑器形与牙白釉结合在一起。",
        reconstruction: "窑后检选、匣钵与浅色工坊依据曲阳定窑烧造背景完成艺术复原，不对应故宫藏品的确切出窑现场。",
        sourceLabel: "故宫博物院 · 定窑白釉孩儿枕",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/226760.html",
        hotspots: [
          {
            id: "ivory-glaze",
            label: "看白釉",
            title: "象牙白不是冷白，而是火后留下的柔暖",
            body: "牙白釉把人物面部、衣褶和榻座纹样收进同一层温润光泽，细部依靠浅阴影而不是强色差出现。",
            x: 66,
            y: 62,
          },
        ],
      },
      {
        id: "packing-hall",
        number: "02",
        title: "印花成型",
        tagline: "模印入坯，纹样在白釉之下定形。",
        vessel: "北宋定窑白釉孩儿枕",
        period: "工艺 · 模印与捏塑",
        image: "/assets/kilns/ding-one-shot/02-packing-decoration-integrated-v1.webp",
        video: "/assets/kilns/ding-one-shot/02-bamboo-blind-seamless-v4.mp4",
        videoLoop: "trim",
        motion: "ding-packing",
        fact: "定窑装饰技法包括划花、刻花、印花和捏塑。印花通常在坯体尚未烧成时压印纹样，再施透明釉烧成，纹样由凹凸和积釉深浅显现。",
        reconstruction: "画面将成品孩儿枕与半干白瓷坯样并置，用以区分捏塑成形和模印装饰；木案、印模与竹帘属于工艺说明性的艺术复原。",
        sourceLabel: "故宫博物院 · 定窑孩儿枕",
        sourceUrl: "https://intl.dpm.org.cn/Ceramicsis/64068.html",
        hotspots: [
          {
            id: "relief",
            label: "看成形",
            title: "捏塑成形与模印纹样是两类工艺",
            body: "孩儿枕以人物身体构成完整枕体，属于塑形；旁侧坯样上的纹样则由印模压出。二者都在施釉、烧成前完成。",
            x: 66,
            y: 62,
          },
        ],
      },
      {
        id: "sleeping-chamber",
        number: "03",
        title: "枕上清凉",
        tagline: "灯影渐短，瓷枕真正进入日常。",
        vessel: "北宋定窑白釉孩儿枕",
        period: "功用 · 宋人寝具",
        image: "/assets/kilns/ding-one-shot/03-sleeping-chamber-integrated-v1.webp",
        video: "/assets/kilns/ding-one-shot/03-sleeping-chamber-candle-v1-no-music.mp4",
        videoLoop: "trim",
        audio: "/assets/kilns/cizhou-traits/audio/03-painted-pillow-night-v1.m4a",
        motion: "ding-lamp",
        fact: "宋代瓷枕较为流行，常见几何形、人物形和动物形。故宫所藏定窑孩儿枕以伏卧孩童的背部构成枕面，兼具实用与塑像意味。",
        reconstruction: "寝榻、竹帘与远处灯盏用来解释瓷枕的日常功能，室内布局并非某一历史居所的复原图。",
        sourceLabel: "故宫博物院 · 定窑白釉孩儿枕",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/226760.html",
        hotspots: [
          {
            id: "pillow-use",
            label: "看枕用",
            title: "瓷枕的清凉，来自材质与中空结构",
            body: "孩童伏卧的背部承担枕面，底部中空并留通气孔。它既是雕塑，也是实际进入寝居的器具。",
            x: 66,
            y: 62,
          },
        ],
      },
    ],
  },
  guan: {
    id: "guan",
    ariaLabel: "识窑 · 官窑三幕",
    vesselIntegrated: true,
    vesselImage: "",
    vesselFilter: "none",
    scenes: [
      {
        id: "finished-goods-house",
        number: "01",
        title: "成品静置",
        tagline: "出窑之后，粉青在侧光里沉静下来。",
        vessel: "南宋官窑粉青釉瓶与青釉洗",
        period: "成品堆放屋 · 郊坛下窑场",
        image: "/assets/kilns/guan-one-shot/01-jiaotanxia-finished-goods-house-lived-in-v10.webp",
        video: "/assets/kilns/guan-one-shot/01-finished-goods-house-v10.mp4",
        videoLoop: "native",
        motion: "guan-storage",
        fact: "郊坛下官窑作坊遗址包含成品堆放屋、修坯上釉工房、釉缸、素烧炉和排水沟等生产遗迹。",
        reconstruction: "画面依据成品堆放屋与三开间作坊遗迹进行艺术化复原；器物、草垫与竹帘表现出窑后收置和检看的生活痕迹，不对应某一次考古原位记录。",
        sourceLabel: "杭州南宋官窑博物馆 · 郊坛下作坊遗址",
        sourceUrl: "https://z.hangzhou.cn/2020/rwwhql/content/content_7746554.htm",
        hotspots: [
          {
            id: "finished-glaze",
            label: "看粉青",
            title: "厚釉器物先在成品屋里安静下来",
            body: "粉青釉瓶与青釉洗不再紧贴窑火，而是在有遮护的成品堆放空间里等待检看。侧光掠过开片和低足，器形、釉色与使用痕迹同时被看见。",
            x: 68,
            y: 70,
          },
        ],
      },
      {
        id: "glaze-settling-workshop",
        number: "02",
        title: "釉色初定",
        tagline: "粉青入釉，器形在侧光中显出深浅。",
        vessel: "南宋官窑粉青釉葵花式洗",
        period: "修坯上釉工房 · 郊坛下窑场",
        image: "/assets/kilns/guan-one-shot/02-glaze-settling-workshop-v3-vessel-closeup.webp",
        video: "/assets/kilns/guan-one-shot/02-glaze-settling-workshop-v4-forward-loop-source.mp4",
        videoLoop: "native",
        audio: "/assets/kilns/guan-one-shot/02-glaze-settling-workshop-ambience.m4a",
        motion: "none",
        fact: "郊坛下作坊遗址可见釉料缸、素烧炉、排水沟等生产遗迹；官窑粉青釉器以厚釉、开片和素面器形见长。",
        reconstruction: "画面以釉料工房和器物检看为依据的艺术化复原；葵花式洗、釉缸与木台的相对位置不对应某一次考古原位记录。",
        sourceLabel: "杭州南宋官窑博物馆 · 郊坛下作坊遗址",
        sourceUrl: "https://z.hangzhou.cn/2020/rwwhql/content/content_7746554.htm",
        hotspots: [
          {
            id: "glaze-close",
            label: "看厚釉",
            title: "粉青厚釉把光藏在器物内部",
            body: "葵花式洗的粉青釉面以厚薄变化收住侧光，细密开片和低矮器形在近距离才显出层次；周围的釉料缸与木台只作工房语境，不抢走器物的第一视线。",
            x: 58,
            y: 64,
          },
        ],
      },
      {
        id: "ritual-side-hall",
        number: "03",
        title: "香烟入礼",
        tagline: "礼器无声，香烟把粉青送入静处。",
        vessel: "南宋官窑粉青釉簋式炉",
        period: "礼仪侧厅 · 郊坛近旁",
        image: "/assets/kilns/guan-one-shot/03-ritual-side-hall-incense-v3-vessel-closeup.webp",
        video: "/assets/kilns/guan-one-shot/03-ritual-side-hall-incense-v5.mp4",
        videoLoop: "native",
        audio: "/assets/kilns/guan-one-shot/03-ritual-side-hall-incense-ambience.m4a",
        motion: "none",
        fact: "南宋官窑青瓷簋式炉见于郊坛下窑址出土资料，被用于宫廷礼仪活动；官窑器物亦供宫廷祭祀与陈设。",
        reconstruction: "画面以郊坛近旁的礼仪准备空间作艺术化复原，不对应某一处宫殿或祭坛的精确原位；香烟与烛火作为礼仪使用的时间线索。",
        sourceLabel: "西湖博物馆 · 南宋官窑青瓷簋式炉",
        sourceUrl: "https://westlakemuseum.com/index.php/gcjp/jpzs2/854-gcjp-008.html",
        hotspots: [
          {
            id: "ritual-smoke",
            label: "看香烟",
            title: "簋式炉让器形成为礼仪的一部分",
            body: "簋式炉的粉青釉、厚胎与低矮比例在薄烟中更显安定；烟气缓慢上行，提示它已经从窑场成品进入礼仪侧厅，而不是孤立的器物陈列。",
            x: 58,
            y: 64,
          },
        ],
      },
    ],
  },
  longquan: {
    id: "longquan",
    ariaLabel: "识窑 · 龙泉窑三幕",
    vesselIntegrated: true,
    vesselImage: "",
    vesselFilter: "none",
    scenes: [
      {
        id: "inspection-shed",
        number: "01",
        title: "出窑初青",
        tagline: "山雾穿棚，粉青在微明里安静下来。",
        vessel: "南宋龙泉窑粉青釉盘口瓶",
        period: "出窑 · 龙泉窑场检选",
        image: "/assets/kilns/longquan-one-shot/01-inspection-shed-reference-locked-v2.webp",
        video: "/assets/kilns/longquan-one-shot/01-inspection-shed-reference-locked-v4.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "南宋龙泉窑青瓷以厚润的粉青、梅子青釉见长。盘口瓶以浅盘口、长颈、折肩和近筒形腹构成清楚而克制的轮廓。",
        reconstruction: "开放式检选棚、木台、匣钵与远处窑棚依据龙泉山地窑场的生产语境作艺术化复原；器物形制严格参照用户提供的盘口瓶资料图。",
        sourceLabel: "故宫博物院 · 龙泉窑青釉盘口瓶",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227552.html",
        hotspots: [
          {
            id: "dish-mouth-vase",
            label: "看粉青",
            title: "长颈折肩，让粉青釉拥有完整的停光路径",
            body: "盘口、长直颈与近筒形腹把器形分成清楚的转折。柔光从口沿落到肩部，再沉入厚润的粉青釉面，器形与釉色因此同时被看见。",
            x: 68,
            y: 64,
          },
        ],
      },
      {
        id: "double-fish-washer",
        number: "02",
        title: "双鱼映水",
        tagline: "水纹轻起，两尾模印藏在青釉之下。",
        vessel: "南宋龙泉窑青釉双鱼洗",
        period: "日用 · 书斋清供",
        image: "/assets/kilns/longquan-one-shot/02-double-fish-washer-reference-locked-v2.webp",
        video: "/assets/kilns/longquan-one-shot/02-double-fish-washer-reference-locked-v3.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "龙泉窑青瓷器类丰富，南宋粉青、梅子青厚釉最具代表性。双鱼洗以浅腹、宽沿和器心模印双鱼为主要特征，纹饰与器体同施青釉。",
        reconstruction: "暗木案、薄水、布巾和墨条构成克制的书斋使用片段；双鱼洗的侧面比例与器心鱼纹分别参照用户提供的两张器物资料图。",
        sourceLabel: "故宫博物院 · 龙泉窑青瓷概述",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227139.html",
        hotspots: [
          {
            id: "molded-fish",
            label: "看双鱼",
            title: "鱼在器底，不在水中游动",
            body: "两尾鱼是模印在浅洗器心的陶瓷纹饰。清水和窗影只改变观看时的折射，鱼纹本身始终与器物连为一体。",
            x: 55,
            y: 66,
          },
        ],
      },
      {
        id: "guan-ear-study",
        number: "03",
        title: "贯耳入室",
        tagline: "一枝受风，青玉般的器身留在静处。",
        vessel: "南宋龙泉窑粉青釉贯耳瓶",
        period: "陈设 · 南宋书斋",
        image: "/assets/kilns/longquan-one-shot/03-lived-in-study-guan-ear-reference-locked-v2.webp",
        video: "/assets/kilns/longquan-one-shot/03-lived-in-study-guan-ear-reference-locked-v5-loop.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "贯耳瓶借鉴古代青铜器轮廓，以长颈、对称贯耳、鼓腹和弦纹建立庄重秩序；龙泉青釉又使这种仿古器形显得温润。",
        reconstruction: "半展卷轴、砚台、布巾、离席矮凳与窗边细枝共同构成刚有人使用过的书斋；器物比例与贯耳结构严格参照用户提供的器物资料图。",
        sourceLabel: "故宫博物院 · 龙泉窑青瓷概述",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227139.html",
        hotspots: [
          {
            id: "guan-ears",
            label: "看贯耳",
            title: "对称贯耳把仿古秩序带进青瓷",
            body: "两只矩形贯耳位于颈肩之间，与外撇口、长颈和鼓腹形成纵横节奏。淡青厚釉把清楚的结构收进柔和的表面光泽。",
            x: 66,
            y: 61,
          },
        ],
      },
    ],
  },
  jun: {
    id: "jun",
    ariaLabel: "识窑 · 钧窑三幕",
    vesselIntegrated: true,
    vesselImage: "",
    vesselFilter: "none",
    scenes: [
      {
        id: "dawn-inspection",
        number: "01",
        title: "晨光验色",
        tagline: "窑火退去，天青在微明里慢慢显色。",
        vessel: "北宋钧窑天青釉碗",
        period: "出窑 · 禹州窑场成器检看",
        image: "/assets/kilns/jun-one-shot/01-indoor-dawn-bowl-v1.webp",
        video: "/assets/kilns/jun-one-shot/01-indoor-dawn-bowl-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "钧窑以乳浊青釉著称，釉面常在天青、月白与蓝紫之间呈现含蓄变化；器物冷却后，厚釉的深浅与光泽才适合逐件检看。",
        reconstruction: "画面以窑场成品暂置的室内木架为背景，将成器放回低照度、少陈设的检看环境；器物与架上素坯的具体组合属于艺术化复原。",
        sourceLabel: "故宫博物院 · 钧窑概述与陈设器",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227007.html",
        hotspots: [
          {
            id: "dawn-glaze",
            label: "看天青",
            title: "乳浊釉把晨光收进一层柔润的青",
            body: "近处碗壁不依赖强反光，而由灰青、天蓝与口沿微暖的薄釉层次显出体积；背景器物退入暗处，让视线停在成器本身。",
            x: 69,
            y: 67,
          },
        ],
      },
      {
        id: "glaze-transformation",
        number: "02",
        title: "釉中万色",
        tagline: "青蓝为底，一抹紫红在厚釉深处凝住。",
        vessel: "北宋钧窑窑变釉碗",
        period: "近观 · 乳浊釉与铜红呈色",
        image: "/assets/kilns/jun-one-shot/02-glaze-colors-closeup-v1.webp",
        video: "/assets/kilns/jun-one-shot/02-glaze-colors-closeup-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "钧釉的乳浊感与釉层中的微小分相结构有关；部分器物以铜为呈色元素，在还原气氛与高温中形成紫红斑块，与蓝色乳浊釉自然交融。",
        reconstruction: "以近距离俯视突出碗内蓝紫窑变和不完全规整的口沿，木案仅保留必要的使用痕迹，不把器物处理成脱离环境的标本。",
        sourceLabel: "故宫博物院 · 钧窑概述与陈设器",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227007.html",
        hotspots: [
          {
            id: "copper-red",
            label: "看窑变",
            title: "紫红不是绘上去的图案",
            body: "碗心的紫红从蓝青釉层中自然晕开，边界柔和而不对称；颜色来自烧成中的材料变化，不是釉上彩绘。",
            x: 54,
            y: 62,
          },
        ],
      },
      {
        id: "garden-flowerpot",
        number: "03",
        title: "花器承影",
        tagline: "玫瑰紫落在花盆上，也把一角庭院染深。",
        vessel: "钧窑玫瑰紫釉菱花式花盆",
        period: "功用 · 陈设与栽植",
        image: "/assets/kilns/jun-one-shot/03-flower-shadow-garden-v1.webp",
        video: "/assets/kilns/jun-one-shot/03-flower-shadow-garden-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "钧窑花盆、盆托等大型陈设器常见折沿、分瓣轮廓与多足承托，釉色可由天蓝、月白过渡至海棠红、玫瑰紫等复杂层次。",
        reconstruction: "湿润石台、太湖石与枝叶投影用于说明花器进入庭院陈设后的观看方式；植物、山石和建筑关系属于克制的艺术化复原。",
        sourceLabel: "故宫博物院 · 钧窑概述与陈设器",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227007.html",
        hotspots: [
          {
            id: "flowerpot-form",
            label: "看花器",
            title: "分瓣器形把厚重釉色撑开",
            body: "外壁纵向起伏、折沿与小足共同形成稳定而有节奏的轮廓。紫红和蓝青沿分瓣转折出现深浅，让器形与釉色彼此成全。",
            x: 57,
            y: 68,
          },
        ],
      },
    ],
  },
  yaozhou: {
    id: "yaozhou",
    ariaLabel: "识窑 · 耀州窑三幕",
    vesselIntegrated: true,
    vesselImage: "",
    vesselFilter: "none",
    scenes: [
      {
        id: "fired-inspection",
        number: "01",
        title: "出窑检选",
        tagline: "成器既出，橄榄青才收住光。",
        vessel: "北宋耀州窑青釉刻牡丹纹莱菔尊",
        period: "出窑 · 黄堡窑场检选",
        image: "/assets/kilns/yaozhou-one-shot/01-fired-inspection-concept-v2.webp",
        video: "/assets/kilns/yaozhou-one-shot/01-fired-inspection-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "耀州窑位于今陕西铜川黄堡一带，北宋中期刻花工艺成熟；青釉刻牡丹纹莱菔尊是其代表器形之一，深刻纹中可见更深的积釉层次。",
        reconstruction: "窑后检选台、窑口余温与少量完成器物，依据黄堡窑场的生产背景作艺术化复原；画面不对应某次确切出窑记录。",
        sourceLabel: "中国国家博物馆 · 青釉刻牡丹纹莱菔尊",
        sourceUrl: "https://www.chnmuseum.cn/zp/zpml/csp/202208/t20220811_256924.shtml",
        hotspots: [
          {
            id: "laifu-zun",
            label: "看莱菔尊",
            title: "器形如萝卜，花纹藏在橄榄青里",
            body: "莱菔尊因腹部的鼓圆轮廓得名。器表以刻花牡丹为主，釉料在刀痕凹处自然积聚，让纹样在同一层青釉中呈现深浅。",
            x: 57,
            y: 69,
          },
          {
            id: "kiln-exit",
            label: "看窑口",
            title: "烧成之后，才有逐件检选",
            body: "器物离开窑炉后，需要经过冷却、取出和检选。这里以低照度窑口与木台说明成器刚刚进入检看的阶段。",
            x: 24,
            y: 51,
          },
        ],
      },
      {
        id: "glaze-pooling",
        number: "02",
        title: "刻影积釉",
        tagline: "刀锋入泥，深处便多留一层青。",
        vessel: "北宋耀州窑青釉刻牡丹纹碗",
        period: "成器 · 刻花与积釉",
        image: "/assets/kilns/yaozhou-one-shot/02-incised-peony-glaze-concept-v2.webp",
        video: "/assets/kilns/yaozhou-one-shot/02-incised-peony-glaze-v4.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "北宋耀州窑大口深腹碗常以内刻牡丹为主纹。斜刀刻入胎体后，橄榄青釉在凹槽中会显得更深，形成不依赖彩绘的明暗层次。",
        reconstruction: "近距离俯看碗内刻花与检选台面的关系，用于说明刻花和积釉的材料逻辑；陪衬器物只保留为窑后检看的生活痕迹。",
        sourceLabel: "台北故宫博物院 · 耀州窑青釉刻花牡丹纹碗",
        sourceUrl: "https://digitalarchive.npm.gov.tw/Collection/Detail/30090?dep=U",
        hotspots: [
          {
            id: "incised-peony",
            label: "看刻花",
            title: "斜刀入胎，牡丹从碗心舒展",
            body: "耀州窑刻花以流畅有力的刀法组织花叶。它不是附加的凸起装饰，而是在坯体表面切入深浅不同的线与面。",
            x: 54,
            y: 67,
          },
          {
            id: "pooled-glaze",
            label: "看积釉",
            title: "釉在凹处更深，纹样因此显影",
            body: "同一层釉在深刻处堆积得更多，视觉上转为更深的橄榄绿；这种深浅并不是额外绘上的颜色。",
            x: 69,
            y: 57,
          },
        ],
      },
      {
        id: "spring-tea",
        number: "03",
        title: "茶盏见春",
        tagline: "一盏入日常，春光才有了停处。",
        vessel: "北宋耀州窑青釉刻花茶碗",
        period: "功用 · 北方日常茶事",
        image: "/assets/kilns/yaozhou-one-shot/03-spring-tea-life-concept-v2.webp",
        video: "/assets/kilns/yaozhou-one-shot/03-spring-tea-life-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "宋人饮茶常将细末直接放入盏中调饮。耀州窑青瓷碗兼具日用器的实用尺度与内壁刻花带来的含蓄观看层次。",
        reconstruction: "木桌、石磨、麻布与院树构成北方民居中的日常茶事片段；器物与室内关系为艺术化推演，不对应某个传世器物的原始使用现场。",
        sourceLabel: "蒙特利尔美术馆 · 北宋耀州窑青瓷碗",
        sourceUrl: "https://www.mbam.qc.ca/en/works/23296/",
        hotspots: [
          {
            id: "tea-bowl",
            label: "看茶碗",
            title: "茶不离盏，刻花藏在水色之下",
            body: "碗不作为孤立的陈设，而是放回木桌、茶末与日光组成的使用环境；微起的釉色和花纹由近距离观看才会显现。",
            x: 68,
            y: 70,
          },
          {
            id: "tea-mill",
            label: "看石磨",
            title: "茶末经碾，才可在盏中调饮",
            body: "石质碾具提示茶叶被研磨为细末的准备过程，使茶碗进入可感知的日常生活，而不只是静置的工艺样品。",
            x: 26,
            y: 61,
          },
        ],
      },
    ],
  },
};

type SphericalPanoramaProps = {
  src: string;
  yaw: number;
  pitch: number;
  motion: KilnPortalMotion;
  enabled?: boolean;
  heatStrength: number;
  activity: number;
  emberOverlaySrc?: string;
  heatMaskSrc?: string;
  heatOrigin: readonly [number, number];
  inkHeat: number;
};

const panoramaMotionIndex = {
  ge: 1,
  cizhou: 2,
  jun: 3,
  ru: 4,
  guan: 5,
  longquan: 6,
  yaozhou: 7,
  ding: 8,
} as const;

const fireMotionPreset = {
  ge: { speed: 0.54, turbulence: 0.82, pulse: 0.26, character: 1 },
  ru: { speed: 0.46, turbulence: 0.74, pulse: 0.2, character: 1 },
  guan: { speed: 0.5, turbulence: 0.86, pulse: 0.28, character: 1 },
  cizhou: { speed: 0.78, turbulence: 1.08, pulse: 0.86, character: 2 },
  longquan: { speed: 0.59, turbulence: 0.96, pulse: 0.4, character: 3 },
  jun: { speed: 0.62, turbulence: 1.02, pulse: 0.48, character: 3 },
  yaozhou: { speed: 0.62, turbulence: 0.82, pulse: 0.42, character: 2 },
  ding: { speed: 0.42, turbulence: 0.68, pulse: 0.18, character: 1 },
} as const;

function SphericalPanorama({
  src,
  yaw,
  pitch,
  motion,
  enabled = true,
  heatStrength,
  activity,
  emberOverlaySrc,
  heatMaskSrc,
  heatOrigin,
  inkHeat,
}: SphericalPanoramaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef({ yaw, pitch });
  const activityRef = useRef(activity);
  const inkHeatRef = useRef(inkHeat);
  const heatOriginRef = useRef(heatOrigin);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    viewRef.current = { yaw, pitch };
  }, [pitch, yaw]);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    inkHeatRef.current = inkHeat;
  }, [inkHeat]);

  useEffect(() => {
    heatOriginRef.current = heatOrigin;
  }, [heatOrigin]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_texture;
      uniform sampler2D u_ember_texture;
      uniform sampler2D u_heat_mask;
      uniform vec2 u_resolution;
      uniform float u_yaw;
      uniform float u_pitch;
      uniform float u_time;
      uniform float u_motion;
      uniform float u_heat;
      uniform float u_activity;
      uniform float u_ink_heat;
      uniform vec2 u_heat_origin;

      const float PI = 3.141592653589793;

      mat3 rotateY(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
      }

      mat3 rotateX(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
      }

      void main() {
        vec2 screen = v_uv * 2.0 - 1.0;
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);
        float tanHalfFov = tan(radians(38.0));
        vec3 direction = normalize(vec3(screen.x * aspect * tanHalfFov, screen.y * tanHalfFov, 1.0));
        direction = rotateY(u_yaw) * rotateX(u_pitch) * direction;

        vec2 sampleUv = vec2(
          atan(direction.x, direction.z) / (2.0 * PI) + 0.5,
          asin(clamp(direction.y, -1.0, 1.0)) / PI + 0.5
        );

        float heatRise = smoothstep(-1.12, -0.68, screen.y) * (1.0 - smoothstep(0.84, 1.12, screen.y));
        float heatWidth = 0.42 + (1.0 - smoothstep(0.30, 1.02, abs(screen.x))) * 0.58;
        float heatMask = heatWidth * heatRise * u_heat * u_activity;
        float heatBandA = sin(screen.y * 31.0 - u_time * 1.34 + sin(screen.x * 9.0 + u_time * 0.18) * 1.05);
        float heatBandB = sin(screen.y * 18.0 - u_time * 0.78 - screen.x * 12.0);
        float heatBandC = sin(screen.y * 47.0 - u_time * 1.7 + screen.x * 5.0) * 0.22;
        vec2 heatOffset = vec2(
          (heatBandA * 0.56 + heatBandB * 0.31 + heatBandC) * 0.00128,
          (heatBandB - heatBandA + heatBandC) * 0.00031
        );
        sampleUv += heatOffset * heatMask;

        if (u_motion > 2.5 && u_motion < 3.5) {
          vec2 flow = vec2(
            sin(sampleUv.y * 19.0 + u_time * 0.085),
            sin(sampleUv.x * 23.0 - u_time * 0.065)
          );
          sampleUv += flow * 0.0015;
        }

        vec3 color = texture2D(u_texture, sampleUv).rgb;
        float grazingSpeed = 0.11 + mod(u_motion, 4.0) * 0.025;
        float grazing = sin(direction.x * (2.35 + mod(u_motion, 3.0) * 0.28) + direction.y * 1.4 + u_time * grazingSpeed) * 0.5 + 0.5;

        if (u_motion < 1.5) {
          color *= 0.94 + grazing * 0.055;
          color = mix(color, color * vec3(0.96, 1.01, 1.02), 0.10);
        } else if (u_motion < 2.5) {
          float raking = smoothstep(0.62, 0.96, grazing);
          color *= 0.79 + raking * 0.09;
          color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, 0.78);
        } else if (u_motion < 3.5) {
          float breathing = sin(u_time * 0.22 + sampleUv.x * PI * 2.0) * 0.5 + 0.5;
          color *= 0.88 + breathing * 0.055;
          color = mix(color, color * vec3(0.96, 0.99, 1.04), 0.12);
        } else if (u_motion < 4.5) {
          color *= 0.91 + grazing * 0.045;
          color = mix(color, color * vec3(0.95, 1.02, 1.01), 0.1);
        } else if (u_motion < 5.5) {
          float raking = smoothstep(0.58, 0.94, grazing);
          color *= 0.86 + raking * 0.07;
          color = mix(color, color * vec3(0.97, 1.0, 1.02), 0.08);
        } else if (u_motion < 6.5) {
          color *= 0.88 + grazing * 0.055;
          color = mix(color, color * vec3(0.96, 1.02, 0.95), 0.08);
        } else if (u_motion < 7.5) {
          float carvingLight = smoothstep(0.54, 0.9, grazing);
          color *= 0.82 + carvingLight * 0.11;
          color = mix(color, color * vec3(1.01, 1.02, 0.94), 0.08);
        } else {
          color *= 0.94 + grazing * 0.035;
          color = mix(color, color * vec3(1.03, 1.01, 0.96), 0.08);
        }

        vec4 ember = texture2D(u_ember_texture, sampleUv);
        float cizhouActive = u_motion > 1.5 && u_motion < 2.5 ? 1.0 : 0.0;
        vec4 heatMaskSample = texture2D(u_heat_mask, sampleUv);
        float inkMask = heatMaskSample.r;
        float inkMaskLeft = texture2D(u_heat_mask, sampleUv - vec2(0.00145, 0.0)).r;
        float inkMaskRight = texture2D(u_heat_mask, sampleUv + vec2(0.00145, 0.0)).r;
        float inkMaskUp = texture2D(u_heat_mask, sampleUv + vec2(0.0, 0.00145)).r;
        float inkMaskDown = texture2D(u_heat_mask, sampleUv - vec2(0.0, 0.00145)).r;
        float haloNear = (
          texture2D(u_heat_mask, sampleUv - vec2(0.007, 0.0)).r +
          texture2D(u_heat_mask, sampleUv + vec2(0.007, 0.0)).r +
          texture2D(u_heat_mask, sampleUv + vec2(0.0, 0.007)).r +
          texture2D(u_heat_mask, sampleUv - vec2(0.0, 0.007)).r
        ) * 0.25;
        float haloFar = (
          texture2D(u_heat_mask, sampleUv - vec2(0.014, 0.0)).r +
          texture2D(u_heat_mask, sampleUv + vec2(0.014, 0.0)).r +
          texture2D(u_heat_mask, sampleUv + vec2(0.0, 0.014)).r +
          texture2D(u_heat_mask, sampleUv - vec2(0.0, 0.014)).r
        ) * 0.25;
        float inkEdge = clamp(
          (abs(inkMaskRight - inkMaskLeft) + abs(inkMaskUp - inkMaskDown)) * 2.4,
          0.0,
          1.0
        );
        float radiantHalo = max(haloNear * 0.72 + haloFar * 0.38 - inkMask * 0.55, 0.0);
        vec2 heatVector = (screen - u_heat_origin) * vec2(0.76, 1.0);
        float propagationNoise =
          sin(screen.x * 10.0 + screen.y * 7.0 - u_time * 1.8) * 0.034 +
          sin(screen.y * 17.0 - screen.x * 5.0 + u_time * 1.15) * 0.024 +
          sin((screen.x + screen.y) * 27.0) * 0.012;
        float propagation = pow(clamp((u_ink_heat - 0.025) / 0.95, 0.0, 1.0), 2.4);
        float frontRadius = propagation * 1.90;
        float frontDistance = length(heatVector) + propagationNoise - frontRadius;
        float heatActivation = smoothstep(0.012, 0.065, u_ink_heat);
        float arrived = (1.0 - smoothstep(-0.012, 0.075, frontDistance)) * heatActivation;
        float hotFront = (1.0 - smoothstep(0.018, 0.115, abs(frontDistance))) * heatActivation;
        float passageAge = clamp((-frontDistance) / 1.45, 0.0, 1.0);
        float warmTail = arrived * (0.68 + (1.0 - passageAge) * 0.12);
        float heatStrengthInk = clamp(max(hotFront * 1.15, warmTail), 0.0, 1.0);
        vec3 firedInkColor = ember.rgb;
        float firedMix = inkMask * heatStrengthInk * cizhouActive;
        color = mix(color, firedInkColor, firedMix);

        color += vec3(0.62, 0.035, 0.006) * radiantHalo * warmTail * 0.055 * cizhouActive;
        color += vec3(0.12, 0.012, 0.002) * hotFront * (1.0 - inkMask) * 0.045 * cizhouActive;

        if (u_motion > 0.5 && u_motion < 1.5) {
          float geIron = clamp(heatMaskSample.r, 0.0, 1.0);
          float geGold = clamp(heatMaskSample.g, 0.0, 1.0);
          float geSeed = sin(sampleUv.x * 97.0 + sampleUv.y * 61.0) * 0.5 + 0.5;
          float geIronStart = 0.055 + (1.0 - geIron) * 0.24 + geSeed * 0.035;
          float geGoldStart = 0.29 + (1.0 - geGold) * 0.30 + (1.0 - geSeed) * 0.045;
          float geIronReveal = smoothstep(geIronStart, geIronStart + 0.26, u_ink_heat);
          float geGoldReveal = smoothstep(geGoldStart, geGoldStart + 0.28, u_ink_heat);

          float geGlazeWake = smoothstep(0.015, 0.38, u_ink_heat);
          float geCrackle = max(geIron * geIronReveal, geGold * geGoldReveal);
          vec3 geWarmGlaze = color * vec3(1.14, 0.74, 0.48) + vec3(0.075, 0.012, 0.001);
          color = mix(color, geWarmGlaze, geGlazeWake * (0.32 - geCrackle * 0.08));

          vec3 geIronColor = vec3(0.46, 0.021, 0.004);
          float geIronBlend = geIron * geIronReveal * (0.52 + geIron * 0.32);
          color = mix(color, geIronColor, clamp(geIronBlend, 0.0, 0.84));
          color += vec3(0.62, 0.055, 0.006) * geIron * geIronReveal * (0.12 + geIron * 0.12);

          float geGoldPulse = 0.94 + sin(u_time * 0.46 + sampleUv.x * 23.0 + sampleUv.y * 15.0) * 0.035;
          vec3 geGoldColor = vec3(0.94, 0.18, 0.018);
          float geGoldBlend = geGold * geGoldReveal * (0.44 + geGold * 0.34);
          color = mix(color, geGoldColor, clamp(geGoldBlend, 0.0, 0.74));
          color += vec3(0.78, 0.16, 0.014) * geGold * geGoldReveal * geGoldPulse * 0.34;
          float geWhiteCore = smoothstep(0.78, 0.98, geSeed) * smoothstep(0.55, 0.94, geGold) * geGoldReveal;
          color += vec3(1.0, 0.53, 0.14) * geWhiteCore * 0.42;

          float geNeighborCrackle = max(
            max(texture2D(u_heat_mask, sampleUv + vec2(0.009, 0.0)).b, texture2D(u_heat_mask, sampleUv - vec2(0.009, 0.0)).b),
            max(texture2D(u_heat_mask, sampleUv + vec2(0.0, 0.009)).b, texture2D(u_heat_mask, sampleUv - vec2(0.0, 0.009)).b)
          );
          float geKilnHalo = max(geNeighborCrackle - geCrackle * 0.46, 0.0) * smoothstep(0.20, 0.72, u_ink_heat);
          color += vec3(0.28, 0.026, 0.003) * geKilnHalo * 0.34;

          float geFinalHold = smoothstep(0.72, 0.82, u_ink_heat);
          color += vec3(0.055, 0.008, 0.001) * geFinalHold * (0.22 + geGold * 0.78);

          vec2 gePortalVector = screen - vec2(0.06, -0.06);
          float gePortalFocus = 1.0 - smoothstep(0.10, 0.72, length(gePortalVector * vec2(0.78, 1.0)));
          float gePortalOpen = smoothstep(0.86, 0.995, u_ink_heat) * geIron * gePortalFocus;
          color = mix(color, vec3(0.008, 0.006, 0.004), clamp(gePortalOpen * 0.92, 0.0, 0.86));
        }

        if (u_motion > 4.5 && u_motion < 5.5) {
          float guanBoundary = clamp(heatMaskSample.r, 0.0, 1.0);
          float guanThickness = clamp(heatMaskSample.g, 0.0, 1.0);
          float guanBubbles = clamp(heatMaskSample.b, 0.0, 1.0);
          float guanSeed =
            sin(sampleUv.x * 29.0 + sampleUv.y * 17.0) * 0.025 +
            sin(sampleUv.y * 11.0 - sampleUv.x * 19.0) * 0.018;
          float guanStart = 0.10 + guanThickness * 0.05 + guanSeed;
          float guanCellReveal = smoothstep(guanStart, guanStart + 0.46, u_ink_heat);
          float guanInterior = clamp(1.0 - guanBoundary * 0.82, 0.0, 1.0);

          float guanFurnaceWake = smoothstep(0.015, 0.42, u_ink_heat);
          vec3 guanFurnaceReflection = color * vec3(1.13, 0.72, 0.48) + vec3(0.065, 0.012, 0.002);
          color = mix(color, guanFurnaceReflection, guanFurnaceWake * 0.28);

          float guanThinGlaze = 1.0 - guanThickness;
          vec3 guanThinHeat = vec3(0.94, 0.105, 0.012);
          vec3 guanThickHeat = vec3(0.74, 0.19, 0.052);
          vec3 guanUnderFire = mix(guanThinHeat, guanThickHeat, guanThickness);
          float guanUnderFireBlend = guanInterior * guanCellReveal * (0.46 - guanThickness * 0.18);
          color = mix(color, guanUnderFire, clamp(guanUnderFireBlend, 0.0, 0.46));
          color += vec3(0.52, 0.065, 0.006) * guanInterior * guanCellReveal * (0.10 + guanThinGlaze * 0.12);

          float guanBoundaryReveal = smoothstep(0.28 + guanSeed * 0.25, 0.72 + guanSeed * 0.12, u_ink_heat);
          vec3 guanPurpleBody = vec3(0.155, 0.018, 0.115);
          float guanBoundaryBlend = guanBoundary * guanBoundaryReveal * (0.54 + guanBoundary * 0.24);
          color = mix(color, guanPurpleBody, clamp(guanBoundaryBlend, 0.0, 0.78));
          color += vec3(0.10, 0.018, 0.13) * guanBoundary * guanBoundaryReveal * 0.10;

          float guanBubbleGrain = sin(sampleUv.x * 137.0 + sampleUv.y * 89.0) * 0.5 + 0.5;
          float guanPearlCore =
            guanBubbles *
            smoothstep(0.72, 0.98, guanBubbleGrain) *
            guanCellReveal *
            smoothstep(0.38, 0.82, u_ink_heat);
          color += vec3(1.0, 0.63, 0.28) * guanPearlCore * (0.32 + guanThickness * 0.22);

          float guanFinalHold = smoothstep(0.70, 0.82, u_ink_heat);
          color += vec3(0.045, 0.009, 0.002) * guanFinalHold * (0.30 + guanInterior * 0.70);

          vec2 guanLensVector = screen - vec2(0.04, -0.02);
          float guanLensFocus = 1.0 - smoothstep(0.11, 0.76, length(guanLensVector * vec2(0.82, 1.0)));
          float guanLensOpen = smoothstep(0.86, 1.0, u_ink_heat) * guanLensFocus * guanInterior;
          color = mix(color, vec3(1.0, 0.55, 0.22), clamp(guanLensOpen * 0.44, 0.0, 0.44));
        }

        if (u_motion > 5.5 && u_motion < 6.5) {
          vec3 longquanSource = texture2D(u_texture, sampleUv).rgb;
          float longquanSourceLuma = dot(longquanSource, vec3(0.299, 0.587, 0.114));
          float longquanActive = smoothstep(0.015, 0.070, u_ink_heat);

          vec3 longquanBlur = (
            texture2D(u_texture, sampleUv + vec2(0.0045, 0.0)).rgb +
            texture2D(u_texture, sampleUv - vec2(0.0045, 0.0)).rgb +
            texture2D(u_texture, sampleUv + vec2(0.0, 0.0045)).rgb +
            texture2D(u_texture, sampleUv - vec2(0.0, 0.0045)).rgb +
            texture2D(u_texture, sampleUv + vec2(0.0105, 0.0065)).rgb +
            texture2D(u_texture, sampleUv - vec2(0.0105, 0.0065)).rgb +
            texture2D(u_texture, sampleUv + vec2(0.0105, -0.0065)).rgb +
            texture2D(u_texture, sampleUv - vec2(0.0105, -0.0065)).rgb
          ) * 0.125;
          float longquanBlurLuma = dot(longquanBlur, vec3(0.299, 0.587, 0.114));
          float longquanRelief = clamp((longquanSourceLuma - longquanBlurLuma) * 5.2, -0.28, 0.28);
          float longquanGlazeBody = clamp(
            longquanSource.g - (longquanSource.r + longquanSource.b) * 0.36,
            0.0,
            1.0
          );

          float longquanTransmissionMap = clamp(
            0.10 +
            smoothstep(0.22, 0.58, longquanSourceLuma) * 0.48 +
            max(longquanRelief, 0.0) * 0.62,
            0.10,
            0.78
          );
          float longquanMaterialDelay =
            (1.0 - longquanTransmissionMap) * 0.105 +
            clamp(longquanGlazeBody - 0.22, 0.0, 0.20) * 0.045;
          float longquanHeat = smoothstep(
            0.055 + longquanMaterialDelay,
            0.70 + longquanMaterialDelay * 0.35,
            u_ink_heat
          );
          float longquanOrangeHeat = smoothstep(
            0.16 + longquanMaterialDelay,
            0.57 + longquanMaterialDelay * 0.30,
            u_ink_heat
          );
          float longquanWhiteHeat = smoothstep(
            0.49 + longquanMaterialDelay * 0.45,
            0.88 + longquanMaterialDelay * 0.18,
            u_ink_heat
          );
          float longquanFinalHold = smoothstep(0.76, 0.90, u_ink_heat);

          vec3 longquanDeepHeat = vec3(0.40, 0.018, 0.002);
          vec3 longquanOrange = vec3(1.0, 0.215, 0.018);
          vec3 longquanWhiteHot = vec3(1.0, 0.91, 0.76);
          float longquanInternalHeat =
            longquanActive *
            longquanHeat *
            (0.022 + longquanTransmissionMap * 0.065);
          color +=
            longquanDeepHeat *
            longquanInternalHeat *
            (1.0 - longquanOrangeHeat * 0.52);
          float longquanGlowChannel = smoothstep(
            0.36,
            0.70,
            longquanTransmissionMap
          );
          color +=
            longquanOrange *
            longquanActive *
            longquanOrangeHeat *
            longquanGlowChannel *
            (0.028 + longquanTransmissionMap * 0.085);

          float longquanWhiteChannel =
            smoothstep(0.50, 0.76, longquanTransmissionMap) *
            longquanWhiteHeat *
            longquanActive;
          color +=
            longquanWhiteHot *
            longquanWhiteChannel *
            (0.040 + longquanFinalHold * 0.15);

          float longquanFurnaceWake = smoothstep(0.02, 0.60, u_ink_heat);
          vec3 longquanFurnaceReflection =
            color * vec3(1.10, 0.80, 0.58) + vec3(0.018, 0.003, 0.0005);
          color = mix(
            color,
            longquanFurnaceReflection,
            longquanActive * longquanFurnaceWake * 0.10
          );
        }

        if (u_motion > 2.5 && u_motion < 3.5) {
          float junMax = max(ember.r, max(ember.g, ember.b));
          float junMin = min(ember.r, min(ember.g, ember.b));
          float junSaturation = (junMax - junMin) / max(junMax, 0.001);
          float junMagentaLead = max(ember.r - ember.g, 0.0);
          float junVioletLead = max(ember.b - ember.g * 0.92, 0.0);
          float junPurpleAffinity = smoothstep(0.025, 0.19, junMagentaLead + junVioletLead * 0.48);
          float junPurpleMaterial = junPurpleAffinity * smoothstep(0.08, 0.32, junSaturation);

          float junGrain =
            sin(sampleUv.x * 37.0 + sampleUv.y * 19.0) * 0.030 +
            sin(sampleUv.y * 61.0 - sampleUv.x * 17.0) * 0.018;
          float junStart = mix(0.19, 0.035, junSaturation) + junGrain;
          float junFinish = mix(0.88, 0.69, junSaturation) + junGrain * 0.45;
          float junLocalHeat = smoothstep(junStart, junFinish, u_ink_heat) * junPurpleMaterial;
          float junMaterialSet = smoothstep(0.045, 0.82, u_ink_heat) * junPurpleMaterial;

          float junMidHeat = smoothstep(0.10, 0.30, junSaturation);
          float junHighHeat = smoothstep(0.18, 0.44, junSaturation);
          float junGlazeValue = dot(ember.rgb, vec3(0.299, 0.587, 0.114));
          vec3 junWarmGlaze = ember.rgb * vec3(1.10, 0.68, 0.54);
          vec3 junDeepHeat = vec3(0.40 + junGlazeValue * 0.12, 0.026 + junGlazeValue * 0.025, 0.012);
          vec3 junHeatColor = mix(junWarmGlaze, junDeepHeat, junMidHeat * 0.58);
          vec3 junIncandescent = vec3(
            0.84 + junGlazeValue * 0.13,
            0.17 + junGlazeValue * 0.14,
            0.045 + junGlazeValue * 0.03
          );
          junHeatColor = mix(
            junHeatColor,
            junIncandescent,
            junHighHeat * (0.42 + junGlazeValue * 0.22)
          );

          float junCoreTexture = sin(sampleUv.x * 89.0 + sampleUv.y * 53.0) * 0.5 + 0.5;
          float junCoreSignal = junCoreTexture * 0.68 + junGlazeValue * 0.32;
          float junHotCore = smoothstep(0.68, 0.94, junCoreSignal) * junHighHeat * 0.32;
          junHeatColor = mix(junHeatColor, vec3(1.0, 0.62, 0.34), junHotCore);

          color = mix(color, ember.rgb, junMaterialSet * 0.22);
          float junHeatBlend = junLocalHeat * (0.40 + junMidHeat * 0.20 + junHighHeat * 0.18);
          color = mix(color, junHeatColor, clamp(junHeatBlend, 0.0, 0.78));
          float junKilnPulse = 0.94 + sin(u_time * 0.72 + sampleUv.x * 12.0) * 0.035;
          color += vec3(0.28, 0.052, 0.012) * junLocalHeat * (0.09 + junHighHeat * 0.17) * junKilnPulse;
          float junGlowGrain = 0.48 + junCoreTexture * 0.52;
          float junTieredEmission = junLocalHeat * (0.18 + junHighHeat * 0.52) * junGlowGrain * junKilnPulse;
          color += vec3(0.68, 0.18, 0.035) * junTieredEmission;
          color += vec3(0.34, 0.24, 0.13) * junLocalHeat * junHotCore;

          vec3 junNeighborLeft = texture2D(u_ember_texture, sampleUv - vec2(0.010, 0.0)).rgb;
          vec3 junNeighborRight = texture2D(u_ember_texture, sampleUv + vec2(0.010, 0.0)).rgb;
          vec3 junNeighborUp = texture2D(u_ember_texture, sampleUv + vec2(0.0, 0.010)).rgb;
          vec3 junNeighborDown = texture2D(u_ember_texture, sampleUv - vec2(0.0, 0.010)).rgb;
          float junHaloAffinity = (
            max(junNeighborLeft.r - junNeighborLeft.g, 0.0) +
            max(junNeighborRight.r - junNeighborRight.g, 0.0) +
            max(junNeighborUp.r - junNeighborUp.g, 0.0) +
            max(junNeighborDown.r - junNeighborDown.g, 0.0)
          ) * 0.25;
          float junRadiantHalo = smoothstep(0.045, 0.16, junHaloAffinity) * smoothstep(0.14, 0.76, u_ink_heat);
          color += vec3(0.15, 0.025, 0.004) * junRadiantHalo * (0.42 + junHighHeat * 0.28);

          float junKilnWarmth = smoothstep(0.10, 0.78, u_ink_heat);
          color += vec3(0.052, 0.006, 0.002) * junKilnWarmth * (0.22 + junPurpleMaterial * 0.78);
        }

        if (u_motion > 3.5 && u_motion < 4.5) {
          vec3 ruSource = texture2D(u_texture, sampleUv).rgb;
          vec3 ruFired = ember.rgb;
          float ruFiredLuma = dot(ruFired, vec3(0.299, 0.587, 0.114));
          float ruFiredReady = step(0.06, ruFiredLuma);
          float ruWarmSignal = clamp(ruFired.r - ruFired.b * 0.72, 0.0, 1.0);
          float ruCloudSignal = clamp(
            smoothstep(0.28, 0.74, ruFiredLuma) * 0.58 +
            smoothstep(0.10, 0.46, ruWarmSignal) * 0.42,
            0.0,
            1.0
          );
          float ruDrift =
            sin(sampleUv.x * 7.0 + sampleUv.y * 4.0) * 0.035 +
            sin(sampleUv.y * 11.0 - sampleUv.x * 3.0) * 0.022;

          float ruChamberWake = smoothstep(0.02, 0.30, u_ink_heat);
          vec3 ruWarmReflection = ruSource * vec3(1.02, 0.88, 0.78) + vec3(0.018, 0.004, 0.001);
          color = mix(color, ruWarmReflection, ruChamberWake * 0.11);

          float ruCloudOpen = smoothstep(
            0.10 + (1.0 - ruCloudSignal) * 0.16 + ruDrift,
            0.72 + (1.0 - ruCloudSignal) * 0.12 + ruDrift,
            u_ink_heat
          );
          float ruThickGlaze = smoothstep(0.46, 0.78, dot(ruSource, vec3(0.299, 0.587, 0.114)));
          vec3 ruCoolVeil = ruSource * vec3(0.86, 0.99, 1.08);
          vec3 ruBalancedFired = mix(
            ruFired,
            ruCoolVeil,
            0.18 + ruThickGlaze * 0.18
          );
          float ruFiredBlend = ruCloudOpen * (0.72 + ruCloudSignal * 0.18) * ruFiredReady;
          color = mix(color, ruBalancedFired, clamp(ruFiredBlend, 0.0, 0.88));

          float ruGlazeCondense =
            smoothstep(0.68, 0.88, u_ink_heat) *
            smoothstep(0.54, 0.84, ruFiredLuma) *
            smoothstep(0.50, 0.82, ruCloudSignal);
          color += vec3(0.16, 0.075, 0.025) * ruGlazeCondense * 0.34;

          float ruFinalSet = smoothstep(0.86, 0.94, u_ink_heat);
          color = mix(color, ruBalancedFired, ruFinalSet * ruFiredReady * 0.12);
        }

        if (u_motion > 6.5 && u_motion < 7.5) {
          float yaozhouDepth = clamp(inkMask, 0.0, 1.0);
          float yaozhouGrain =
            sin(sampleUv.x * 43.0 + sampleUv.y * 29.0) * 0.025 +
            sin(sampleUv.y * 71.0 - sampleUv.x * 31.0) * 0.014;
          float yaozhouStart = mix(0.18, 0.035, yaozhouDepth) + yaozhouGrain;
          float yaozhouFinish = mix(0.88, 0.66, yaozhouDepth) + yaozhouGrain * 0.42;
          float yaozhouLocalHeat = smoothstep(yaozhouStart, yaozhouFinish, u_ink_heat);
          float yaozhouGlazeSet = smoothstep(0.16, 0.88, u_ink_heat);
          float yaozhouDepthBlend = yaozhouGlazeSet * (0.16 + yaozhouDepth * 0.84);
          color = mix(color, ember.rgb, clamp(yaozhouDepthBlend, 0.0, 1.0));

          float yaozhouMoltenWindow = smoothstep(0.08, 0.34, u_ink_heat);
          float yaozhouMolten = pow(yaozhouDepth, 0.82) * yaozhouLocalHeat * yaozhouMoltenWindow;
          float yaozhouPulse = 0.93 + sin(u_time * 0.92 + sampleUv.y * 18.0) * 0.045;
          color += vec3(0.95, 0.18, 0.028) * yaozhouMolten * yaozhouPulse * 0.92;

          float yaozhouCoreTexture = sin(sampleUv.x * 103.0 + sampleUv.y * 67.0) * 0.5 + 0.5;
          float yaozhouHotCore =
            smoothstep(0.76, 0.97, yaozhouCoreTexture) *
            smoothstep(0.68, 0.95, yaozhouDepth) *
            yaozhouMoltenWindow;
          color += vec3(1.0, 0.62, 0.30) * yaozhouHotCore * 0.34;

          float yaozhouRidge = inkEdge * (1.0 - yaozhouDepth * 0.58) * smoothstep(0.44, 0.88, u_ink_heat);
          color += vec3(0.32, 0.34, 0.20) * yaozhouRidge * 0.16;
          float yaozhouKilnWarmth = smoothstep(0.10, 0.72, u_ink_heat);
          color += vec3(0.10, 0.022, 0.003) * yaozhouKilnWarmth * (0.22 + yaozhouDepth * 0.78);
          float yaozhouFurnaceEdge = smoothstep(
            0.18,
            1.12,
            dot(screen * vec2(0.82, 1.0), screen * vec2(0.82, 1.0))
          );
          color += vec3(0.16, 0.031, 0.004) * yaozhouKilnWarmth * (0.14 + yaozhouFurnaceEdge * 0.86) * 0.58;
        }

        if (u_motion > 7.5) {
          vec3 dingFired = ember.rgb;
          float dingFiredReady = step(0.06, dot(dingFired, vec3(0.299, 0.587, 0.114)));
          float dingFiredBlend = clamp(u_ink_heat / 0.86, 0.0, 1.0) * dingFiredReady;
          color = mix(color, dingFired, dingFiredBlend);
        }

        float vignette = 1.0 - smoothstep(0.40, 1.25, dot(screen, screen)) * 0.30;
        gl_FragColor = vec4(color * vignette, 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create panorama shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) ?? "Panorama shader compilation failed";
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };

    const program = gl.createProgram();
    if (!program) return;
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Panorama program linking failed");
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([78, 73, 65, 255]),
    );

    // Scene transitions can unmount this renderer while one of the panorama
    // textures is still decoding.  Keep a disposal flag so those async
    // callbacks never bind a texture after it has been deleted.
    let disposed = false;
    let emberImage: HTMLImageElement | null = null;
    let heatMaskImage: HTMLImageElement | null = null;

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (disposed) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      canvas.dataset.ready = "true";
    };
    image.src = src;

    const emberTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, emberTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    if (emberOverlaySrc) {
      const nextEmberImage = new Image();
      emberImage = nextEmberImage;
      nextEmberImage.decoding = "async";
      nextEmberImage.onload = () => {
        if (disposed) return;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, emberTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nextEmberImage);
        canvas.dataset.emberReady = "true";
      };
      nextEmberImage.src = emberOverlaySrc;
    }

    const heatMaskTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, heatMaskTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    if (heatMaskSrc) {
      const nextHeatMaskImage = new Image();
      heatMaskImage = nextHeatMaskImage;
      nextHeatMaskImage.decoding = "async";
      nextHeatMaskImage.onload = () => {
        if (disposed) return;
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, heatMaskTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nextHeatMaskImage);
        canvas.dataset.heatMaskReady = "true";
      };
      nextHeatMaskImage.src = heatMaskSrc;
    }

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const yawLocation = gl.getUniformLocation(program, "u_yaw");
    const pitchLocation = gl.getUniformLocation(program, "u_pitch");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const motionLocation = gl.getUniformLocation(program, "u_motion");
    const heatLocation = gl.getUniformLocation(program, "u_heat");
    const activityLocation = gl.getUniformLocation(program, "u_activity");
    const inkHeatLocation = gl.getUniformLocation(program, "u_ink_heat");
    const heatOriginLocation = gl.getUniformLocation(program, "u_heat_origin");
    gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_ember_texture"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "u_heat_mask"), 2);
    gl.uniform1f(motionLocation, panoramaMotionIndex[motion]);
    gl.uniform1f(heatLocation, heatStrength);

    let frame = 0;
    let idleTimer: number | null = null;
    let width = 0;
    let height = 0;
    let resizeDirty = true;
    let documentVisible = document.visibilityState === "visible";
    let lastDrawTime = 0;
    let lastDrawYaw = viewRef.current.yaw;
    let lastDrawPitch = viewRef.current.pitch;
    const startedAt = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderRatio = Math.min(
      window.devicePixelRatio || 1,
      window.matchMedia("(pointer: coarse)").matches ? 1.35 : 1.55,
    );
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          resizeDirty = true;
        });
    resizeObserver?.observe(canvas);
    const handleVisibility = () => {
      documentVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);
    let currentActivity = reducedMotion ? 0 : activityRef.current;
    let currentInkHeat = reducedMotion ? inkHeatRef.current : 0;
    let previousInkTarget = inkHeatRef.current;
    let inkHeatStartedAt: number | null = previousInkTarget > 0.5 ? startedAt : null;
    let previousTime = startedAt;
    const render = (time: number) => {
      if (disposed) return;
      if (!enabledRef.current || !documentVisible) {
        idleTimer = window.setTimeout(() => {
          idleTimer = null;
          frame = window.requestAnimationFrame(render);
        }, 220);
        return;
      }

      const nextView = viewRef.current;
      const viewIsMoving = Math.abs(nextView.yaw - lastDrawYaw) > 0.0001 || Math.abs(nextView.pitch - lastDrawPitch) > 0.0001;
      const minimumFrameInterval = viewIsMoving || inkHeatRef.current > 0.5 ? 14 : 30;
      if (time - lastDrawTime < minimumFrameInterval) {
        frame = window.requestAnimationFrame(render);
        return;
      }
      lastDrawTime = time;
      lastDrawYaw = nextView.yaw;
      lastDrawPitch = nextView.pitch;

      if (resizeDirty) {
        const nextWidth = Math.max(1, Math.round(canvas.clientWidth * renderRatio));
        const nextHeight = Math.max(1, Math.round(canvas.clientHeight * renderRatio));
        if (nextWidth !== width || nextHeight !== height) {
          width = nextWidth;
          height = nextHeight;
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        resizeDirty = false;
      }
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform1f(yawLocation, (nextView.yaw * Math.PI) / 180);
      gl.uniform1f(pitchLocation, (nextView.pitch * Math.PI) / 180);
      const delta = Math.min(100, Math.max(0, time - previousTime));
      previousTime = time;
      const targetActivity = reducedMotion ? 0 : activityRef.current;
      currentActivity += (targetActivity - currentActivity) * (1 - Math.exp(-delta / 720));
      gl.uniform1f(activityLocation, currentActivity);
      const targetInkHeat = inkHeatRef.current;
      if (targetInkHeat > 0.5 && previousInkTarget <= 0.5) inkHeatStartedAt = time;
      if (targetInkHeat <= 0.5) {
        inkHeatStartedAt = null;
        currentInkHeat = 0;
      } else if (reducedMotion) {
        currentInkHeat = 1;
      } else {
        const firingDuration =
          motion === "ge"
            ? GE_KNOWLEDGE_DELAY
            : motion === "guan"
              ? GUAN_KNOWLEDGE_DELAY
            : motion === "longquan"
              ? LONGQUAN_KNOWLEDGE_DELAY
            : motion === "ding"
              ? DING_KNOWLEDGE_DELAY
            : motion === "ru"
              ? RU_KNOWLEDGE_DELAY
            : motion === "jun"
              ? JUN_KNOWLEDGE_DELAY
              : motion === "yaozhou"
                ? YAOZHOU_KNOWLEDGE_DELAY
                : CIZHOU_FIRING_DURATION;
        currentInkHeat = Math.min(1, Math.max(0, (time - (inkHeatStartedAt ?? time)) / firingDuration));
      }
      previousInkTarget = targetInkHeat;
      gl.uniform1f(inkHeatLocation, currentInkHeat);
      gl.uniform2f(heatOriginLocation, heatOriginRef.current[0], heatOriginRef.current[1]);
      gl.uniform1f(timeLocation, reducedMotion ? 0 : (time - startedAt) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      image.onload = null;
      if (emberImage) emberImage.onload = null;
      if (heatMaskImage) heatMaskImage.onload = null;
      window.cancelAnimationFrame(frame);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteTexture(texture);
      gl.deleteTexture(emberTexture);
      gl.deleteTexture(heatMaskTexture);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
    };
  }, [emberOverlaySrc, heatMaskSrc, heatStrength, motion, src]);

  return <canvas ref={canvasRef} className="sphere-panorama" aria-hidden="true" />;
}

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: readonly [number, number, number];
  phase: number;
};

type KilnEmbersProps = {
  preset?: KilnAtmospherePreset;
  activity: number;
};

function KilnEmbers({ preset, activity }: KilnEmbersProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activityRef = useRef(activity);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !preset || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let seed = preset.seed >>> 0;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const sparks: Spark[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let idleTimer: number | null = null;
    let lastDrawTime = 0;
    let lastTime = performance.now();
    let spawnIn = 0.38 + random() * 0.42;
    let smoothedActivity = activityRef.current;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      width = Math.max(1, canvas.clientWidth);
      height = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const addSpark = (verticalBand = random()) => {
      if (sparks.length >= preset.maxSparks) return;
      const color = random() > 0.3 ? preset.colors[0] : preset.colors[1];
      const verticalPosition =
        verticalBand < 0.32
          ? 0.16 + random() * 0.24
          : verticalBand < 0.68
            ? 0.42 + random() * 0.25
            : 0.7 + random() * 0.24;
      sparks.push({
        x: width * (0.08 + random() * 0.84),
        y: height * verticalPosition,
        vx: (random() - 0.46) * 16 * preset.drift + (preset.drift > 1 ? (random() - 0.32) * 8 : 0),
        vy: -(25 + random() * 35) * preset.drift,
        age: 0,
        life: 2.9 + random() * 1.85,
        size: (0.9 + random() * 1.45) * (preset.drift > 1 ? 1.06 : 1),
        color,
        phase: random() * Math.PI * 2,
      });
    };

    const render = (time: number) => {
      if (document.hidden || (activityRef.current <= 0 && smoothedActivity < 0.01 && sparks.length === 0)) {
        lastTime = time;
        idleTimer = window.setTimeout(() => {
          idleTimer = null;
          frame = window.requestAnimationFrame(render);
        }, 180);
        return;
      }
      if (time - lastDrawTime < 30) {
        frame = window.requestAnimationFrame(render);
        return;
      }
      lastDrawTime = time;
      if (canvas.clientWidth !== width || canvas.clientHeight !== height) resize();
      const delta = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
      lastTime = time;
      const target = document.hidden ? 0 : activityRef.current;
      smoothedActivity += (target - smoothedActivity) * (1 - Math.exp(-delta / 0.7));
      context.clearRect(0, 0, width, height);

      spawnIn -= delta * smoothedActivity;
      if (spawnIn <= 0 && smoothedActivity > 0.24) {
        const batchSize = preset.maxSparks >= 10 ? 1 + (random() > 0.42 ? 1 : 0) : 1;
        for (let sparkIndex = 0; sparkIndex < batchSize; sparkIndex += 1) addSpark();
        const [min, max] = preset.spawnRange;
        spawnIn = min + random() * (max - min);
      }

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.age += delta;
        if (spark.age >= spark.life || smoothedActivity < 0.03) {
          sparks.splice(index, 1);
          continue;
        }
        spark.x += (spark.vx + Math.sin(spark.age * 2.4 + spark.phase) * 4.2) * delta;
        spark.y += spark.vy * delta;
        spark.vx *= Math.pow(0.985, delta * 60);
        const progress = spark.age / spark.life;
        const fadeIn = Math.min(1, spark.age / 0.12);
        const flicker = 0.78 + Math.sin(spark.age * 19 + spark.phase) * 0.22;
        const alpha = fadeIn * Math.pow(1 - progress, 1.7) * Math.min(1, smoothedActivity) * flicker;
        const [red, green, blue] = spark.color;

        context.beginPath();
        context.globalCompositeOperation = "lighter";
        context.moveTo(spark.x - spark.vx * 0.13, spark.y - spark.vy * 0.2);
        context.lineTo(spark.x, spark.y);
        context.lineWidth = Math.max(0.75, spark.size * 0.62);
        context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.56})`;
        context.stroke();
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.62})`;
        context.shadowBlur = 4 + spark.size * 2;
        context.shadowColor = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.42})`;
        context.fill();
        context.beginPath();
        context.arc(spark.x, spark.y, Math.max(0.55, spark.size * 0.42), 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 237, 198, ${alpha * 0.92})`;
        context.fill();
        context.shadowBlur = 0;
        context.globalCompositeOperation = "source-over";
      }
      canvas.dataset.ready = "true";
      canvas.dataset.sparkCount = String(sparks.length);
      frame = window.requestAnimationFrame(render);
    };

    resize();
    for (let initialSpark = 0; initialSpark < Math.ceil(preset.maxSparks * 0.45); initialSpark += 1) {
      const initialBand = ((initialSpark % 3) + 0.16) / 3;
      addSpark(initialBand);
      const spark = sparks[sparks.length - 1];
      spark.age = random() * spark.life * 0.4;
      spark.x += spark.vx * spark.age * 0.7;
      spark.y += spark.vy * spark.age * (initialBand < 0.32 ? 0.3 : 0.62);
    }
    frame = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(frame);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
    };
  }, [preset]);

  if (!preset) return null;
  return <canvas ref={canvasRef} className="kiln-embers" aria-hidden="true" />;
}

type ClayModelIntroProps = {
  phase: IntroPhase;
  onSettled?: () => void;
};

function ClayModelIntro({ phase, onSettled }: ClayModelIntroProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef(phase);
  const motionStartedAtRef = useRef(performance.now());
  if (phaseRef.current !== phase) {
    const previousPhase = phaseRef.current;
    phaseRef.current = phase;
    if (phase === "idle" || (previousPhase === "idle" && phase === "accelerating")) {
      motionStartedAtRef.current = performance.now();
    }
  }
  const [ready, setReady] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const host = canvasHostRef.current;
    const layer = layerRef.current;
    if (!host || !layer) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      layer.dataset.error = "true";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "kiln-intro-model-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, 1, 0.01, 12);
    const spinRoot = new THREE.Group();
    scene.add(spinRoot);
    scene.add(new THREE.HemisphereLight(0x9a775e, 0x120906, 1.55));

    const keyLight = new THREE.DirectionalLight(0xffd9b0, 2.35);
    keyLight.position.set(-1.2, 1.85, 2.3);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x8a4930, 0.72);
    fillLight.position.set(1.5, 0.45, 1.2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x6f3928, 0.52);
    rimLight.position.set(0, 1.2, -1.4);
    scene.add(rimLight);

    let model: THREE.Object3D | null = null;
    let disposed = false;

    const loader = new GLTFLoader();
    loader.load(
      INTRO_MODEL_URL,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        model.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.frustumCulled = false;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => {
            material.side = THREE.FrontSide;
            if (material instanceof THREE.MeshStandardMaterial) {
              material.metalness = 0;
              material.roughness = 0.88;
              material.normalScale.setScalar(1.3);
            }
            material.needsUpdate = true;
          });
        });
        spinRoot.add(model);
        // Compile the material program while the intro is still idle. This
        // keeps the first user-triggered frame from paying the shader compile
        // cost during the visible entrance transition.
        renderer.compile(scene, camera);
        layer.dataset.ready = "true";
        setReady(true);
        onSettled?.();
      },
      undefined,
      () => {
        if (!disposed) {
          layer.dataset.error = "true";
          onSettled?.();
        }
      },
    );

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = performance.now();
    let spinAngle = 0;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(host);
    resize();

    const ease = (value: number) => value * value * (3 - 2 * value);
    const render = (time: number) => {
      if (disposed) return;
      const delta = Math.min(48, time - lastTime) / 1000;
      lastTime = time;
      const activePhase = phaseRef.current;
      const motionActive = activePhase === "accelerating" || activePhase === "entering";
      const progress = motionActive
        ? Math.min(1, Math.max(0, (time - motionStartedAtRef.current) / INTRO_MOTION_DURATION))
        : 0;
      let speed = 0.32;
      let zoom = 0.52;
      let targetY = 0.24;
      let opacity = 1;
      let cavityOpacity = 0;
      let cavityScale = 0.18;
      let cavityClip = 8;
      let worldOpacity = 0;
      let worldScale = 1.085;

      if (motionActive) {
        const spinProgress = ease(Math.min(1, progress / 0.72));
        const worldProgress = ease(Math.min(1, Math.max(0, (progress - 0.65) / 0.35)));
        speed = THREE.MathUtils.lerp(0.32, 9.4, spinProgress);
        zoom = 0.52 * Math.pow(9.2 / 0.52, progress);
        targetY = THREE.MathUtils.lerp(0.24, 0.305, progress);
        worldOpacity = worldProgress;
        worldScale = THREE.MathUtils.lerp(1.085, 1, worldProgress);
      }

      if (activePhase === "entering") {
        const cavityProgress = Math.min(1, Math.max(0, (progress - 0.34) / 0.6));
        const cavityExpansion = cavityProgress * cavityProgress;
        const cavityFadeIn = ease(Math.min(1, Math.max(0, (progress - 0.38) / 0.36)));
        const modelFade = ease(Math.min(1, Math.max(0, (progress - 0.64) / 0.22)));
        opacity = 1 - modelFade;
        cavityOpacity = cavityFadeIn;
        cavityScale = THREE.MathUtils.lerp(0.18, 0.82, cavityProgress);
        cavityClip = THREE.MathUtils.lerp(8, 128, cavityExpansion);
      }

      spinAngle += speed * delta;
      if (model) model.rotation.y = spinAngle;
      const lightAngle = time * 0.00022 + 0.6;
      keyLight.position.set(Math.cos(lightAngle) * 2.3, 1.85, Math.sin(lightAngle) * 2.3);
      fillLight.position.set(-Math.sin(lightAngle) * 1.3, 0.45, Math.cos(lightAngle) * 1.3);
      camera.position.set(
        0,
        targetY + INTRO_CAMERA_HEIGHT / zoom,
        INTRO_CAMERA_DEPTH / zoom,
      );
      camera.lookAt(0, targetY, 0);
      layer.style.opacity = layer.dataset.ready === "true" ? `${opacity}` : "0";
      const intro = layer.closest<HTMLElement>(".kiln-intro");
      const app = layer.closest<HTMLElement>(".kiln-app");
      if (intro) intro.style.opacity = activePhase === "entering" ? `${1 - worldOpacity}` : "1";
      app?.style.setProperty("--intro-world-opacity", `${worldOpacity}`);
      app?.style.setProperty("--intro-world-scale", `${worldScale}`);
      intro?.style.setProperty("--intro-cavity-opacity", `${cavityOpacity}`);
      intro?.style.setProperty("--intro-cavity-scale", `${cavityScale}`);
      intro?.style.setProperty("--intro-cavity-clip", `${cavityClip}%`);
      intro?.style.setProperty("--intro-cavity-angle", `${spinAngle}rad`);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      model?.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          Object.values(material as unknown as Record<string, unknown>).forEach((value) => {
            if (value && typeof value === "object" && "isTexture" in value && value.isTexture) {
              (value as THREE.Texture).dispose();
            }
          });
          material.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={layerRef}
      className="kiln-intro-layer kiln-intro-model"
      data-ready={ready}
      data-intro-phase={phase}
      aria-hidden="true"
    >
      <div ref={canvasHostRef} className="kiln-intro-model-host" aria-hidden="true" />
    </div>
  );
}

type LivingFireProps = {
  src: string;
  motion: FireMotion;
};

function LivingFire({ src, motion }: LivingFireProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_turbulence;
      uniform float u_pulse;
      uniform float u_character;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise21(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.55;
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise21(p);
          p = p * 2.03 + vec2(17.1, 9.2);
          amplitude *= 0.48;
        }
        return value;
      }

      float luminance(vec3 color) {
        return dot(color, vec3(0.299, 0.587, 0.114));
      }

      void main() {
        float t = u_time * u_speed;
        float height = smoothstep(0.18, 0.92, v_uv.y);
        float tip = height * height;
        float characterWarp = u_character > 2.5 ? 1.32 : 1.0;

        vec2 risingUv = vec2(v_uv.x * 4.3, v_uv.y * 6.2 - t * 1.55);
        float broadFlow = fbm(risingUv);
        float fineFlow = fbm(vec2(v_uv.x * 9.4 + 11.0, v_uv.y * 12.0 - t * 2.8));
        float sideWave = sin(v_uv.y * 18.0 - t * 3.4 + broadFlow * 5.0);

        vec2 warpedUv = v_uv;
        warpedUv.x += (broadFlow - 0.48) * (0.020 + tip * 0.064) * u_turbulence * characterWarp;
        warpedUv.x += sideWave * tip * 0.010 * u_turbulence * characterWarp;
        warpedUv.y += (fineFlow - 0.5) * 0.012 * u_turbulence;

        float shear = (fineFlow - 0.5) * (0.006 + tip * 0.012) * u_turbulence;
        vec3 center = texture2D(u_texture, warpedUv).rgb;
        vec3 leftTongue = texture2D(u_texture, warpedUv + vec2(shear * characterWarp, -0.004)).rgb;
        vec3 rightTongue = texture2D(u_texture, warpedUv + vec2(-shear * 0.72 * characterWarp, 0.006)).rgb;
        vec3 color = max(center, max(leftTongue * 0.74, rightTongue * 0.62));

        float sourceLight = luminance(color);
        float emberPulse = noise21(vec2(floor(v_uv.y * 11.0), floor(t * 7.0)));
        float travelingPulse = fbm(vec2(v_uv.x * 7.0 + 23.0, v_uv.y * 8.0 - t * 2.2));
        float brightness = 0.86 + u_pulse * (travelingPulse * 0.34 + emberPulse * 0.13);
        brightness += smoothstep(0.13, 0.68, sourceLight) * (0.10 + fineFlow * 0.08);

        if (u_character < 1.5) {
          color *= vec3(1.02, 0.99, 0.93);
          float geLift = smoothstep(0.48, 0.78, fineFlow);
          brightness *= 0.94 + broadFlow * 0.06 + geLift * 0.03;
        } else if (u_character < 2.5) {
          float snap = smoothstep(0.58, 0.82, fineFlow);
          brightness *= 0.92 + snap * 0.22;
        } else {
          float kilnSnap = smoothstep(0.54, 0.80, fineFlow);
          color = mix(color, color * vec3(0.96, 1.01, 1.06), 0.14 + broadFlow * 0.10);
          brightness *= 0.94 + broadFlow * 0.10 + kilnSnap * 0.08;
        }

        color *= brightness;
        float livingEdge = smoothstep(0.018, 0.15, sourceLight);
        float edgeBreakup = smoothstep(0.20, 0.78, broadFlow + fineFlow * 0.32);
        float alpha = livingEdge * (0.88 + edgeBreakup * 0.12);
        alpha *= 1.0 - smoothstep(0.985, 1.0, max(abs(v_uv.x - 0.5), abs(v_uv.y - 0.5)) * 2.0);

        gl_FragColor = vec4(color, alpha);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create fire shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) ?? "Fire shader compilation failed";
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };

    const program = gl.createProgram();
    if (!program) return;
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Fire program linking failed");
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );

    const timeLocation = gl.getUniformLocation(program, "u_time");
    const speedLocation = gl.getUniformLocation(program, "u_speed");
    const turbulenceLocation = gl.getUniformLocation(program, "u_turbulence");
    const pulseLocation = gl.getUniformLocation(program, "u_pulse");
    const characterLocation = gl.getUniformLocation(program, "u_character");
    const preset = fireMotionPreset[motion];
    gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
    gl.uniform1f(speedLocation, preset.speed);
    gl.uniform1f(turbulenceLocation, preset.turbulence);
    gl.uniform1f(pulseLocation, preset.pulse);
    gl.uniform1f(characterLocation, preset.character);

    let disposed = false;
    let textureReady = false;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
      canvas.dataset.ready = "true";
      setReady(true);
    };
    image.src = src;

    let frame = 0;
    let width = 0;
    let height = 0;
    const startedAt = performance.now();
    const render = (time: number) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
      const nextWidth = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const nextHeight = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth;
        height = nextHeight;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (textureReady) {
        gl.uniform1f(timeLocation, (time - startedAt) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      image.onload = null;
      window.cancelAnimationFrame(frame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
    };
  }, [motion, src]);

  return (
    <span className="fire-render-stack" data-ready={ready} aria-hidden="true">
      <img className="fire-portal-layer fire-portal-fallback fire-portal-body" src={src} alt="" draggable={false} />
      <canvas ref={canvasRef} className="fire-portal-layer fire-portal-canvas fire-portal-body" />
    </span>
  );
}

type CizhouKnowledgeExperienceProps = {
  onBack: () => void;
};

function CizhouKnowledgeExperience({ onBack }: CizhouKnowledgeExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const audioFrameRef = useRef<number | null>(null);
  const sceneVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sceneVideoSecondaryRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sceneVideoCrossfadeCleanupRef = useRef<(() => void) | null>(null);
  const arrivalTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const sceneTweenRef = useRef<gsap.core.Tween | null>(null);
  const [arrivalPhase, setArrivalPhase] = useState<CizhouArrivalPhase>("transitioning");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<CizhouTraitHotspot | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const activeTrait = cizhouTraits[activeIndex];
  const ready = arrivalPhase === "ready";
  const loopedTraits = useMemo(
    () => [cizhouTraits[cizhouTraits.length - 1], ...cizhouTraits, cizhouTraits[0]],
    [],
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const cameraStage = root.querySelector<HTMLElement>(".cizhou-arrival-camera");
      const meipingStage = root.querySelector<HTMLElement>(".cizhou-meiping-stage");
      const meiping = root.querySelector<HTMLImageElement>(".cizhou-meiping-master");
      const shadow = root.querySelector<HTMLElement>(".cizhou-meiping-shadow");
      const light = root.querySelector<HTMLElement>(".cizhou-meiping-light");
      const tone = root.querySelector<HTMLElement>(".cizhou-meiping-tone");
      const firstSceneImage = root.querySelector<HTMLImageElement>('[data-scene-layer="kiln-yard"] .cizhou-scene-layer-image');
      const firstSceneAtmosphere = root.querySelector<HTMLElement>('[data-scene-layer="kiln-yard"] .cizhou-scene-layer-atmosphere');
      const foregroundHaze = root.querySelector<HTMLElement>(".cizhou-arrival-foreground-haze");
      const firstSceneShade = root.querySelector<HTMLElement>('[data-scene-layer="kiln-yard"] .cizhou-scene-layer-shade');
      if (!cameraStage || !meipingStage || !meiping || !shadow || !light || !tone || !firstSceneImage || !firstSceneAtmosphere || !foregroundHaze || !firstSceneShade) {
        setArrivalPhase("ready");
        return;
      }

      if (reducedMotion) {
        gsap.set([cameraStage, meipingStage, meiping, shadow, light, tone, firstSceneImage, firstSceneAtmosphere, foregroundHaze, firstSceneShade], { clearProps: "all" });
        gsap.set([firstSceneAtmosphere, foregroundHaze], { autoAlpha: 0 });
        gsap.set(meipingStage, { autoAlpha: 0 });
        setArrivalPhase("ready");
        return;
      }

      setArrivalPhase("transitioning");
      gsap.set(cameraStage, {
        // Keep a faint first-scene image under the handoff. A fully hidden
        // camera exposes the dark parent sphere for one frame at the exact
        // moment the Cizhou knowledge layer mounts, which reads as a black
        // flash on mobile.
        autoAlpha: 0.18,
        scale: 4.05,
        xPercent: -26.8,
        yPercent: 1.6,
        transformOrigin: "64% 56%",
      });
      gsap.set(firstSceneImage, { autoAlpha: 1 });
      gsap.set(meipingStage, { autoAlpha: 0 });
      gsap.set(meiping, { filter: "brightness(0.72) saturate(0.4) contrast(0.92)" });
      gsap.set([light, tone], { autoAlpha: 0 });
      gsap.set(shadow, { autoAlpha: 0, scaleX: 0.42, scaleY: 0.52 });
      gsap.set(firstSceneAtmosphere, { autoAlpha: 0 });
      gsap.set(foregroundHaze, { autoAlpha: 0.72, scale: 1.1 });
      gsap.set(firstSceneShade, { autoAlpha: 1 });

      const timeline = gsap.timeline({
        defaults: { ease: "power1.inOut" },
        onComplete: () => {
          gsap.set([cameraStage, meiping, shadow, light, tone], { clearProps: "all" });
          gsap.set([firstSceneAtmosphere, foregroundHaze], { autoAlpha: 0, clearProps: "filter,transform" });
          gsap.set(meipingStage, { autoAlpha: 0 });
          setArrivalPhase("ready");
        },
      });
      arrivalTimelineRef.current = timeline;

      timeline
        .addLabel("sceneReveal", 0)
        .to(cameraStage, { autoAlpha: 1, duration: 0.92, ease: "sine.out" }, "sceneReveal")
        .addLabel("directPullback", 0.72)
        .to(
          cameraStage,
          {
            scale: 1,
            xPercent: 0,
            yPercent: 0,
            duration: 5.8,
            ease: "power1.inOut",
          },
          "directPullback",
        )
        .to(meiping, { filter: "brightness(0.84) saturate(0.46) contrast(0.92)", duration: 2.0, ease: "sine.inOut" }, "directPullback+=3.2")
        .to([light, tone], { autoAlpha: 1, duration: 1.6, ease: "sine.inOut" }, "directPullback+=3.35")
        .to(shadow, { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 1.7, ease: "sine.inOut" }, "directPullback+=3.3");
      timeline.to(foregroundHaze, { autoAlpha: 0, scale: 1, duration: 2.4, ease: "sine.inOut" }, "directPullback+=2.8");

      return () => {
        timeline.kill();
        arrivalTimelineRef.current = null;
      };
    },
    { scope: rootRef },
  );

  useEffect(() => {
    sceneVideoRefs.current.forEach((video, index) => {
      if (!video) return;
      const trait = cizhouTraits[index];
      const secondary = sceneVideoSecondaryRefs.current[index];
      const isActive = index === activeIndex && ready && !reducedMotion;
      const usesVideoAudio = trait.audioSource === "video";
      const videoAudioEnabled = usesVideoAudio && audioEnabled && isActive;
      video.muted = !videoAudioEnabled;
      video.volume = videoAudioEnabled ? 0.42 : 0;

      if (isActive) {
        if (trait.videoLoop === "trim" && trait.videoStart !== undefined) {
          video.currentTime = trait.videoStart;
        }
        if (secondary) {
          secondary.pause();
          secondary.currentTime = trait.videoStart ?? 0;
          secondary.style.opacity = "0";
          secondary.muted = true;
          secondary.volume = 0;
        }
        void video.play().catch(() => undefined);
      } else {
        video.pause();
        video.currentTime = trait.videoStart ?? 0;
        if (secondary) {
          secondary.pause();
          secondary.currentTime = trait.videoStart ?? 0;
          secondary.style.opacity = "0";
          secondary.muted = true;
          secondary.volume = 0;
        }
      }
    });
  }, [activeIndex, audioEnabled, ready, reducedMotion]);

  useEffect(() => {
    sceneVideoCrossfadeCleanupRef.current?.();
    sceneVideoCrossfadeCleanupRef.current = null;

    const trait = cizhouTraits[activeIndex];
    const primary = sceneVideoRefs.current[activeIndex];
    const secondary = sceneVideoSecondaryRefs.current[activeIndex];
    const shouldCrossfade = trait.id === "tavern" && trait.videoLoop === "trim" && primary && secondary && ready && !reducedMotion;
    if (!shouldCrossfade) return;

    const loopStart = trait.videoStart ?? 0;
    const loopEnd = trait.videoEnd ?? primary.duration;
    const loopDuration = Math.max(0.1, loopEnd - loopStart);
    const fadeDuration = Math.min(1.12, Math.max(0.86, loopDuration * 0.2));
    let outgoing = primary;
    let incoming = secondary;
    let fading = false;
    let fadeFrom = loopEnd - fadeDuration;
    let frame = 0;

    primary.style.opacity = "1";
    secondary.style.opacity = "0";
    secondary.muted = true;
    secondary.volume = 0;

    const tick = () => {
      if (!fading && outgoing.currentTime >= loopEnd - fadeDuration) {
        fading = true;
        fadeFrom = outgoing.currentTime;
        incoming.currentTime = loopStart;
        incoming.muted = !audioEnabled;
        incoming.volume = audioEnabled ? 0.42 : 0;
        incoming.style.opacity = "0";
        void incoming.play().catch(() => undefined);
      }

      if (fading) {
        const progress = clamp((outgoing.currentTime - fadeFrom) / fadeDuration, 0, 1);
        outgoing.style.opacity = String(1 - progress);
        incoming.style.opacity = String(progress);

        if (progress >= 0.999) {
          outgoing.pause();
          outgoing.currentTime = loopStart;
          outgoing.style.opacity = "0";
          outgoing.muted = true;
          outgoing.volume = 0;
          incoming.style.opacity = "1";
          const previousOutgoing = outgoing;
          outgoing = incoming;
          incoming = previousOutgoing;
          fading = false;
        }
      }

      if (!fading && Number.isFinite(outgoing.duration) && outgoing.currentTime >= loopEnd - 0.04) {
        outgoing.currentTime = loopStart;
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    const cleanup = () => {
      window.cancelAnimationFrame(frame);
      primary.style.opacity = "1";
      secondary.style.opacity = "0";
    };
    sceneVideoCrossfadeCleanupRef.current = cleanup;
    return cleanup;
  }, [activeIndex, audioEnabled, ready, reducedMotion]);

  useEffect(
    () => () => {
      sceneVideoRefs.current.forEach((video) => video?.pause());
    },
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    const viewport = rootRef.current?.querySelector<HTMLDivElement>(".cizhou-trait-carousel");
    const cards = viewport
      ? Array.from(viewport.querySelectorAll<HTMLElement>(".cizhou-trait-card"))
      : [];
    const sceneLayers = Array.from(root?.querySelectorAll<HTMLElement>(".cizhou-scene-layer") ?? []);
    const sceneSlices = Array.from(root?.querySelectorAll<HTMLElement>("[data-scene-slice]") ?? []);
    if (!root || !viewport || cards.length === 0 || sceneLayers.length === 0) return;

    let frame = 0;
    let settleTimer = 0;
    let snapping = false;
    let moving = false;
    let wrapping = false;
    const sceneCount = cizhouTraits.length;
    let sceneOriginPhysical = activeIndex + 1;

    const logicalFromPhysical = (physicalIndex: number) => wrapIndex(physicalIndex - 1, sceneCount);
    const cyclicDistance = (logicalPosition: number, index: number) =>
      Math.min(
        Math.abs(logicalPosition - index),
        Math.abs(logicalPosition - index + sceneCount),
        Math.abs(logicalPosition - index - sceneCount),
      );

    const updateMotionState = (isMoving: boolean) => {
      moving = isMoving;
      root.dataset.sceneMoving = isMoving ? "true" : "false";
    };

    const updateScenePresentation = () => {
      const width = Math.max(1, viewport.clientWidth);
      const physicalPosition = viewport.scrollLeft / width;
      const logicalPosition = physicalPosition - 1;
      cards.forEach((card, cardIndex) => {
        const distance = cardIndex - physicalPosition;
        const magnitude = Math.min(Math.abs(distance), 1);
        card.style.setProperty("--scene-copy-x", `${distance * 10}px`);
        card.style.setProperty("--scene-copy-opacity", `${Math.max(0, 1 - magnitude * 2.4)}`);
        card.style.setProperty("--scene-content-opacity", `${Math.max(0, 1 - magnitude * 2.1)}`);
      });
      sceneLayers.forEach((layer, index) => {
        const distance = cyclicDistance(logicalPosition, index);
        const visibility = clamp(1 - distance, 0, 1);
        layer.style.setProperty("--scene-layer-opacity", `${visibility}`);
        layer.dataset.running = !moving && visibility > 0.98 ? "true" : "false";
      });
      sceneSlices.forEach((slice) => {
        const index = Number(slice.dataset.sceneSlice ?? 0);
        const visibility = clamp(1 - cyclicDistance(logicalPosition, index), 0, 1);
        slice.style.setProperty("--scene-weight", `${visibility}`);
        slice.dataset.running = !moving && visibility > 0.98 ? "true" : "false";
      });
      const nearestPhysical = clamp(Math.round(physicalPosition), 0, cards.length - 1);
      root.dataset.scene = cizhouTraits[logicalFromPhysical(nearestPhysical)].id;
    };

    const requestScenePresentation = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScenePresentation);
    };

    const finishSceneChange = (physicalIndex: number) => {
      const nextIndex = logicalFromPhysical(physicalIndex);
      const canonicalPhysical = nextIndex + 1;
      wrapping = physicalIndex !== canonicalPhysical;
      if (wrapping) viewport.scrollLeft = canonicalPhysical * Math.max(1, viewport.clientWidth);
      sceneOriginPhysical = canonicalPhysical;
      updateMotionState(false);
      root.dataset.scene = cizhouTraits[nextIndex].id;
      setActiveIndex(nextIndex);
      setActiveHotspot(null);
      updateScenePresentation();
      snapping = false;
      if (wrapping) {
        window.requestAnimationFrame(() => {
          wrapping = false;
        });
      }
    };

    const settleToNearestScene = () => {
      if (!ready) return;
      const width = Math.max(1, viewport.clientWidth);
      const nextIndex = clamp(Math.round(viewport.scrollLeft / width), 0, cards.length - 1);
      const targetLeft = nextIndex * width;
      const travel = Math.abs(targetLeft - viewport.scrollLeft) / width;

      if (reducedMotion || travel < 0.002) {
        viewport.scrollLeft = targetLeft;
        finishSceneChange(nextIndex);
        return;
      }

      snapping = true;
      sceneTweenRef.current?.kill();
      sceneTweenRef.current = gsap.to(viewport, {
        scrollLeft: targetLeft,
        duration: 0.46 + Math.min(travel, 0.5) * 0.38,
        ease: "power1.out",
        overwrite: true,
        onUpdate: updateScenePresentation,
        onComplete: () => {
          sceneTweenRef.current = null;
          finishSceneChange(nextIndex);
        },
      });
    };

    const handleScroll = () => {
      if (wrapping) {
        requestScenePresentation();
        return;
      }
      if (!snapping) {
        const width = Math.max(1, viewport.clientWidth);
        const previousScene = Math.max(0, sceneOriginPhysical - 1) * width;
        const nextScene = Math.min(cards.length - 1, sceneOriginPhysical + 1) * width;
        const constrainedLeft = clamp(viewport.scrollLeft, previousScene, nextScene);
        if (Math.abs(viewport.scrollLeft - constrainedLeft) > 0.5) viewport.scrollLeft = constrainedLeft;
      }
      requestScenePresentation();
      if (snapping) return;
      if (!moving) {
        updateMotionState(true);
        setActiveHotspot(null);
      }
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settleToNearestScene, 34);
    };

    const handlePointerDown = () => {
      const width = Math.max(1, viewport.clientWidth);
      sceneOriginPhysical = clamp(Math.round(viewport.scrollLeft / width), 0, cards.length - 1);
    };

    updateMotionState(false);
    viewport.scrollLeft = sceneOriginPhysical * Math.max(1, viewport.clientWidth);
    updateScenePresentation();
    viewport.addEventListener("pointerdown", handlePointerDown, { passive: true });
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("scroll", handleScroll);
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(frame);
      sceneTweenRef.current?.kill();
      sceneTweenRef.current = null;
    };
  }, [ready, reducedMotion]);

  useEffect(() => {
    if (audioFrameRef.current !== null) window.cancelAnimationFrame(audioFrameRef.current);

    const elements = audioRefs.current;
    const starts = elements.map((audio) => audio?.volume ?? 0);
    const targets = elements.map((_, index) => (audioEnabled && ready && index === activeIndex ? 0.17 : 0));
    const activeAudio = elements[activeIndex];
    if (audioEnabled && ready && activeAudio && document.visibilityState === "visible") {
      void activeAudio.play().catch(() => undefined);
    }

    const startedAt = performance.now();
    const duration = reducedMotion ? 1 : 820;
    const fade = (time: number) => {
      const progress = clamp((time - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      elements.forEach((audio, index) => {
        if (!audio) return;
        audio.volume = starts[index] + (targets[index] - starts[index]) * eased;
      });
      if (progress < 1) {
        audioFrameRef.current = window.requestAnimationFrame(fade);
        return;
      }
      elements.forEach((audio, index) => {
        if (audio && targets[index] === 0) audio.pause();
      });
      audioFrameRef.current = null;
    };

    audioFrameRef.current = window.requestAnimationFrame(fade);
    return () => {
      if (audioFrameRef.current !== null) window.cancelAnimationFrame(audioFrameRef.current);
    };
  }, [activeIndex, audioEnabled, ready, reducedMotion]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        audioRefs.current.forEach((audio) => audio?.pause());
        sceneVideoRefs.current.forEach((video) => video?.pause());
        sceneVideoSecondaryRefs.current.forEach((video) => video?.pause());
      } else if (audioEnabled && ready) {
        void audioRefs.current[activeIndex]?.play().catch(() => undefined);
        if (!reducedMotion) void sceneVideoRefs.current[activeIndex]?.play().catch(() => undefined);
      } else if (ready && !reducedMotion) {
        void sceneVideoRefs.current[activeIndex]?.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeIndex, audioEnabled, ready, reducedMotion]);

  useEffect(
    () => () => {
      if (audioFrameRef.current !== null) window.cancelAnimationFrame(audioFrameRef.current);
      audioRefs.current.forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
      });
    },
    [],
  );

  return (
    <section
      ref={rootRef}
      className="cizhou-knowledge"
      data-phase="knowledge"
      data-arrival-phase={arrivalPhase}
      data-transitioning={!ready}
      data-detail-open={Boolean(activeHotspot)}
      data-scene={activeTrait.id}
      aria-label="识窑 · 磁州三章"
    >
      <div className="cizhou-arrival-camera">
        <div className="cizhou-scene-stack" aria-hidden="true">
          {cizhouTraits.map((trait, traitIndex) => (
            <div
              key={`scene-${trait.id}`}
              className="cizhou-scene-layer"
              data-scene-layer={trait.id}
              style={{ "--scene-layer-index": traitIndex } as CSSProperties}
            >
              <img
                className="cizhou-scene-layer-image"
                src={trait.image}
                alt=""
                draggable={false}
                loading={traitIndex === activeIndex ? "eager" : "lazy"}
                decoding="async"
              />
              {trait.video ? (
                <video
                  className="cizhou-scene-layer-video"
                  src={trait.video}
                  poster={trait.image}
                  muted={trait.audioSource !== "video" || !audioEnabled || activeIndex !== traitIndex || !ready || reducedMotion}
                  autoPlay={false}
                  playsInline
                  preload={activeIndex === traitIndex ? "auto" : "none"}
                  aria-hidden="true"
                  ref={(node) => {
                    sceneVideoRefs.current[traitIndex] = node;
                  }}
                  onTimeUpdate={(event) => {
                    const video = event.currentTarget;
                    if (trait.id === "tavern") return;
                    if (trait.videoLoop !== "trim" || !Number.isFinite(video.duration) || video.duration <= 0) return;
                    const loopStart = trait.videoStart ?? 0;
                    const loopEnd = Math.min(trait.videoEnd ?? video.duration, video.duration);
                    if (loopEnd > loopStart && video.currentTime >= loopEnd - 0.08) video.currentTime = loopStart;
                  }}
                  onEnded={(event) => {
                    const video = event.currentTarget;
                    if (trait.id === "tavern") return;
                    if (trait.videoLoop === "none") return;
                    video.currentTime = trait.videoStart ?? 0;
                    void video.play().catch(() => undefined);
                  }}
                />
              ) : null}
              {trait.id === "tavern" && trait.video ? (
                <video
                  className="cizhou-scene-layer-video cizhou-scene-layer-video-secondary"
                  src={trait.video}
                  poster={trait.image}
                  muted
                  playsInline
                  preload={activeIndex === traitIndex ? "auto" : "none"}
                  aria-hidden="true"
                  ref={(node) => {
                    sceneVideoSecondaryRefs.current[traitIndex] = node;
                  }}
                />
              ) : null}
              <div className="cizhou-scene-layer-atmosphere" />
              <div className="cizhou-scene-layer-shade" />
            </div>
          ))}
          <div className="cizhou-transition-veil" />
        </div>

        <div className="cizhou-context-behind" aria-hidden="true">
          {cizhouTraits.map((trait, traitIndex) => (
            <div
              key={`context-back-${trait.id}`}
              className="cizhou-context-slice cizhou-context-slice-back"
              data-scene-slice={traitIndex}
              data-motion={trait.motion}
            >
              {trait.prop ? <img className="cizhou-context-prop cizhou-context-prop-back" src={trait.prop} alt="" draggable={false} /> : null}
            </div>
          ))}
        </div>

        <div className="cizhou-meiping-stage" aria-hidden="true">
          <div className="cizhou-meiping-shadow" />
          <img
            className="cizhou-meiping-master"
            src="/assets/kilns/cizhou-one-shot/cizhou-meiping-master-v1.webp"
            alt=""
            draggable={false}
          />
          <div className="cizhou-meiping-tone" />
          <div className="cizhou-meiping-light" />
        </div>

        <div className="cizhou-context-front" aria-hidden="true">
          {cizhouTraits.map((trait, traitIndex) => (
            <div
              key={`context-front-${trait.id}`}
              className="cizhou-context-slice cizhou-context-slice-front"
              data-scene-slice={traitIndex}
              data-motion={trait.motion}
            >
              {trait.prop ? <img className="cizhou-context-prop cizhou-context-prop-front" src={trait.prop} alt="" draggable={false} /> : null}
              {trait.occlusion === "cart" ? (
                <img className="cizhou-scene-occlusion cizhou-scene-occlusion-cart" src={trait.image} alt="" draggable={false} />
              ) : null}
              {trait.motion === "dust" ? (
                <>
                  <img className="cizhou-atmosphere-raster cizhou-atmosphere-raster-a" src={trait.atmosphere} alt="" draggable={false} />
                  <img className="cizhou-atmosphere-raster cizhou-atmosphere-raster-b" src={trait.atmosphere} alt="" draggable={false} />
                </>
              ) : null}
              {trait.motion !== "none" ? <div className="cizhou-visible-motion" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>

        <div className="cizhou-arrival-foreground-haze" aria-hidden="true" />
      </div>

      <Carousel
        className="cizhou-trait-carousel"
        contentClassName="cizhou-trait-track"
        ariaLabel="磁州窑三项窑口特性"
        draggingEnabled={ready && !activeHotspot}
      >
        {loopedTraits.map((trait, physicalIndex) => {
          const traitIndex = wrapIndex(physicalIndex - 1, cizhouTraits.length);
          const duplicate = physicalIndex === 0 || physicalIndex === loopedTraits.length - 1;
          const hidden = duplicate || activeIndex !== traitIndex;
          return (
          <article
            key={`${physicalIndex}-${trait.id}`}
            className="cizhou-trait-card"
            data-trait-index={traitIndex}
            data-scene-active={!duplicate && activeIndex === traitIndex}
            aria-hidden={hidden}
            inert={hidden}
          >
            <header className="cizhou-trait-copy">
              <span>{trait.number} / {String(cizhouTraits.length).padStart(2, "0")}</span>
              <h2>{trait.title}</h2>
              <p>{trait.tagline}</p>
              <div className="cizhou-trait-vessel">
                <strong>{trait.vessel}</strong>
                <small>{trait.period}</small>
              </div>
            </header>

            <div className="cizhou-trait-hotspots" aria-label={`${trait.title}知识观察点`}>
              {trait.hotspots.map((hotspot, hotspotIndex) => (
                <button
                  key={hotspot.id}
                  type="button"
                  className="cizhou-trait-hotspot"
                  style={{ "--hotspot-x": `${hotspot.x}%`, "--hotspot-y": `${hotspot.y}%` } as CSSProperties}
                  aria-label={`${hotspot.label}：${hotspot.title}`}
                  onClick={() => setActiveHotspot(hotspot)}
                >
                  <i aria-hidden="true">{hotspotIndex + 1}</i>
                  <span>{hotspot.label}</span>
                </button>
              ))}
            </div>

          </article>
          );
        })}
      </Carousel>

      <div className="cizhou-scene-hotspots" aria-label={`${activeTrait.title}知识观察点`}>
        {activeTrait.hotspots.map((hotspot, hotspotIndex) => (
          <button
            key={`${activeTrait.id}-${hotspot.id}`}
            type="button"
            className="cizhou-trait-hotspot"
            style={{ "--hotspot-x": `${hotspot.x}%`, "--hotspot-y": `${hotspot.y}%` } as CSSProperties}
            aria-label={`${hotspot.label}：${hotspot.title}`}
            disabled={!ready}
            onClick={() => setActiveHotspot(hotspot)}
          >
            <i aria-hidden="true">{hotspotIndex + 1}</i>
            <span>{hotspot.label}</span>
          </button>
        ))}
      </div>

      <button type="button" className="cizhou-knowledge-back" onClick={onBack} aria-label="返回窑中">
        <ArrowLeftIcon aria-hidden="true" />
      </button>

      <button
        type="button"
        className="cizhou-audio-toggle"
        data-enabled={audioEnabled}
        disabled={!ready}
        onClick={() => setAudioEnabled((enabled) => !enabled)}
        aria-label={audioEnabled ? `关闭${activeTrait.title}声境` : `开启${activeTrait.title}声境`}
      >
        {audioEnabled ? <SpeakerLoudIcon aria-hidden="true" /> : <SpeakerOffIcon aria-hidden="true" />}
      </button>

      {cizhouTraits.map((trait, index) =>
        trait.audio ? (
          <audio
            key={trait.id}
            ref={(node) => {
              audioRefs.current[index] = node;
            }}
            src={trait.audio}
            loop
            preload="metadata"
          />
        ) : null,
      )}

      {activeHotspot ? (
        <aside className="cizhou-trait-detail" role="dialog" aria-modal="false" aria-labelledby="cizhou-detail-title">
          <button
            type="button"
            className="cizhou-trait-detail-close"
            onClick={() => setActiveHotspot(null)}
            aria-label="关闭知识详情"
          >
            <Cross2Icon aria-hidden="true" />
          </button>
          <span className="cizhou-trait-detail-kicker">{activeTrait.title} · 观察点</span>
          <h3 id="cizhou-detail-title">{activeHotspot.title}</h3>
          <p>{activeHotspot.body}</p>
          <dl>
            <div>
              <dt>器物依据</dt>
              <dd>{activeTrait.fact}</dd>
            </div>
            <div>
              <dt>场景说明</dt>
              <dd>{activeTrait.reconstruction}</dd>
            </div>
          </dl>
          <a className="cizhou-trait-source" href={activeTrait.sourceUrl} target="_blank" rel="noreferrer">
            资料来源 · {activeTrait.sourceLabel}
          </a>
        </aside>
      ) : null}
    </section>
  );
}

type KilnStoryExperienceProps = {
  story: KilnStoryDefinition;
  onBack: () => void;
};

function KilnStoryExperience({ story, onBack }: KilnStoryExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const dingSparkFieldRef = useRef<HTMLDivElement>(null);
  const sceneTweenRef = useRef<gsap.core.Tween | null>(null);
  const sceneVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sceneVideoSecondaryRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sceneVideoCrossfadeCleanupRef = useRef<(() => void) | null>(null);
  const sceneAudioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const sceneAudioFrameRef = useRef<number | null>(null);
  const [arrivalPhase, setArrivalPhase] = useState<CizhouArrivalPhase>("transitioning");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<CizhouTraitHotspot | null>(null);
  const [sceneAudioEnabled, setSceneAudioEnabled] = useState(false);
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const activeScene = story.scenes[activeIndex];
  const ready = arrivalPhase === "ready";
  const hasSceneVideo = story.scenes.some((scene) => Boolean(scene.video));
  const loopedScenes = useMemo(
    () => [story.scenes[story.scenes.length - 1], ...story.scenes, story.scenes[0]],
    [story],
  );

  const handleSceneVideoEnded = (sceneIndex: number, video: HTMLVideoElement) => {
    const scene = story.scenes[sceneIndex];
    if (!scene.video || scene.videoLoop === "none") return;
    if (scene.videoLoop === "crossfade" || scene.videoLoop === "native") {
      // Native loops are owned by the media element. The crossfade path, when
      // used by a different story, owns its own handoff.
      return;
    }
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  };

  const handleSceneVideoTimeUpdate = (sceneIndex: number, video: HTMLVideoElement) => {
    const scene = story.scenes[sceneIndex];
    if (scene.videoLoop !== "trim" || !Number.isFinite(video.duration) || video.duration <= 0) return;
    // The edited loop contains a final copy of the starting frame. Jump just
    // before it so the last moving frame connects directly to the next cycle.
    if (video.currentTime >= video.duration - 0.085) {
      video.currentTime = 0;
    }
  };

  useGSAP(
    () => {
      const root = rootRef.current;
      const camera = root?.querySelector<HTMLElement>(".kiln-story-camera");
      if (!root || !camera) {
        setArrivalPhase("ready");
        return;
      }

      if (reducedMotion) {
        gsap.set(camera, { clearProps: "all" });
        setArrivalPhase("ready");
        return;
      }

      setArrivalPhase("transitioning");
      gsap.set(camera, {
        autoAlpha: 0,
        scale: story.id === "ru" ? 2.58 : 2.4,
        xPercent: story.id === "ru" ? -16 : -13,
        yPercent: -12,
        transformOrigin: story.id === "ru" ? "70% 76%" : "66% 75%",
      });

      const timeline = gsap.timeline({
        onComplete: () => {
          gsap.set(camera, { clearProps: "all" });
          setArrivalPhase("ready");
        },
      });
      timeline
        .to(camera, { autoAlpha: 1, duration: 0.8, ease: "sine.out" }, 0)
        .to(
          camera,
          {
            scale: 1,
            xPercent: 0,
            yPercent: 0,
            duration: 4.8,
            ease: "power1.inOut",
          },
          0.42,
        );

      return () => timeline.kill();
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      const field = dingSparkFieldRef.current;
      if (story.id !== "ding" || activeIndex !== 0 || !ready || reducedMotion || !field) return;

      const sparks = Array.from(field.querySelectorAll<HTMLElement>(".kiln-story-ding-spark"));
      sparks.forEach((spark, sparkIndex) => {
        const spec = dingKilnSparks[sparkIndex];
        if (!spec) return;

        gsap.fromTo(
          spark,
          { autoAlpha: 0, x: 0, y: 0, scale: 0.72 },
          {
            autoAlpha: spec.alpha,
            scale: 1,
            duration: 0.5,
            ease: "sine.inOut",
            delay: spec.delay,
            repeat: -1,
            repeatDelay: 0.8 + (sparkIndex % 4) * 0.35,
            yoyo: false,
            keyframes: [
              { x: spec.drift * 0.28, y: -spec.rise * 0.36, duration: spec.duration * 0.38, ease: "sine.inOut" },
              { x: spec.drift, y: -spec.rise, duration: spec.duration * 0.4, ease: "sine.inOut", autoAlpha: spec.alpha * 0.78 },
              { x: spec.drift * 1.12, y: -spec.rise * 1.06, duration: spec.duration * 0.22, ease: "sine.inOut", autoAlpha: 0 },
            ],
          },
        );
      });
    },
    { scope: rootRef, dependencies: [activeIndex, ready, reducedMotion, story.id] },
  );

  useEffect(() => {
    const root = rootRef.current;
    const viewport = root?.querySelector<HTMLDivElement>(".kiln-story-carousel");
    const cards = viewport
      ? Array.from(viewport.querySelectorAll<HTMLElement>(".kiln-story-card"))
      : [];
    const sceneLayers = Array.from(root?.querySelectorAll<HTMLElement>(".kiln-story-scene") ?? []);
    if (!root || !viewport || cards.length === 0 || sceneLayers.length === 0) return;

    let frame = 0;
    let settleTimer = 0;
    let snapping = false;
    let moving = false;
    let wrapping = false;
    const sceneCount = story.scenes.length;
    let sceneOriginPhysical = activeIndex + 1;

    const logicalFromPhysical = (physicalIndex: number) => wrapIndex(physicalIndex - 1, sceneCount);
    const cyclicDistance = (logicalPosition: number, index: number) =>
      Math.min(
        Math.abs(logicalPosition - index),
        Math.abs(logicalPosition - index + sceneCount),
        Math.abs(logicalPosition - index - sceneCount),
      );

    const updateMotionState = (isMoving: boolean) => {
      moving = isMoving;
      root.dataset.sceneMoving = isMoving ? "true" : "false";
    };

    const updateScenePresentation = () => {
      const width = Math.max(1, viewport.clientWidth);
      const physicalPosition = viewport.scrollLeft / width;
      const logicalPosition = physicalPosition - 1;
      cards.forEach((card, cardIndex) => {
        const distance = cardIndex - physicalPosition;
        const magnitude = Math.min(Math.abs(distance), 1);
        card.style.setProperty("--story-copy-x", `${distance * 10}px`);
        card.style.setProperty("--story-copy-opacity", `${Math.max(0, 1 - magnitude * 2.4)}`);
      });
      sceneLayers.forEach((layer, index) => {
        const visibility = clamp(1 - cyclicDistance(logicalPosition, index), 0, 1);
        layer.style.setProperty("--story-scene-opacity", `${visibility}`);
        layer.dataset.running = !moving && !snapping && ready && visibility > 0.98 ? "true" : "false";
      });
      const nearestPhysical = clamp(Math.round(physicalPosition), 0, cards.length - 1);
      root.dataset.scene = story.scenes[logicalFromPhysical(nearestPhysical)].id;
    };

    const requestScenePresentation = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScenePresentation);
    };

    const finishSceneChange = (physicalIndex: number) => {
      const nextIndex = logicalFromPhysical(physicalIndex);
      const canonicalPhysical = nextIndex + 1;
      wrapping = physicalIndex !== canonicalPhysical;
      if (wrapping) viewport.scrollLeft = canonicalPhysical * Math.max(1, viewport.clientWidth);
      sceneOriginPhysical = canonicalPhysical;
      updateMotionState(false);
      root.dataset.scene = story.scenes[nextIndex].id;
      setActiveIndex(nextIndex);
      setActiveHotspot(null);
      updateScenePresentation();
      snapping = false;
      if (wrapping) {
        window.requestAnimationFrame(() => {
          wrapping = false;
        });
      }
    };

    const settleToNearestScene = () => {
      if (!ready) return;
      const width = Math.max(1, viewport.clientWidth);
      const nextIndex = clamp(Math.round(viewport.scrollLeft / width), 0, cards.length - 1);
      const targetLeft = nextIndex * width;
      const travel = Math.abs(targetLeft - viewport.scrollLeft) / width;

      if (reducedMotion || travel < 0.002) {
        viewport.scrollLeft = targetLeft;
        finishSceneChange(nextIndex);
        return;
      }

      snapping = true;
      sceneTweenRef.current?.kill();
      sceneTweenRef.current = gsap.to(viewport, {
        scrollLeft: targetLeft,
        duration: 0.46 + Math.min(travel, 0.5) * 0.38,
        ease: "power1.out",
        overwrite: true,
        onUpdate: updateScenePresentation,
        onComplete: () => {
          sceneTweenRef.current = null;
          finishSceneChange(nextIndex);
        },
      });
    };

    const handleScroll = () => {
      if (wrapping) {
        requestScenePresentation();
        return;
      }
      if (!snapping) {
        const width = Math.max(1, viewport.clientWidth);
        const previousScene = Math.max(0, sceneOriginPhysical - 1) * width;
        const nextScene = Math.min(cards.length - 1, sceneOriginPhysical + 1) * width;
        const constrainedLeft = clamp(viewport.scrollLeft, previousScene, nextScene);
        if (Math.abs(viewport.scrollLeft - constrainedLeft) > 0.5) viewport.scrollLeft = constrainedLeft;
      }
      requestScenePresentation();
      if (snapping) return;
      if (!moving) {
        updateMotionState(true);
        setActiveHotspot(null);
      }
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settleToNearestScene, 34);
    };

    const handlePointerDown = () => {
      const width = Math.max(1, viewport.clientWidth);
      sceneOriginPhysical = clamp(Math.round(viewport.scrollLeft / width), 0, cards.length - 1);
    };

    updateMotionState(false);
    viewport.scrollLeft = sceneOriginPhysical * Math.max(1, viewport.clientWidth);
    updateScenePresentation();
    viewport.addEventListener("pointerdown", handlePointerDown, { passive: true });
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("scroll", handleScroll);
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(frame);
      sceneTweenRef.current?.kill();
      sceneTweenRef.current = null;
    };
  }, [ready, reducedMotion, story]);

  useEffect(() => {
    sceneVideoCrossfadeCleanupRef.current?.();
    sceneVideoCrossfadeCleanupRef.current = null;

    sceneVideoRefs.current.forEach((video, index) => {
      if (!video) return;
      const scene = story.scenes[index];
      const secondary = sceneVideoSecondaryRefs.current[index];
      const isActive = index === activeIndex && ready && !reducedMotion;
      const hasDedicatedAudio = Boolean(scene.audio);
      // A dedicated ambience track takes precedence over any generated video audio.
      const videoAudioEnabled = !hasDedicatedAudio && sceneAudioEnabled && !reducedMotion;
      video.muted = !videoAudioEnabled;
      video.volume = videoAudioEnabled ? 0.24 : 0;

      if (scene.videoLoop === "crossfade" && secondary) {
        video.style.opacity = "1";
        secondary.style.opacity = "0";
        secondary.pause();
        secondary.currentTime = 0;
        secondary.muted = true;
        secondary.volume = 0;
        if (isActive) {
          video.currentTime = 0;
          void video.play().catch(() => undefined);
        } else {
          video.pause();
          video.currentTime = 0;
        }
        return;
      }

      if (isActive) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [activeIndex, ready, reducedMotion, sceneAudioEnabled, story]);

  useEffect(() => {
    sceneVideoCrossfadeCleanupRef.current?.();
    sceneVideoCrossfadeCleanupRef.current = null;

    const scene = story.scenes[activeIndex];
    const primary = sceneVideoRefs.current[activeIndex];
    const secondary = sceneVideoSecondaryRefs.current[activeIndex];
    const shouldCrossfade = scene?.videoLoop === "crossfade" && primary && secondary && ready && !reducedMotion;
    if (!shouldCrossfade) return;

    const hasDedicatedAudio = Boolean(scene.audio);
    const videoAudioEnabled = !hasDedicatedAudio && sceneAudioEnabled;
    // Each handoff starts a second copy at time 0 and lets it continue forward.
    // No frames are reversed, so smoke and light never visibly flow backwards.
    const fadeDuration = 0.78;
    const prewarmDuration = 0.16;
    let outgoing = primary;
    let incoming = secondary;
    let loopEnd = 0;
    let incomingPrepared = false;
    let fading = false;
    let fadeStartedAt = 0;
    let frame = 0;

    primary.style.opacity = "1";
    secondary.style.opacity = "0";
    secondary.muted = true;
    secondary.volume = 0;

    const prepareIncoming = () => {
      if (incomingPrepared) return;
      incomingPrepared = true;
      incoming.currentTime = 0;
      incoming.muted = true;
      incoming.volume = 0;
      incoming.style.opacity = "0";
      // Give the hidden copy several decoded frames before it becomes visible.
      // This avoids the black/poster paint that can occur when a video is first
      // started exactly at the crossfade boundary.
      void incoming.play().catch(() => undefined);
    };

    const tick = () => {
      if (loopEnd <= 0) {
        const duration = outgoing.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          frame = window.requestAnimationFrame(tick);
          return;
        }
        loopEnd = duration;
      }

      const fadeStart = Math.max(0, loopEnd - fadeDuration);
      const prewarmStart = Math.max(0, fadeStart - prewarmDuration);
      if (!incomingPrepared && outgoing.currentTime >= prewarmStart) {
        prepareIncoming();
      }

      if (!fading && outgoing.currentTime >= fadeStart) {
        prepareIncoming();
        fading = true;
        fadeStartedAt = performance.now();
        incoming.muted = !videoAudioEnabled;
      }

      if (fading) {
        const progress = clamp((performance.now() - fadeStartedAt) / (fadeDuration * 1000), 0, 1);
        outgoing.style.opacity = String(1 - progress);
        incoming.style.opacity = String(progress);
        outgoing.volume = videoAudioEnabled ? 0.24 * (1 - progress) : 0;
        incoming.volume = videoAudioEnabled ? 0.24 * progress : 0;

        if (progress >= 0.999) {
          outgoing.pause();
          outgoing.currentTime = 0;
          outgoing.style.opacity = "0";
          outgoing.muted = true;
          outgoing.volume = 0;
          incoming.style.opacity = "1";
          incoming.muted = !videoAudioEnabled;
          incoming.volume = videoAudioEnabled ? 0.24 : 0;
          const previousOutgoing = outgoing;
          outgoing = incoming;
          incoming = previousOutgoing;
          // Read the new foreground copy's metadata on the next frame rather
          // than carrying a possibly not-yet-ready duration across the swap.
          loopEnd = 0;
          incomingPrepared = false;
          fading = false;
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    const cleanup = () => {
      window.cancelAnimationFrame(frame);
      primary.style.opacity = "1";
      secondary.style.opacity = "0";
    };
    sceneVideoCrossfadeCleanupRef.current = cleanup;
    return cleanup;
  }, [activeIndex, ready, reducedMotion, sceneAudioEnabled, story]);

  useEffect(() => {
    if (sceneAudioFrameRef.current !== null) {
      window.cancelAnimationFrame(sceneAudioFrameRef.current);
    }

    const elements = sceneAudioRefs.current;
    const starts = elements.map((audio) => audio?.volume ?? 0);
    const targets = elements.map((_, index) => (sceneAudioEnabled && ready && index === activeIndex ? 0.17 : 0));
    const activeAudio = elements[activeIndex];
    if (sceneAudioEnabled && ready && activeAudio && !reducedMotion && document.visibilityState === "visible") {
      void activeAudio.play().catch(() => undefined);
    }

    const startedAt = performance.now();
    const duration = reducedMotion ? 1 : 820;
    const fade = (time: number) => {
      const progress = clamp((time - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      elements.forEach((audio, index) => {
        if (!audio) return;
        audio.volume = starts[index] + (targets[index] - starts[index]) * eased;
      });
      if (progress < 1) {
        sceneAudioFrameRef.current = window.requestAnimationFrame(fade);
        return;
      }
      elements.forEach((audio, index) => {
        if (audio && targets[index] === 0) audio.pause();
      });
      sceneAudioFrameRef.current = null;
    };

    sceneAudioFrameRef.current = window.requestAnimationFrame(fade);
    return () => {
      if (sceneAudioFrameRef.current !== null) {
        window.cancelAnimationFrame(sceneAudioFrameRef.current);
      }
    };
  }, [activeIndex, ready, reducedMotion, sceneAudioEnabled, story]);

  useEffect(
    () => () => {
      if (sceneAudioFrameRef.current !== null) {
        window.cancelAnimationFrame(sceneAudioFrameRef.current);
      }
      sceneAudioRefs.current.forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
      });
    },
    [],
  );

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        sceneVideoRefs.current.forEach((video) => video?.pause());
        sceneVideoSecondaryRefs.current.forEach((video) => video?.pause());
        sceneAudioRefs.current.forEach((audio) => audio?.pause());
        return;
      }
      if (ready && !reducedMotion) {
        void sceneVideoRefs.current[activeIndex]?.play().catch(() => undefined);
        if (sceneAudioEnabled) void sceneAudioRefs.current[activeIndex]?.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeIndex, ready, reducedMotion, sceneAudioEnabled]);

  useEffect(() => {
    let frame = 0;
    const monitorTrimLoop = () => {
      sceneVideoRefs.current.forEach((video, index) => {
        if (!video || index !== activeIndex || !ready || reducedMotion) return;
        if (story.scenes[index].videoLoop !== "trim" || !Number.isFinite(video.duration) || video.duration <= 0) {
          return;
        }
        if (video.duration - video.currentTime <= 0.06) {
          video.currentTime = 0;
        }
      });
      frame = window.requestAnimationFrame(monitorTrimLoop);
    };
    frame = window.requestAnimationFrame(monitorTrimLoop);
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, ready, reducedMotion, story]);

  return (
    <section
      ref={rootRef}
      className="kiln-story"
      data-story={story.id}
      data-scene={activeScene.id}
      data-arrival-phase={arrivalPhase}
      data-scene-moving="false"
      data-detail-open={Boolean(activeHotspot)}
      aria-label={story.ariaLabel}
    >
      <div className="kiln-story-camera">
        <div className="kiln-story-scenes" aria-hidden="true">
          {story.scenes.map((scene, sceneIndex) => (
            <div
              key={scene.id}
              className="kiln-story-scene"
              data-motion={scene.motion}
              data-video={scene.video ? "true" : "false"}
              data-video-loop={scene.videoLoop ?? "none"}
              data-running="false"
            >
              <img
                className="kiln-story-scene-image"
                src={scene.image}
                alt=""
                draggable={false}
                loading={sceneIndex === activeIndex ? "eager" : "lazy"}
                decoding="async"
              />
              {scene.video ? (
                <video
                  className="kiln-story-scene-video"
                  src={scene.video}
                  poster={scene.image}
                  muted
                  loop={scene.videoLoop === "native"}
                  playsInline
                  preload={sceneIndex === activeIndex ? "auto" : "none"}
                  aria-hidden="true"
                  ref={(node) => {
                    sceneVideoRefs.current[sceneIndex] = node;
                  }}
                  onTimeUpdate={(event) => handleSceneVideoTimeUpdate(sceneIndex, event.currentTarget)}
                  onEnded={(event) => handleSceneVideoEnded(sceneIndex, event.currentTarget)}
                />
              ) : null}
              {scene.video && scene.videoLoop === "crossfade" ? (
                <video
                  className="kiln-story-scene-video kiln-story-scene-video-secondary"
                  src={scene.video}
                  poster={scene.image}
                  muted
                  playsInline
                  preload={sceneIndex === activeIndex ? "auto" : "none"}
                  aria-hidden="true"
                  ref={(node) => {
                    sceneVideoSecondaryRefs.current[sceneIndex] = node;
                  }}
                  onEnded={(event) => handleSceneVideoEnded(sceneIndex, event.currentTarget)}
                />
              ) : null}
              {scene.audio ? (
                <audio
                  src={scene.audio}
                  loop
                  preload={sceneIndex === activeIndex ? "metadata" : "none"}
                  aria-hidden="true"
                  ref={(node) => {
                    sceneAudioRefs.current[sceneIndex] = node;
                  }}
                />
              ) : null}
              <div className="kiln-story-scene-shade" />
              <div className="kiln-story-motion">
                {scene.motion === "ru-after-rain" ? (
                  <>
                    <div className="kiln-story-rain" aria-hidden="true">
                      <span className="kiln-story-rain-layer kiln-story-rain-layer-near" />
                      <span className="kiln-story-rain-layer kiln-story-rain-layer-far" />
                    </div>
                    <div className="kiln-story-chimney-smoke" aria-hidden="true">
                      <span className="kiln-story-chimney-smoke-wisp kiln-story-chimney-smoke-wisp-a" />
                      <span className="kiln-story-chimney-smoke-wisp kiln-story-chimney-smoke-wisp-b" />
                      <span className="kiln-story-chimney-smoke-wisp kiln-story-chimney-smoke-wisp-c" />
                    </div>
                  </>
                ) : scene.motion === "ru-river" ? (
                  <>
                    <div className="kiln-story-river-nature" aria-hidden="true">
                      <span
                        className="kiln-story-river-tree-sway kiln-story-river-tree-sway-left"
                      />
                      <span
                        className="kiln-story-river-tree-sway kiln-story-river-tree-sway-far"
                      />
                      <span
                        className="kiln-story-river-reflection kiln-story-river-reflection-upper"
                      />
                      <span
                        className="kiln-story-river-reflection kiln-story-river-reflection-lower"
                      />
                      <span className="kiln-story-river-water-ripples" />
                    </div>
                    <div className="kiln-story-river-haze">
                      <span className="kiln-story-river-haze-far" />
                      <span className="kiln-story-river-haze-mid" />
                      <span className="kiln-story-river-haze-low" />
                    </div>
                  </>
                ) : scene.motion === "ru-window" ? (
                  <div className="kiln-story-tyndall-dust-field" aria-hidden="true">
                    <span className="kiln-story-tyndall-dust-bank kiln-story-tyndall-dust-bank-a" />
                    <span className="kiln-story-tyndall-dust-bank kiln-story-tyndall-dust-bank-b" />
                    <i className="kiln-story-tyndall-speck kiln-story-tyndall-speck-a" />
                    <i className="kiln-story-tyndall-speck kiln-story-tyndall-speck-b" />
                    <i className="kiln-story-tyndall-speck kiln-story-tyndall-speck-c" />
                    <i className="kiln-story-tyndall-speck kiln-story-tyndall-speck-d" />
                    <i className="kiln-story-tyndall-speck kiln-story-tyndall-speck-e" />
                    <i className="kiln-story-tyndall-speck kiln-story-tyndall-speck-f" />
                    <i className="kiln-story-tyndall-speck kiln-story-tyndall-speck-g" />
                    <i className="kiln-story-tyndall-speck kiln-story-tyndall-speck-h" />
                  </div>
                ) : scene.motion === "ding-ash" && !scene.video ? (
                  <>
                    <span className="kiln-story-ding-ash-sun-shift" aria-hidden="true" />
                    <div className="kiln-story-ding-ash-field" aria-hidden="true">
                      {dingAshMotes.map((mote, moteIndex) => (
                        <i
                          key={`ding-ash-mote-${moteIndex}`}
                          className="kiln-story-ding-ash-mote"
                          style={
                            {
                              "--ash-x": mote.x,
                              "--ash-y": mote.y,
                              "--ash-size": mote.size,
                              "--ash-blur": mote.blur,
                              "--ash-dx": mote.dx,
                              "--ash-dy": mote.dy,
                              "--ash-mid-dx": mote.midDx,
                              "--ash-mid-dy": mote.midDy,
                              "--ash-duration": mote.duration,
                              "--ash-delay": mote.delay,
                              "--ash-alpha": mote.alpha,
                              "--ash-low-alpha": mote.lowAlpha,
                            } as CSSProperties
                          }
                        />
                      ))}
                    </div>
                    <div ref={dingSparkFieldRef} className="kiln-story-ding-spark-field" aria-hidden="true">
                      {dingKilnSparks.map((spark, sparkIndex) => (
                        <i
                          key={`ding-kiln-spark-${sparkIndex}`}
                          className={`kiln-story-ding-spark kiln-story-ding-spark--${spark.tone}`}
                          style={
                            {
                              "--spark-x": spark.x,
                              "--spark-y": spark.y,
                              "--spark-size": spark.size,
                            } as CSSProperties
                          }
                        />
                      ))}
                    </div>
                    <span className="kiln-story-ding-ash-fire-glow" aria-hidden="true" />
                  </>
                ) : scene.motion === "ding-packing" && !scene.video ? (
                  <>
                    <span className="kiln-story-ding-packing-blind" aria-hidden="true" />
                    <span className="kiln-story-ding-packing-sun" aria-hidden="true" />
                    <span className="kiln-story-ding-packing-sun-patch" aria-hidden="true" />
                    <span className="kiln-story-ding-packing-shadow" aria-hidden="true" />
                    <span className="kiln-story-ding-packing-straw" aria-hidden="true" />
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {!story.vesselIntegrated ? (
          <div className="kiln-story-vessel-stage" aria-hidden="true">
            <div className="kiln-story-vessel-shadow" />
            <img
              className="kiln-story-vessel"
              src={story.vesselImage}
              alt=""
              draggable={false}
              style={{ "--story-vessel-filter": story.vesselFilter } as CSSProperties}
            />
            <img className="kiln-story-vessel-light" src={story.vesselImage} alt="" draggable={false} />
          </div>
        ) : null}
      </div>

      <Carousel
        className="kiln-story-carousel"
        contentClassName="kiln-story-track"
        ariaLabel={story.ariaLabel}
        draggingEnabled={ready && !activeHotspot}
      >
        {loopedScenes.map((scene, physicalIndex) => {
          const sceneIndex = wrapIndex(physicalIndex - 1, story.scenes.length);
          const duplicate = physicalIndex === 0 || physicalIndex === loopedScenes.length - 1;
          const hidden = duplicate || activeIndex !== sceneIndex;
          return (
            <article
              key={`${physicalIndex}-${scene.id}`}
              className="kiln-story-card"
              data-scene-index={sceneIndex}
              data-scene-active={!duplicate && activeIndex === sceneIndex}
              aria-hidden={hidden}
              inert={hidden}
            >
              <header className="kiln-story-copy">
                <span>{scene.number} / {String(story.scenes.length).padStart(2, "0")}</span>
                <h2>{scene.title}</h2>
                <p>{scene.tagline}</p>
                <div className="kiln-story-vessel-label">
                  <strong>{scene.vessel}</strong>
                  <small>{scene.period}</small>
                </div>
              </header>
            </article>
          );
        })}
      </Carousel>

      {hasSceneVideo ? (
        <button
          type="button"
          className="kiln-story-audio-toggle"
          data-enabled={sceneAudioEnabled}
          aria-label={sceneAudioEnabled ? "关闭场景环境音" : "开启场景环境音"}
          onClick={() => setSceneAudioEnabled((enabled) => !enabled)}
        >
          {sceneAudioEnabled ? <SpeakerLoudIcon aria-hidden="true" /> : <SpeakerOffIcon aria-hidden="true" />}
        </button>
      ) : null}

      <div className="kiln-story-hotspots" aria-label={`${activeScene.title}知识观察点`}>
        {activeScene.hotspots.map((hotspot, hotspotIndex) => (
          <button
            key={`${activeScene.id}-${hotspot.id}`}
            type="button"
            className="kiln-story-hotspot"
            style={{ "--hotspot-x": `${hotspot.x}%`, "--hotspot-y": `${hotspot.y}%` } as CSSProperties}
            aria-label={`${hotspot.label}：${hotspot.title}`}
            disabled={!ready}
            onClick={() => setActiveHotspot(hotspot)}
          >
            <i aria-hidden="true">{hotspotIndex + 1}</i>
            <span>{hotspot.label}</span>
          </button>
        ))}
      </div>

      <button type="button" className="kiln-story-back" onClick={onBack} aria-label="返回窑中">
        <ArrowLeftIcon aria-hidden="true" />
      </button>

      {activeHotspot ? (
        <aside
          className="kiln-story-detail"
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${story.id}-story-detail-title`}
        >
          <button
            type="button"
            className="kiln-story-detail-close"
            onClick={() => setActiveHotspot(null)}
            aria-label="关闭知识详情"
          >
            <Cross2Icon aria-hidden="true" />
          </button>
          <span>{activeScene.title} · 观察点</span>
          <h3 id={`${story.id}-story-detail-title`}>{activeHotspot.title}</h3>
          <p>{activeHotspot.body}</p>
          <dl>
            <div>
              <dt>器物依据</dt>
              <dd>{activeScene.fact}</dd>
            </div>
            <div>
              <dt>场景说明</dt>
              <dd>{activeScene.reconstruction}</dd>
            </div>
          </dl>
          <a href={activeScene.sourceUrl} target="_blank" rel="noreferrer">
            资料来源 · {activeScene.sourceLabel}
          </a>
        </aside>
      ) : null}
    </section>
  );
}

export default function Prototype() {
  const keyboard = useKeyboard();
  const [yaw, setYaw] = useState(INTRO_KILN.yaw);
  const [pitch, setPitch] = useState(INTRO_KILN.pitch);
  const [activeIndex, setActiveIndex] = useState(INTRO_KILN_INDEX);
  const [dragging, setDragging] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [portalPhase, setPortalPhase] = useState<PortalPhase>("fire");
  const [knowledgePhase, setKnowledgePhase] = useState<KnowledgePhase>("idle");
  const [heatOrigin, setHeatOrigin] = useState<readonly [number, number]>([0, -0.14]);
  const [introPhase, setIntroPhase] = useState<IntroPhase>("idle");
  const [introModelSettled, setIntroModelSettled] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const viewRef = useRef({ yaw: INTRO_KILN.yaw, pitch: INTRO_KILN.pitch });
  const inertiaFrameRef = useRef<number | null>(null);
  const dragMoveFrameRef = useRef<number | null>(null);
  const pendingDragViewRef = useRef<{ yaw: number; pitch: number } | null>(null);
  const portalTimerRef = useRef<number | null>(null);
  const knowledgeTimerRef = useRef<number | null>(null);
  const introTimerRef = useRef<number | null>(null);
  const introAssetsPromiseRef = useRef<Promise<void> | null>(null);
  const introStartedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const activeKiln = kilns[activeIndex];

  const updateView = useCallback((nextYaw: number, nextPitch: number) => {
    viewRef.current = { yaw: nextYaw, pitch: nextPitch };
    setYaw(nextYaw);
    setPitch(nextPitch);
  }, []);

  const stopInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }, []);

  const clearPortalTimer = useCallback(() => {
    if (portalTimerRef.current !== null) {
      window.clearTimeout(portalTimerRef.current);
      portalTimerRef.current = null;
    }
  }, []);

  const clearKnowledgeTimer = useCallback(() => {
    if (knowledgeTimerRef.current !== null) {
      window.clearTimeout(knowledgeTimerRef.current);
      knowledgeTimerRef.current = null;
    }
  }, []);

  const clearIntroTimer = useCallback(() => {
    if (introTimerRef.current !== null) {
      window.clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
  }, []);

  const resetPhoneScreenScroll = () => {
    const phoneScreen = document.querySelector<HTMLElement>("[data-phone-screen]");
    if (phoneScreen && phoneScreen.scrollTop !== 0) phoneScreen.scrollTop = 0;
  };

  const ensureIntroAssets = useCallback(() => {
    if (!introAssetsPromiseRef.current) {
      introAssetsPromiseRef.current = preloadIntroAssets();
    }
    return introAssetsPromiseRef.current;
  }, []);

  const navigateTo = useCallback(
    (index: number) => {
      if (keyboard.visible) keyboard.hide();
      stopInertia();
      const kiln = kilns[index];
      const start = { ...viewRef.current };
      const targetYaw = start.yaw + normalizeYaw(kiln.yaw - normalizeYaw(start.yaw));
      const targetPitch = kiln.pitch + Math.round((start.pitch - kiln.pitch) / 360) * 360;
      const distance = Math.hypot(targetYaw - start.yaw, targetPitch - start.pitch);
      const duration = clamp(distance * 5.4, 280, 760);
      setActiveIndex(index);
      setInspecting(false);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        updateView(targetYaw, targetPitch);
        return;
      }

      const startedAt = performance.now();
      const tick = (time: number) => {
        const progress = Math.min(1, (time - startedAt) / duration);
        updateView(
          start.yaw + (targetYaw - start.yaw) * progress,
          start.pitch + (targetPitch - start.pitch) * progress,
        );
        if (progress < 1) {
          inertiaFrameRef.current = window.requestAnimationFrame(tick);
        } else {
          inertiaFrameRef.current = null;
        }
      };
      inertiaFrameRef.current = window.requestAnimationFrame(tick);
    },
    [keyboard, stopInertia, updateView],
  );

  const updateNearest = useCallback((nextYaw: number, nextPitch: number) => {
    const nextIndex = nearestKilnIndex(nextYaw, nextPitch);
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  }, []);

  const flushPendingDragView = useCallback(() => {
    if (dragMoveFrameRef.current !== null) {
      window.cancelAnimationFrame(dragMoveFrameRef.current);
      dragMoveFrameRef.current = null;
    }
    const pending = pendingDragViewRef.current;
    pendingDragViewRef.current = null;
    if (!pending) return;
    updateView(pending.yaw, pending.pitch);
  }, [updateView]);

  useEffect(() => {
    if (keyboard.visible) keyboard.hide();
    return () => {
      stopInertia();
      if (dragMoveFrameRef.current !== null) window.cancelAnimationFrame(dragMoveFrameRef.current);
      dragMoveFrameRef.current = null;
      pendingDragViewRef.current = null;
      clearPortalTimer();
      clearKnowledgeTimer();
      clearIntroTimer();
    };
  }, [clearIntroTimer, clearKnowledgeTimer, clearPortalTimer, keyboard, stopInertia]);

  useEffect(() => {
    void ensureIntroAssets();
  }, [ensureIntroAssets]);

  useEffect(() => {
    clearPortalTimer();
    clearKnowledgeTimer();
    setPortalPhase("fire");
    setKnowledgePhase("idle");
    setInspecting(false);
  }, [activeIndex, clearKnowledgeTimer, clearPortalTimer]);

  const enterKilnKnowledge = (delay: number) => {
    if (knowledgePhase !== "idle") return;
    if (keyboard.visible) keyboard.hide();
    stopInertia();
    clearPortalTimer();
    clearKnowledgeTimer();
    setInspecting(false);
    setKnowledgePhase("heating");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    knowledgeTimerRef.current = window.setTimeout(
      () => {
        knowledgeTimerRef.current = null;
        setKnowledgePhase("knowledge");
        if (activeKiln.id === "cizhou") {
          window.requestAnimationFrame(resetPhoneScreenScroll);
        }
      },
      reducedMotion ? 120 : delay,
    );
  };

  const leaveKilnKnowledge = () => {
    clearKnowledgeTimer();
    resetPhoneScreenScroll();
    setKnowledgePhase("idle");
    setPortalPhase("fire");
    setInspecting(false);
  };

  const enterActiveKiln = (event?: ReactMouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current || portalPhase !== "fire") return;
    if (
      activeKiln.id === "ge" ||
      activeKiln.id === "ru" ||
      activeKiln.id === "guan" ||
      activeKiln.id === "longquan" ||
      activeKiln.id === "cizhou" ||
      activeKiln.id === "jun" ||
      activeKiln.id === "yaozhou" ||
      activeKiln.id === "ding"
    ) {
      if (event && event.detail > 0) {
        const sphere = event.currentTarget.parentElement;
        const bounds = sphere?.getBoundingClientRect();
        if (bounds && bounds.width > 0 && bounds.height > 0) {
          const originX = clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -0.96, 0.96);
          const originY = clamp(1 - ((event.clientY - bounds.top) / bounds.height) * 2, -0.96, 0.96);
          setHeatOrigin([originX, originY]);
        }
      } else {
        setHeatOrigin([0, -0.14]);
      }
      enterKilnKnowledge(
        activeKiln.id === "ge"
          ? GE_KNOWLEDGE_DELAY
          : activeKiln.id === "ru"
            ? RU_KNOWLEDGE_DELAY
          : activeKiln.id === "guan"
            ? GUAN_KNOWLEDGE_DELAY
          : activeKiln.id === "longquan"
            ? LONGQUAN_KNOWLEDGE_DELAY
          : activeKiln.id === "jun"
            ? JUN_KNOWLEDGE_DELAY
            : activeKiln.id === "yaozhou"
              ? YAOZHOU_KNOWLEDGE_DELAY
              : activeKiln.id === "ding"
                ? DING_KNOWLEDGE_DELAY
              : CIZHOU_KNOWLEDGE_DELAY,
      );
      return;
    }
    if (keyboard.visible) keyboard.hide();
    clearPortalTimer();
    setInspecting(false);
    setPortalPhase("entering");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    portalTimerRef.current = window.setTimeout(
      () => {
        portalTimerRef.current = null;
        setPortalPhase("artifact");
      },
      reducedMotion ? 120 : 920,
    );
  };

  const enterKilnWorld = () => {
    if (introPhase !== "idle" || introStartedRef.current) return;
    introStartedRef.current = true;
    if (keyboard.visible) keyboard.hide();
    clearIntroTimer();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroPhase("hidden");
      return;
    }

    setIntroPhase("accelerating");
    introTimerRef.current = window.setTimeout(() => {
      setIntroPhase("entering");
      introTimerRef.current = window.setTimeout(() => {
        introTimerRef.current = null;
        setIntroPhase("hidden");
      }, INTRO_HIDE_DELAY);
    }, INTRO_ACCELERATE_DURATION);
  };

  useEffect(() => {
    if (introPhase !== "idle") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      enterKilnWorld();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [introPhase, enterKilnWorld]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || knowledgePhase !== "idle") return;
    if (keyboard.visible) keyboard.hide();
    stopInertia();
    const target = event.target instanceof Element ? event.target : null;
    const tapTarget = target?.closest(".fire-portal-hitbox, .kiln-material-portal-hitbox")
      ? "portal"
      : target?.closest(".kiln-vessel")
        ? "vessel"
        : null;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setInspecting(false);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startYaw: viewRef.current.yaw,
      startPitch: viewRef.current.pitch,
      tapTarget,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (knowledgePhase !== "idle") return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const totalX = event.clientX - drag.startX;
    const totalY = event.clientY - drag.startY;
    const nextYaw = drag.startYaw - totalX * 0.34;
    const nextPitch = drag.startPitch + totalY * 0.23;
    drag.moved ||= Math.hypot(totalX, totalY) > 7;
    pendingDragViewRef.current = { yaw: nextYaw, pitch: nextPitch };
    if (dragMoveFrameRef.current === null) {
      dragMoveFrameRef.current = window.requestAnimationFrame(() => {
        dragMoveFrameRef.current = null;
        const pending = pendingDragViewRef.current;
        pendingDragViewRef.current = null;
        if (!pending) return;
        updateView(pending.yaw, pending.pitch);
      });
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    flushPendingDragView();
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 120);
      const travelX = event.clientX - drag.startX;
      const travelY = event.clientY - drag.startY;
      const dominantTravel = Math.abs(travelX) >= Math.abs(travelY) ? travelX : travelY;
      const direction = dominantTravel < 0 ? 1 : -1;
      navigateTo(wrapIndex(activeIndex + direction, kilns.length));
    } else if (drag.tapTarget) {
      if (drag.tapTarget === "portal") {
        enterActiveKiln();
      } else if (vesselVisible) {
        setInspecting((value) => !value);
      }
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 120);
    } else {
      updateNearest(viewRef.current.yaw, viewRef.current.pitch);
    }
  };

  const sphereStyle = useMemo(() => {
    const radiansYaw = (yaw * Math.PI) / 180;
    const radiansPitch = (pitch * Math.PI) / 180;
    const offsetX = Math.sin(radiansYaw) * -72;
    const offsetY = Math.sin(radiansPitch) * 54;
    const parallaxX = Math.sin(radiansYaw + 0.8) * 38;
    const parallaxY = Math.sin(radiansPitch * 1.4) * -28;

    return {
      "--sphere-x": `${offsetX}px`,
      "--sphere-y": `${offsetY}px`,
      "--sphere-detail-x": `${parallaxX}px`,
      "--sphere-detail-y": `${parallaxY}px`,
      "--atlas-x": `${activeKiln.atlasX}%`,
      "--atlas-y": `${activeKiln.atlasY}%`,
      "--kiln-color": activeKiln.color,
      "--kiln-ink": activeKiln.ink,
      "--kiln-text": activeKiln.text,
      "--kiln-muted-text": activeKiln.mutedText,
      "--atmosphere-filter": activeKiln.atmosphereFilter,
      "--vessel-filter": activeKiln.imageFilter,
      "--panorama-image": activeKiln.panorama
        ? `url("${activeKiln.panorama}")`
        : 'url("/assets/kilns/kiln-sphere-atlas.webp")',
    } as CSSProperties;
  }, [activeKiln, pitch, yaw]);

  const navigateByKey = (key: string) => {
    if (knowledgePhase !== "idle") return;
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown") return;
    const direction = key === "ArrowLeft" || key === "ArrowUp" ? 1 : -1;
    navigateTo(wrapIndex(activeIndex + direction, kilns.length));
  };

  const portalVisible = portalPhase !== "artifact" && knowledgePhase !== "knowledge";
  const vesselVisible = portalPhase === "artifact" && knowledgePhase === "idle";
  const cizhouHeating = activeKiln.id === "cizhou" && knowledgePhase === "heating";
  const junHeating = activeKiln.id === "jun" && knowledgePhase === "heating";
  const yaozhouHeating = activeKiln.id === "yaozhou" && knowledgePhase === "heating";
  const geHeating = activeKiln.id === "ge" && knowledgePhase === "heating";
  const ruHeating = activeKiln.id === "ru" && knowledgePhase === "heating";
  const guanHeating = activeKiln.id === "guan" && knowledgePhase === "heating";
  const longquanHeating = activeKiln.id === "longquan" && knowledgePhase === "heating";
  const dingHeating = activeKiln.id === "ding" && knowledgePhase === "heating";
  const cizhouKnowledgeOpen = activeKiln.id === "cizhou" && knowledgePhase === "knowledge";
  const junKnowledgeOpen = activeKiln.id === "jun" && knowledgePhase === "knowledge";
  const yaozhouKnowledgeOpen = activeKiln.id === "yaozhou" && knowledgePhase === "knowledge";
  const geKnowledgeOpen = activeKiln.id === "ge" && knowledgePhase === "knowledge";
  const ruKnowledgeOpen = activeKiln.id === "ru" && knowledgePhase === "knowledge";
  const guanKnowledgeOpen = activeKiln.id === "guan" && knowledgePhase === "knowledge";
  const longquanKnowledgeOpen = activeKiln.id === "longquan" && knowledgePhase === "knowledge";
  const dingKnowledgeOpen = activeKiln.id === "ding" && knowledgePhase === "knowledge";
  const atmospherePreset = activeKiln.atmosphere ? kilnAtmospherePresets[activeKiln.atmosphere] : undefined;
  const atmosphereActivity =
    introPhase !== "hidden"
      ? 0
      : knowledgePhase === "knowledge"
        ? 0
        : cizhouHeating || junHeating || yaozhouHeating || geHeating || ruHeating || guanHeating || longquanHeating || dingHeating
          ? activeKiln.id === "ge"
            ? 0.92
            : activeKiln.id === "guan"
              ? 1.16
            : activeKiln.id === "longquan"
              ? 1.12
            : activeKiln.id === "jun"
              ? 1.02
              : activeKiln.id === "yaozhou"
                ? 1.24
                : activeKiln.id === "ding"
                  ? 1.02
                : 1.14
          : dragging
            ? 0.3
            : portalPhase === "entering"
              ? 1.12
              : portalPhase === "artifact"
                ? 0
                : 1;

  return (
    <MobileScroll className="app-screen kiln-app">
      {introPhase !== "hidden" ? (
        <section
          className="kiln-intro"
          data-phase={introPhase}
          data-mode="model"
          aria-label="旋转开孔泥坯启动页"
        >
          <button
            type="button"
            className="kiln-intro-core"
            disabled={introPhase !== "idle" || !introModelSettled}
            data-model-ready={introModelSettled}
            aria-label="触碰开孔泥坯，旋转进入八窑世界"
            onClick={enterKilnWorld}
            autoFocus
          >
            <span className="kiln-intro-wheel" aria-hidden="true" />
          </button>
          <ClayModelIntro phase={introPhase} onSettled={() => setIntroModelSettled(true)} />
          <span className="kiln-intro-transition" aria-hidden="true">
            <img
              className="kiln-intro-transition-art"
              src={INTRO_PORTAL_URL}
              alt=""
              draggable={false}
              loading="eager"
              decoding="sync"
            />
          </span>
        </section>
      ) : null}
      <main
        className="kiln-sphere"
        data-intro-phase={introPhase}
        data-kiln={activeKiln.id}
        data-portal-motion={activeKiln.portalMotion}
        data-dragging={dragging}
        data-inspecting={inspecting}
        data-portal-phase={portalPhase}
        data-knowledge-phase={knowledgePhase}
        data-atmosphere={activeKiln.atmosphere ?? "none"}
        data-scroll-drag="ignore"
        style={sphereStyle}
        tabIndex={introPhase === "hidden" ? 0 : -1}
        aria-hidden={introPhase !== "hidden"}
        inert={introPhase !== "hidden"}
        aria-label="八窑无边球面，向任意方向拖动探索"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onKeyDown={(event) => {
          if (event.key.startsWith("Arrow")) {
            event.preventDefault();
            navigateByKey(event.key);
          }
          if (event.key === "Escape") setInspecting(false);
        }}
      >
        {activeKiln.panorama && activeKiln.panoramaMotion ? (
          <SphericalPanorama
            key={activeKiln.id}
            src={activeKiln.panorama}
            // Start drawing during the final intro handoff so the first
            // visible sphere frame is already warm; keeping it paused in the
            // idle/accelerating phases avoids competing with the clay model.
            enabled={(introPhase === "entering" || introPhase === "hidden") && knowledgePhase !== "knowledge"}
            motion={activeKiln.panoramaMotion}
            yaw={normalizeYaw(yaw - activeKiln.yaw)}
            pitch={pitch - activeKiln.pitch}
            heatStrength={atmospherePreset?.heat ?? 0}
            activity={atmosphereActivity}
            emberOverlaySrc={
              activeKiln.id === "cizhou"
                ? CIZHOU_FIRED_PANORAMA
                : activeKiln.id === "ru"
                  ? RU_FIRED_PANORAMA
                : activeKiln.id === "jun"
                  ? JUN_KILNCHANGE_PANORAMA
                  : activeKiln.id === "yaozhou"
                    ? YAOZHOU_GLAZE_PANORAMA
                    : activeKiln.id === "ding"
                      ? DING_FIRED_PANORAMA
                  : undefined
            }
            heatMaskSrc={
              activeKiln.id === "ge"
                ? GE_CRACKLE_MASK
                : activeKiln.id === "guan"
                  ? GUAN_FIRING_MASK
                : activeKiln.id === "cizhou"
                  ? CIZHOU_HEAT_MASK
                  : activeKiln.id === "yaozhou"
                    ? YAOZHOU_DEPTH_MASK
                    : undefined
            }
            heatOrigin={heatOrigin}
            inkHeat={knowledgePhase !== "idle" ? 1 : 0}
          />
        ) : (
          <>
            <div className="sphere-surface sphere-surface-base" aria-hidden="true" />
            <div className="sphere-surface sphere-surface-detail" aria-hidden="true" />
          </>
        )}
        <div className="sphere-color-field" aria-hidden="true" />
        <div className="sphere-depth" aria-hidden="true" />
        {atmospherePreset ? (
          <div
            className="kiln-heat-halo"
            aria-hidden="true"
            style={{ "--kiln-heat-color": atmospherePreset.halo } as CSSProperties}
          />
        ) : null}
        <KilnEmbers preset={atmospherePreset} activity={atmosphereActivity} />

        <header className="kiln-identity" aria-live="polite">
          <p>{activeKiln.feature}</p>
          <h1>{activeKiln.name}</h1>
          <small>八窑 · 无界</small>
        </header>

        {portalVisible ? (
          activeKiln.fire && activeKiln.fireMotion ? (
            <button
              key={`fire-${activeKiln.id}`}
              type="button"
              className="kiln-fire-portal"
              data-motion={activeKiln.fireMotion}
              data-entering={
                portalPhase === "entering" ||
                cizhouHeating ||
                junHeating ||
                yaozhouHeating ||
                 geHeating ||
                 ruHeating ||
                 guanHeating ||
                longquanHeating ||
                dingHeating
              }
              aria-label={
                activeKiln.id === "ge"
                  ? "触碰哥窑窑火，观看金丝铁线成纹"
                  : activeKiln.id === "ru"
                    ? "触碰汝窑窑火，观看云破透火与釉光凝结"
                  : activeKiln.id === "guan"
                    ? "触碰官窑窑火，观看冰裂厚釉承火"
                  : activeKiln.id === "longquan"
                    ? "触碰龙泉窑火，观看釉层由内而外逐渐白热烧成"
                  : activeKiln.id === "cizhou"
                  ? "触碰磁州窑火，观看黑彩烧成"
                  : activeKiln.id === "jun"
                    ? "触碰钧窑火，观看釉色窑变"
                    : activeKiln.id === "yaozhou"
                      ? "触碰耀州窑火，观看积釉成翠"
                    : activeKiln.id === "ding"
                      ? "触碰定窑火，观看印花凹处纳火凝光"
                    : `触碰${activeKiln.name}窑火进入器物层`
              }
              onClick={enterActiveKiln}
            >
              <span className="fire-portal-hitbox" aria-hidden="true" />
              <span className="fire-progress-fade" aria-hidden="true">
                <img
                  className="fire-portal-layer fire-portal-echo"
                  src={activeKiln.fire}
                  alt=""
                  draggable={false}
                />
                <LivingFire src={activeKiln.fire} motion={activeKiln.fireMotion} />
              </span>
              <span className="fire-portal-label">{portalLabels[activeKiln.portalMotion]}</span>
            </button>
          ) : (
            <button
              key={`portal-${activeKiln.id}`}
              type="button"
              className="kiln-material-portal"
              data-motion={activeKiln.portalMotion}
              data-entering={portalPhase === "entering"}
              aria-label={`触碰${activeKiln.name}窑口进入器物层`}
              onClick={enterActiveKiln}
            >
              <span className="kiln-material-portal-hitbox" aria-hidden="true" />
              <span className="kiln-material-portal-core" aria-hidden="true" />
              <span className="kiln-material-portal-ring" aria-hidden="true" />
              <span className="kiln-material-portal-grain" aria-hidden="true" />
              <span className="kiln-material-portal-label">{portalLabels[activeKiln.portalMotion]}</span>
            </button>
          )
        ) : null}

        <button
          key={`vessel-${activeKiln.id}`}
          type="button"
          className={`kiln-vessel vessel-shape-${activeKiln.shape}`}
          data-visible={vesselVisible}
          aria-label={`查看${activeKiln.name}${activeKiln.vessel}`}
          aria-hidden={!vesselVisible}
          disabled={!vesselVisible}
          onClick={() => {
            if (suppressClickRef.current) return;
            setInspecting((value) => !value);
          }}
        >
          <span className="vessel-mist" aria-hidden="true" />
          <img src={activeKiln.image} alt={activeKiln.vessel} draggable={false} />
        </button>

        <div className="vessel-label" data-visible={vesselVisible} aria-hidden="true">
          <span>{activeKiln.vessel}</span>
          <i />
        </div>

        <aside className="kiln-reading" aria-hidden={!inspecting}>
          <span>{String(activeIndex + 1).padStart(2, "0")} / 08</span>
          <p>{activeKiln.description}</p>
          <small>再次轻触器物归位</small>
        </aside>

        <div className="orbit-hint" aria-hidden="true">
          <span>向任意方向游历</span>
          <small>拖动球面</small>
        </div>

        {geKnowledgeOpen ? <KilnStoryExperience story={kilnStories.ge} onBack={leaveKilnKnowledge} /> : null}

        {ruKnowledgeOpen ? (
          <KilnStoryExperience story={kilnStories.ru} onBack={leaveKilnKnowledge} />
        ) : null}

        {guanKnowledgeOpen ? <KilnStoryExperience story={kilnStories.guan} onBack={leaveKilnKnowledge} /> : null}

        {longquanKnowledgeOpen ? (
          <KilnStoryExperience story={kilnStories.longquan} onBack={leaveKilnKnowledge} />
        ) : null}

        {dingKnowledgeOpen ? (
          <KilnStoryExperience story={kilnStories.ding} onBack={leaveKilnKnowledge} />
        ) : null}

        {cizhouKnowledgeOpen ? (
          <CizhouKnowledgeExperience onBack={leaveKilnKnowledge} />
        ) : null}

        {junKnowledgeOpen ? <KilnStoryExperience story={kilnStories.jun} onBack={leaveKilnKnowledge} /> : null}

        {yaozhouKnowledgeOpen ? <KilnStoryExperience story={kilnStories.yaozhou} onBack={leaveKilnKnowledge} /> : null}

      </main>
    </MobileScroll>
  );
}
