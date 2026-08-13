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
    feature: "釉厚如脂 · 金丝铁线",
    description: "深黑铁线与浅黄金丝交织，乳浊厚釉在静默中开裂。",
    image: "/assets/ceramics/01-double-ear-original.png",
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
    panorama: "/assets/kilns/ge-panorama.png",
    panoramaMotion: "ge",
    fire: "/assets/kilns/fire-portals/ge-fire-v1.png",
    fireMotion: "ge",
    atmosphere: "balanced",
  },
  {
    id: "ru",
    portalMotion: "ru",
    name: "汝窑",
    vessel: "莲花式碗",
    feature: "天青含露 · 雨过云破",
    description: "幽淡天青在湿润光泽中浮动，器形如一瓣未醒的莲。",
    image: "/assets/ceramics/03-lotus-bowl.png",
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
    panorama: "/assets/kilns/ru-panorama-v4.png",
    panoramaMotion: "ru",
    fire: "/assets/kilns/fire-portals/ru-fire-v1.png",
    fireMotion: "ru",
    atmosphere: "quiet",
  },
  {
    id: "guan",
    portalMotion: "guan",
    name: "官窑",
    vessel: "方琮式瓶",
    feature: "粉青厚釉 · 紫口铁足",
    description: "青灰釉色沉入深胎，方圆之间留下一层克制的光。",
    image: "/assets/ceramics/04-square-vase.png",
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
    panorama: "/assets/kilns/guan-panorama-v3.png",
    panoramaMotion: "guan",
    fire: "/assets/kilns/fire-portals/guan-fire-v1.png",
    fireMotion: "guan",
    atmosphere: "balanced",
  },
  {
    id: "cizhou",
    portalMotion: "cizhou",
    name: "磁州窑",
    vessel: "牡丹梅瓶",
    feature: "白地黑彩 · 刀笔如画",
    description: "黑白在球面上相互追逐，牡丹纹像一次果断的落笔。",
    image: "/assets/ceramics/02-cizhou-original.png",
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
    panorama: "/assets/kilns/cizhou-panorama.png",
    panoramaMotion: "cizhou",
    fire: "/assets/kilns/fire-portals/cizhou-fire-v2.png",
    fireMotion: "cizhou",
    atmosphere: "active",
  },
  {
    id: "longquan",
    portalMotion: "longquan",
    name: "龙泉窑",
    vessel: "花卉盖罐",
    feature: "梅子青光 · 刻花含蓄",
    description: "青绿釉层从暗处生长，刻花只在转动的光中被看见。",
    image: "/assets/ceramics/05-lidded-jar.png",
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
    panorama: "/assets/kilns/longquan-panorama-v2.png",
    panoramaMotion: "longquan",
    fire: "/assets/kilns/fire-portals/longquan-fire-v1.png",
    fireMotion: "longquan",
    atmosphere: "balanced",
  },
  {
    id: "jun",
    portalMotion: "jun",
    name: "钧窑",
    vessel: "玫瑰紫花盆",
    feature: "入窑一色 · 出窑万彩",
    description: "紫、蓝与青在釉中缓慢渗化，每一次停驻都没有定色。",
    image: "/assets/ceramics/06-jun-original.png",
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
    panorama: "/assets/kilns/jun-panorama.png",
    panoramaMotion: "jun",
    fire: "/assets/kilns/fire-portals/jun-fire-v1.png",
    fireMotion: "jun",
    atmosphere: "active",
  },
  {
    id: "yaozhou",
    portalMotion: "yaozhou",
    name: "耀州窑",
    vessel: "凤首提梁壶",
    feature: "青釉刻花 · 刀锋见影",
    description: "橄榄青釉覆住刻花，明暗沿着刀锋游走。",
    image: "/assets/ceramics/07-phoenix-ewer.png",
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
    panorama: "/assets/kilns/yaozhou-panorama-v9-1.png",
    panoramaMotion: "yaozhou",
    fire: "/assets/kilns/fire-portals/yaozhou-fire-v2.png",
    fireMotion: "yaozhou",
    atmosphere: "active",
  },
  {
    id: "ding",
    portalMotion: "ding",
    name: "定窑",
    vessel: "孩儿枕",
    feature: "白如凝脂 · 印花藏锋",
    description: "象牙白釉收起火色，纹样与人物在柔和阴影里安静呼吸。",
    image: "/assets/ceramics/08-boy-pillow.png",
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
    panorama: "/assets/kilns/ding-panorama-v3.png",
    panoramaMotion: "ding",
    fire: "/assets/kilns/fire-portals/ding-fire-v1.png",
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
const CIZHOU_FIRED_PANORAMA = "/assets/kilns/cizhou-knowledge/cizhou-panorama-fired-v3.png";
const CIZHOU_HEAT_MASK = "/assets/kilns/cizhou-knowledge/cizhou-ink-heat-mask-v1.png";
const CIZHOU_FIRING_DURATION = 3800;
const CIZHOU_HANDOFF_FADE_DURATION = 1200;
const CIZHOU_KNOWLEDGE_DELAY = CIZHOU_FIRING_DURATION + CIZHOU_HANDOFF_FADE_DURATION;
const JUN_KILNCHANGE_PANORAMA = "/assets/kilns/jun-knowledge/jun-panorama-kilnchange-v2.png";
const JUN_KNOWLEDGE_DELAY = 4400;
const YAOZHOU_GLAZE_PANORAMA = "/assets/kilns/yaozhou-knowledge/yaozhou-panorama-glaze-depth-v2.png";
const YAOZHOU_DEPTH_MASK = "/assets/kilns/yaozhou-knowledge/yaozhou-carving-depth-mask-v2.png";
const YAOZHOU_KNOWLEDGE_DELAY = 4600;
const GE_KNOWLEDGE_PANORAMA = "/assets/kilns/ge-panorama.png";
const GE_CRACKLE_MASK = "/assets/kilns/ge-knowledge/ge-crackle-dual-mask-v1.png";
const GE_KNOWLEDGE_DELAY = 4800;
const GUAN_KNOWLEDGE_PANORAMA = "/assets/kilns/guan-panorama-v3.png";
const GUAN_FIRING_MASK = "/assets/kilns/guan-knowledge/guan-firing-mask-v1.png";
const GUAN_KNOWLEDGE_DELAY = 5100;
const LONGQUAN_KNOWLEDGE_PANORAMA = "/assets/kilns/longquan-panorama-v2.png";
const LONGQUAN_KNOWLEDGE_DELAY = 5200;
const RU_KNOWLEDGE_PANORAMA = "/assets/kilns/ru-panorama-v4.png";
const RU_FIRED_PANORAMA = "/assets/kilns/ru-knowledge/ru-panorama-fired-v1.png";
const RU_KNOWLEDGE_DELAY = 5200;
const DING_KNOWLEDGE_PANORAMA = "/assets/kilns/ding-panorama-v3.png";
const DING_FIRED_PANORAMA = "/assets/kilns/ding-knowledge/ding-panorama-fired-v2.png";
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
  lastX: number;
  lastY: number;
  lastTime: number;
  velocityYaw: number;
  velocityPitch: number;
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
  prop?: string;
  occlusion?: "cart";
  atmosphere: string;
  motion: "smoke" | "dust" | "candle";
  audio: string;
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
    image: "/assets/kilns/cizhou-one-shot/01-kiln-yard-meiping-integrated-v4-clean-r4.png",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-smoke-v1.webp",
    motion: "smoke",
    audio: "/assets/kilns/cizhou-traits/audio/02-carved-interior-v1.wav",
    soundscape: "窑体冷却、搬运匣钵与清晨院落风声",
    fact: "观台磁州窑宋金地层出土匣钵、垫饼、支钉等装烧窑具；匣钵是器物入窑烧成时真正所属的保护空间。",
    reconstruction: "窑门外冷却后的出匣检选位置与人物动作，是依据观台窑具和烧造流程完成的克制复原。",
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
    image: "/assets/kilns/cizhou-one-shot/02-northbound-cart-integrated-v5-clean-r5.png",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-dust-v1.webp",
    motion: "dust",
    audio: "/assets/kilns/cizhou-traits/audio/01-black-white-tavern-v1.wav",
    soundscape: "木轮、车板轻震、牲畜脚步与驿路风声",
    fact: "宋代绘画保存了牛车和载重车辆在山路、驿路间运输的图像。重货北行依靠车体、牵引和道路共同完成。",
    reconstruction: "草束护套、填塞与捆扎为综合同时代车载图像和瓷器防碰包装方式的艺术推断。",
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
    vessel: "磁州窑白地黑花梅瓶",
    period: "功用 · 宋代盛酒器",
    image: "/assets/kilns/cizhou-one-shot/03-tavern-meiping-integrated-v4-clean-r5.png",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-candle-v1.webp",
    motion: "candle",
    audio: "/assets/kilns/cizhou-traits/audio/01-black-white-tavern-v1.wav",
    soundscape: "斟酒、酒碗轻碰、低语与店家远声",
    fact: "梅瓶自宋代开始流行，小口、短颈、丰肩、修腹，主要承担储酒功用；酒盏与盏托构成真正的饮酒器物关系。",
    reconstruction: "酒肆木桌、远处客人、酒盏与错位烛火为依据宋金器物功用完成的艺术复原。",
    sourceLabel: "故宫博物院 · 梅瓶",
    sourceUrl: "https://www.dpm.org.cn/lemmas/239389.html",
    hotspots: [
      {
        id: "shape",
        label: "看器形",
        title: "小口丰肩，为盛酒而生",
        body: "梅瓶的小口、短颈、丰肩和向下收敛的腹部适合储存与倾注酒液。自宋代开始，它成为常见的盛酒用具。",
        x: 64,
        y: 61,
      },
      {
        id: "wine-cup",
        label: "看酒盏",
        title: "瓶中储酒，盏上入席",
        body: "桌面只保留一只小酒盏和低矮盏托，与梅瓶组成清楚的储酒、斟酒和饮用关系。",
        x: 13,
        y: 70,
      },
    ],
  },
] as const;

type SphericalPanoramaProps = {
  src: string;
  yaw: number;
  pitch: number;
  motion: KilnPortalMotion;
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

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
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
      const emberImage = new Image();
      emberImage.decoding = "async";
      emberImage.onload = () => {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, emberTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, emberImage);
        canvas.dataset.emberReady = "true";
      };
      emberImage.src = emberOverlaySrc;
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
      const heatMaskImage = new Image();
      heatMaskImage.decoding = "async";
      heatMaskImage.onload = () => {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, heatMaskTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heatMaskImage);
        canvas.dataset.heatMaskReady = "true";
      };
      heatMaskImage.src = heatMaskSrc;
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
    let width = 0;
    let height = 0;
    const startedAt = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let currentActivity = reducedMotion ? 0 : activityRef.current;
    let currentInkHeat = reducedMotion ? inkHeatRef.current : 0;
    let previousInkTarget = inkHeatRef.current;
    let inkHeatStartedAt: number | null = previousInkTarget > 0.5 ? startedAt : null;
    let previousTime = startedAt;
    const render = (time: number) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const nextHeight = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth;
        height = nextHeight;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform1f(yawLocation, (viewRef.current.yaw * Math.PI) / 180);
      gl.uniform1f(pitchLocation, (viewRef.current.pitch * Math.PI) / 180);
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
      window.cancelAnimationFrame(frame);
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
    let lastTime = performance.now();
    let spawnIn = 0.38 + random() * 0.42;
    let smoothedActivity = activityRef.current;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
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
    return () => window.cancelAnimationFrame(frame);
  }, [preset]);

  if (!preset) return null;
  return <canvas ref={canvasRef} className="kiln-embers" aria-hidden="true" />;
}

type ClayModelIntroProps = {
  phase: IntroPhase;
};

function ClayModelIntro({ phase }: ClayModelIntroProps) {
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
        layer.dataset.ready = "true";
        setReady(true);
      },
      undefined,
      () => {
        if (!disposed) layer.dataset.error = "true";
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
        gsap.set(meipingStage, { autoAlpha: 0 });
        setArrivalPhase("ready");
        return;
      }

      setArrivalPhase("transitioning");
      gsap.set(cameraStage, {
        autoAlpha: 0,
        scale: 3.18,
        xPercent: -16.2,
        yPercent: -10.4,
        transformOrigin: "64% 64%",
      });
      gsap.set(firstSceneImage, { autoAlpha: 1 });
      gsap.set(meipingStage, { autoAlpha: 0 });
      gsap.set(meiping, { filter: "brightness(0.72) saturate(0.4) contrast(0.92)" });
      gsap.set([light, tone], { autoAlpha: 0 });
      gsap.set(shadow, { autoAlpha: 0, scaleX: 0.42, scaleY: 0.52 });
      gsap.set(firstSceneAtmosphere, { autoAlpha: 0.08 });
      gsap.set(foregroundHaze, { autoAlpha: 0.72, scale: 1.1 });
      gsap.set(firstSceneShade, { autoAlpha: 1 });

      const timeline = gsap.timeline({
        defaults: { ease: "power1.inOut" },
        onComplete: () => {
          gsap.set([cameraStage, meiping, shadow, light, tone], { clearProps: "all" });
          gsap.set(meipingStage, { autoAlpha: 0 });
          setArrivalPhase("ready");
        },
      });
      arrivalTimelineRef.current = timeline;

      timeline
        .addLabel("sceneReveal", 0)
        .to(cameraStage, { autoAlpha: 1, duration: 1.05, ease: "sine.out" }, "sceneReveal")
        .addLabel("directPullback", 0.9)
        .to(
          cameraStage,
          {
            scale: 1,
            xPercent: 0,
            yPercent: 0,
            duration: 5.2,
            ease: "power1.inOut",
          },
          "directPullback",
        )
        .to(firstSceneAtmosphere, { autoAlpha: 0.24, duration: 5.2, ease: "sine.inOut" }, "directPullback")
        .to(meiping, { filter: "brightness(0.84) saturate(0.46) contrast(0.92)", duration: 2.0, ease: "sine.inOut" }, "directPullback+=3.2")
        .to([light, tone], { autoAlpha: 1, duration: 1.6, ease: "sine.inOut" }, "directPullback+=3.35")
        .to(shadow, { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 1.7, ease: "sine.inOut" }, "directPullback+=3.3");
      timeline.to(foregroundHaze, { autoAlpha: 0.16, scale: 1, duration: 2.4, ease: "sine.inOut" }, "directPullback+=2.8");

      return () => {
        timeline.kill();
        arrivalTimelineRef.current = null;
      };
    },
    { scope: rootRef },
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
    const sceneOriginIndex = activeIndex;

    const updateScenePresentation = () => {
      const width = Math.max(1, viewport.clientWidth);
      const scenePosition = viewport.scrollLeft / width;
      cards.forEach((card) => {
        const distance = (card.offsetLeft - viewport.scrollLeft) / width;
        const magnitude = Math.min(Math.abs(distance), 1);
        card.style.setProperty("--scene-copy-x", `${distance * 10}px`);
        card.style.setProperty("--scene-copy-opacity", `${Math.max(0, 1 - magnitude * 2.4)}`);
        card.style.setProperty("--scene-content-opacity", `${Math.max(0, 1 - magnitude * 2.1)}`);
      });
      sceneLayers.forEach((layer, index) => {
        const distance = Math.abs(scenePosition - index);
        const visibility = clamp(1 - distance, 0, 1);
        layer.style.setProperty("--scene-layer-opacity", `${visibility}`);
        layer.dataset.running = visibility > 0.03 ? "true" : "false";
      });
      sceneSlices.forEach((slice) => {
        const index = Number(slice.dataset.sceneSlice ?? 0);
        const visibility = clamp(1 - Math.abs(scenePosition - index), 0, 1);
        slice.style.setProperty("--scene-weight", `${visibility}`);
        slice.dataset.running = visibility > 0.03 ? "true" : "false";
      });
      const nearestIndex = clamp(Math.round(scenePosition), 0, cards.length - 1);
      root.dataset.scene = cizhouTraits[nearestIndex].id;
    };

    const requestScenePresentation = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScenePresentation);
    };

    const finishSceneChange = (nextIndex: number) => {
      snapping = false;
      moving = false;
      root.dataset.sceneMoving = "false";
      root.dataset.scene = cizhouTraits[nextIndex].id;
      setActiveIndex(nextIndex);
      setActiveHotspot(null);
      updateScenePresentation();
    };

    const settleToNearestScene = () => {
      if (!ready) return;
      const width = Math.max(1, viewport.clientWidth);
      const nextIndex = clamp(Math.round(viewport.scrollLeft / width), 0, cards.length - 1);
      const targetLeft = cards[nextIndex]?.offsetLeft ?? nextIndex * width;
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
      if (!snapping) {
        const previousScene = cards[Math.max(0, sceneOriginIndex - 1)]?.offsetLeft ?? 0;
        const nextScene = cards[Math.min(cards.length - 1, sceneOriginIndex + 1)]?.offsetLeft ?? viewport.scrollWidth;
        const constrainedLeft = clamp(viewport.scrollLeft, previousScene, nextScene);
        if (Math.abs(viewport.scrollLeft - constrainedLeft) > 0.5) viewport.scrollLeft = constrainedLeft;
      }
      requestScenePresentation();
      if (snapping) return;
      if (!moving) {
        moving = true;
        root.dataset.sceneMoving = "true";
        setActiveHotspot(null);
      }
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settleToNearestScene, 34);
    };

    updateScenePresentation();
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(frame);
      sceneTweenRef.current?.kill();
      sceneTweenRef.current = null;
    };
  }, [activeIndex, ready, reducedMotion]);

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
      } else if (audioEnabled && ready) {
        void audioRefs.current[activeIndex]?.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeIndex, audioEnabled, ready]);

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
              <img className="cizhou-scene-layer-image" src={trait.image} alt="" draggable={false} />
              <div className="cizhou-scene-layer-atmosphere" />
              <div className="cizhou-scene-layer-motion" />
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
            src="/assets/kilns/cizhou-one-shot/cizhou-meiping-master-v1.png"
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
              <img className="cizhou-atmosphere-raster cizhou-atmosphere-raster-a" src={trait.atmosphere} alt="" draggable={false} />
              <img className="cizhou-atmosphere-raster cizhou-atmosphere-raster-b" src={trait.atmosphere} alt="" draggable={false} />
              <div className="cizhou-visible-motion" aria-hidden="true" />
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
        {cizhouTraits.map((trait, traitIndex) => (
          <article
            key={trait.id}
            className="cizhou-trait-card"
            data-trait-index={traitIndex}
            data-scene-active={activeIndex === traitIndex}
            aria-hidden={activeIndex !== traitIndex}
            inert={activeIndex !== traitIndex}
          >
            <header className="cizhou-trait-copy">
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
        ))}
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

      {cizhouTraits.map((trait, index) => (
        <audio
          key={trait.id}
          ref={(node) => {
            audioRefs.current[index] = node;
          }}
          src={trait.audio}
          loop
          preload="metadata"
        />
      ))}

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
              <dt>窑口证据</dt>
              <dd>{activeTrait.fact}</dd>
            </div>
            <div>
              <dt>复原边界</dt>
              <dd>{activeTrait.reconstruction}</dd>
            </div>
          </dl>
          <a className="cizhou-trait-source" href={activeTrait.sourceUrl} target="_blank" rel="noreferrer">
            史料来源 · {activeTrait.sourceLabel}
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
  const dragRef = useRef<DragState | null>(null);
  const viewRef = useRef({ yaw: INTRO_KILN.yaw, pitch: INTRO_KILN.pitch });
  const inertiaFrameRef = useRef<number | null>(null);
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

  const startInertia = useCallback(
    (velocityYaw: number, velocityPitch: number) => {
      stopInertia();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      let lastTime = performance.now();
      let velocityX = clamp(velocityYaw, -0.34, 0.34);
      let velocityY = clamp(velocityPitch, -0.26, 0.26);
      const releaseSpeed = Math.hypot(velocityX, velocityY);
      if (releaseSpeed > 0.28) {
        const releaseScale = 0.28 / releaseSpeed;
        velocityX *= releaseScale;
        velocityY *= releaseScale;
      }
      const deceleration = 0.00024;

      const tick = (time: number) => {
        const delta = Math.min(34, time - lastTime);
        lastTime = time;
        const speed = Math.hypot(velocityX, velocityY);

        if (speed < 0.006) {
          inertiaFrameRef.current = null;
          updateNearest(viewRef.current.yaw, viewRef.current.pitch);
          return;
        }

        const nextYaw = viewRef.current.yaw + velocityX * delta;
        const nextPitch = viewRef.current.pitch + velocityY * delta;
        updateView(nextYaw, nextPitch);
        updateNearest(nextYaw, nextPitch);

        const nextSpeed = Math.max(0, speed - deceleration * delta);
        if (nextSpeed === 0) {
          inertiaFrameRef.current = null;
          return;
        }
        const velocityScale = nextSpeed / speed;
        velocityX *= velocityScale;
        velocityY *= velocityScale;
        inertiaFrameRef.current = window.requestAnimationFrame(tick);
      };

      inertiaFrameRef.current = window.requestAnimationFrame(tick);
    },
    [stopInertia, updateNearest, updateView],
  );

  useEffect(() => {
    if (keyboard.visible) keyboard.hide();
    return () => {
      stopInertia();
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
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setInspecting(false);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startYaw: viewRef.current.yaw,
      startPitch: viewRef.current.pitch,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocityYaw: 0,
      velocityPitch: 0,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (knowledgePhase !== "idle") return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    const deltaTime = Math.max(8, now - drag.lastTime);
    const totalX = event.clientX - drag.startX;
    const totalY = event.clientY - drag.startY;
    const nextYaw = drag.startYaw - totalX * 0.34;
    const nextPitch = drag.startPitch + totalY * 0.23;

    const sampledYaw = (-(event.clientX - drag.lastX) * 0.34) / deltaTime;
    const sampledPitch = ((event.clientY - drag.lastY) * 0.23) / deltaTime;
    drag.velocityYaw = drag.velocityYaw * 0.52 + sampledYaw * 0.48;
    drag.velocityPitch = drag.velocityPitch * 0.52 + sampledPitch * 0.48;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    drag.moved ||= Math.hypot(totalX, totalY) > 7;
    updateView(nextYaw, nextPitch);
    updateNearest(nextYaw, nextPitch);
  };

  const endPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
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
      startInertia(drag.velocityYaw, drag.velocityPitch);
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
        : 'url("/assets/kilns/kiln-sphere-atlas.png")',
    } as CSSProperties;
  }, [activeKiln, pitch, yaw]);

  const navigateByKey = (key: string) => {
    if (knowledgePhase !== "idle") return;
    const current = kilns[activeIndex];
    const direction = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    }[key];
    if (!direction) return;

    let bestIndex = activeIndex;
    let bestScore = Number.POSITIVE_INFINITY;
    kilns.forEach((kiln, index) => {
      if (index === activeIndex) return;
      const dx = normalizeYaw(kiln.yaw - current.yaw);
      const dy = kiln.pitch - current.pitch;
      const directional = dx * direction.x + dy * direction.y;
      if (directional <= 4) return;
      const cross = Math.abs(dx * direction.y - dy * direction.x);
      const score = cross * 2.2 + Math.hypot(dx, dy) * 0.35;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    navigateTo(bestIndex);
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
            disabled={introPhase !== "idle"}
            aria-label="触碰开孔泥坯，旋转进入八窑世界"
            onClick={enterKilnWorld}
            autoFocus
          >
            <span className="kiln-intro-wheel" aria-hidden="true" />
          </button>
          <ClayModelIntro phase={introPhase} />
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
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={enterActiveKiln}
            >
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
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={enterActiveKiln}
            >
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
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
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

        {geKnowledgeOpen ? (
          <section
            className="ge-knowledge"
            data-phase={knowledgePhase}
            aria-hidden={!geKnowledgeOpen}
            inert={!geKnowledgeOpen}
          >
            <div className="ge-knowledge-glaze" aria-hidden="true">
              <img src={GE_KNOWLEDGE_PANORAMA} alt="" draggable={false} />
            </div>

            <div className="ge-knowledge-copy">
              <span>厚釉开片 · 裂而成章</span>
              <h2>金丝交错<br />铁线纵横</h2>
              <p>哥窑釉层肥厚温润，烧成后的温度变化使釉与胎产生不同收缩。粗黑的大开片如铁线，细密的褐黄小开片如金丝，两重纹路交织成独有的釉面秩序。</p>
              <div className="ge-knowledge-tags" aria-label="哥窑核心知识点">
                <i>厚釉</i>
                <i>金丝铁线</i>
                <i>紫口铁足</i>
              </div>
            </div>

            <button
              type="button"
              className="ge-knowledge-back"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={leaveKilnKnowledge}
            >
              返回窑中
            </button>

            <div className="ge-knowledge-index" aria-hidden="true">
              <span>04</span>
              <i />
              <small>哥窑 · 厚釉与开片</small>
            </div>
          </section>
        ) : null}

        {ruKnowledgeOpen ? (
          <section
            className="guan-knowledge ru-knowledge"
            data-phase={knowledgePhase}
            aria-hidden={!ruKnowledgeOpen}
            inert={!ruKnowledgeOpen}
          >
            <div className="guan-knowledge-glaze" aria-hidden="true">
              <img src={RU_KNOWLEDGE_PANORAMA} alt="" draggable={false} />
            </div>

            <div className="guan-knowledge-copy">
              <span>北宋汝瓷 · 雨过天青</span>
              <h2>云破透火<br />釉光凝结</h2>
              <p>汝窑天青釉在高温中由铁呈色，厚薄不同的釉层让冷青、月白与暖灰在同一表面缓慢过渡。烧成后，稀疏开片藏入半透明釉层，形成雨过天青般温润而含蓄的光泽。</p>
              <div className="guan-knowledge-tags" aria-label="汝窑核心知识点">
                <i>雨过天青</i>
                <i>蟹爪开片</i>
                <i>满釉支烧</i>
              </div>
            </div>

            <button
              type="button"
              className="guan-knowledge-back"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={leaveKilnKnowledge}
            >
              返回窑中
            </button>

            <div className="guan-knowledge-index" aria-hidden="true">
              <span>02</span>
              <i />
              <small>汝窑 · 天青与开片</small>
            </div>
          </section>
        ) : null}

        {guanKnowledgeOpen ? (
          <section
            className="guan-knowledge"
            data-phase={knowledgePhase}
            aria-hidden={!guanKnowledgeOpen}
            inert={!guanKnowledgeOpen}
          >
            <div className="guan-knowledge-glaze" aria-hidden="true">
              <img src={GUAN_KNOWLEDGE_PANORAMA} alt="" draggable={false} />
            </div>

            <div className="guan-knowledge-copy">
              <span>南宋官瓷 · 青玉凝光</span>
              <h2>冰纹承火<br />厚釉如玉</h2>
              <p>官窑以肥厚粉青釉见长。烧成时，含铁胎骨藏在半透明釉层之下，大片冰裂纹划分出深浅不同的釉面；口沿釉薄处透出紫黑胎色，圈足露胎则呈铁褐。</p>
              <div className="guan-knowledge-tags" aria-label="官窑核心知识点">
                <i>粉青釉</i>
                <i>冰裂纹</i>
                <i>紫口铁足</i>
              </div>
            </div>

            <button
              type="button"
              className="guan-knowledge-back"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={leaveKilnKnowledge}
            >
              返回窑中
            </button>

            <div className="guan-knowledge-index" aria-hidden="true">
              <span>05</span>
              <i />
              <small>官窑 · 厚釉与冰纹</small>
            </div>
          </section>
        ) : null}

        {longquanKnowledgeOpen ? (
          <section
            className="guan-knowledge longquan-knowledge"
            data-phase={knowledgePhase}
            aria-hidden={!longquanKnowledgeOpen}
            inert={!longquanKnowledgeOpen}
          >
            <div className="guan-knowledge-glaze" aria-hidden="true">
              <img src={LONGQUAN_KNOWLEDGE_PANORAMA} alt="" draggable={false} />
            </div>

            <div className="guan-knowledge-copy">
              <span>南宋青瓷 · 青玉藏火</span>
              <h2>釉海藏火<br />青玉将成</h2>
              <p>龙泉窑以粉青、梅子青厚釉闻名。还原焰中，含铁釉料在高温里熔融流动，薄处透亮，厚处温润；细密釉泡与层层积釉共同形成如青玉般深厚柔和的光泽。</p>
              <div className="guan-knowledge-tags" aria-label="龙泉窑核心知识点">
                <i>梅子青</i>
                <i>厚釉</i>
                <i>还原焰</i>
              </div>
            </div>

            <button
              type="button"
              className="guan-knowledge-back"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={leaveKilnKnowledge}
            >
              返回窑中
            </button>

            <div className="guan-knowledge-index" aria-hidden="true">
              <span>06</span>
              <i />
              <small>龙泉窑 · 厚釉与还原焰</small>
            </div>
          </section>
        ) : null}

        {dingKnowledgeOpen ? (
          <section
            className="guan-knowledge ding-knowledge"
            data-phase={knowledgePhase}
            aria-hidden={!dingKnowledgeOpen}
            inert={!dingKnowledgeOpen}
          >
            <div className="guan-knowledge-glaze" aria-hidden="true">
              <img src={DING_KNOWLEDGE_PANORAMA} alt="" draggable={false} />
            </div>

            <div className="guan-knowledge-copy">
              <span>北宋白瓷 · 印花藏锋</span>
              <h2>白釉纳火<br />印花凝光</h2>
              <p>定窑以温润象牙白釉著称，刻花、划花与印花让浅深有序的纹样藏在釉层之下。窑火熔融白釉，凹处积釉更深，花瓣与卷草因此在柔和明暗中显现出细腻层次。</p>
              <div className="guan-knowledge-tags" aria-label="定窑核心知识点">
                <i>象牙白釉</i>
                <i>印花</i>
                <i>覆烧芒口</i>
              </div>
            </div>

            <button
              type="button"
              className="guan-knowledge-back"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={leaveKilnKnowledge}
            >
              返回窑中
            </button>

            <div className="guan-knowledge-index" aria-hidden="true">
              <span>08</span>
              <i />
              <small>定窑 · 白釉与印花</small>
            </div>
          </section>
        ) : null}

        {cizhouKnowledgeOpen ? (
          <CizhouKnowledgeExperience onBack={leaveKilnKnowledge} />
        ) : null}

        {junKnowledgeOpen ? (
          <section
            className="jun-knowledge"
            data-phase={knowledgePhase}
            aria-hidden={!junKnowledgeOpen}
            inert={!junKnowledgeOpen}
          >
            <div className="jun-knowledge-glaze" aria-hidden="true">
              <img src={JUN_KILNCHANGE_PANORAMA} alt="" draggable={false} />
            </div>

            <div className="jun-knowledge-copy">
              <span>高温窑变 · 云霞入釉</span>
              <h2>入窑一色<br />出窑万彩</h2>
              <p>钧窑以乳浊青釉为底，高温让铜红与紫斑在釉层中自然生成。天蓝、月白与玫瑰紫彼此交融，每一次烧成都留下不可复制的云霞。</p>
              <div className="jun-knowledge-tags" aria-label="钧窑核心知识点">
                <i>乳浊釉</i>
                <i>铜红斑</i>
                <i>窑变</i>
              </div>
            </div>

            <button
              type="button"
              className="jun-knowledge-back"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={leaveKilnKnowledge}
            >
              返回窑中
            </button>

            <div className="jun-knowledge-index" aria-hidden="true">
              <span>02</span>
              <i />
              <small>钧窑 · 釉色与窑变</small>
            </div>
          </section>
        ) : null}

        {yaozhouKnowledgeOpen ? (
          <section
            className="yaozhou-knowledge"
            data-phase={knowledgePhase}
            aria-hidden={!yaozhouKnowledgeOpen}
            inert={!yaozhouKnowledgeOpen}
          >
            <div className="yaozhou-knowledge-glaze" aria-hidden="true">
              <img src={YAOZHOU_GLAZE_PANORAMA} alt="" draggable={false} />
            </div>

            <div className="yaozhou-knowledge-copy">
              <span>北方青瓷 · 刀下生花</span>
              <h2>刀锋入泥<br />釉随痕聚</h2>
              <p>耀州窑以刚劲流畅的刻花见长。烧成时，青釉在深刻凹槽中自然积聚，形成浅处黄绿、深处墨绿的层次，让牡丹纹在一层透明釉光中显出起伏。</p>
              <div className="yaozhou-knowledge-tags" aria-label="耀州窑核心知识点">
                <i>刻花</i>
                <i>积釉</i>
                <i>橄榄青</i>
              </div>
            </div>

            <button
              type="button"
              className="yaozhou-knowledge-back"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={leaveKilnKnowledge}
            >
              返回窑中
            </button>

            <div className="yaozhou-knowledge-index" aria-hidden="true">
              <span>03</span>
              <i />
              <small>耀州窑 · 刻花与积釉</small>
            </div>
          </section>
        ) : null}

      </main>
    </MobileScroll>
  );
}
