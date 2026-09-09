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
import { BottomSheet, Carousel, MobileScroll, useKeyboard } from "./mobile";
import { KilnUiIcon } from "./KilnUiIcon";

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
    feature: "乳浊厚釉 · 金丝铁线",
    description: "米黄与灰青之间，深浅开片交织成纹，因而有了“金丝铁线”的称谓。传世哥窑以这份含蓄的釉面层次为人珍视，器物留存至今，其年代与窑址归属仍待研究。",
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
    vessel: "莲花式温碗",
    feature: "天青釉色 · 满釉支烧",
    description: "北宋晚期，河南宝丰清凉寺的窑火烧成了供御汝瓷。天青釉覆盖器身，细小支钉在底部留下痕迹；花瓣般的温碗，则把柔和的器形带进了酒事。",
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
    vessel: "琮式瓶",
    feature: "粉青厚釉 · 仿古器形",
    description: "南宋官窑以厚釉与仿古器形见长。铜器的弦纹、玉器的轮廓，经泥与火化为青瓷，凝润釉色之下，仍可辨认古器的端庄气度。杭州郊坛下遗址，保存着这一制瓷传统的踪迹。",
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
    vessel: "白地黑花梅瓶",
    feature: "白地黑花 · 彩绘剔划",
    description: "一层白色化妆土衬起黑彩，花叶在笔锋与刀痕之间舒展。磁州窑以河北磁县观台、邯郸彭城等窑场为代表，宋金元时期的白地黑花，将鲜明而朴实的趣味留在日用器物之上。",
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
    feature: "粉青梅子青 · 厚釉青瓷",
    description: "粉青柔和，梅子青青翠，龙泉青瓷的色泽蕴于凝厚釉层之中。南宋至元代，浙江龙泉一带窑场兴盛，素面瓶的圆转、贴花洗的起伏，都在一色青釉里各得其韵。",
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
    description: "青蓝乳浊釉中，铜红晕开深浅不一的紫色，构成钧瓷鲜明的面貌。河南禹州一带的窑工以配釉与烧成成就这份变化；日用碗盘与陈设花器，则各有不同的时代线索。",
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
    feature: "橄榄青釉 · 刻花印花",
    description: "陕西铜川黄堡的窑工以刀刻花，让花叶随器壁舒展。凹处积釉较深，凸处色泽稍浅，同一层青釉便有了浓淡。北宋耀州窑的刻花与印花，由此呈现鲜明的装饰风格。",
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
    feature: "牙白釉色 · 刻划模印",
    description: "河北曲阳的定窑以白瓷著称，宋金时期尤为兴盛。牙白釉色衬出刻划与印纹的细部，孩儿枕又将伏卧的童子塑入寝具，素净之中自有生趣。",
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
  ge: "轻触焰心 · 识哥瓷",
  ru: "轻触焰心 · 识汝瓷",
  guan: "轻触焰心 · 识官瓷",
  cizhou: "轻触焰心 · 识磁州",
  longquan: "轻触焰心 · 识龙泉",
  jun: "轻触焰心 · 识钧瓷",
  yaozhou: "轻触焰心 · 识耀州",
  ding: "轻触焰心 · 识定瓷",
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

const KILN_VIEW_YAW_LIMIT = 22;
const KILN_VIEW_PITCH_LIMIT = 14;
const KILN_VIEW_EDGE_OVERSHOOT = 3.2;

const applyKilnViewResistance = (offset: number, limit: number) => {
  const magnitude = Math.abs(offset);
  if (magnitude <= limit) return offset;
  const overshoot = Math.min(KILN_VIEW_EDGE_OVERSHOOT, (magnitude - limit) * 0.1);
  return Math.sign(offset) * (limit + overshoot);
};

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
  axis: "x" | "y" | null;
  targetIndex: number | null;
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
  additionalSources?: readonly { label: string; url: string }[];
  hotspots: readonly CizhouTraitHotspot[];
};

const cizhouTraits: readonly CizhouTrait[] = [
  {
    id: "kiln-yard",
    number: "01",
    title: "出匣初明",
    tagline: "白地承黑彩，花叶出窑新。",
    vessel: "磁州窑白地黑花梅瓶",
    period: "宋金时期",
    image: "/assets/kilns/cizhou-one-shot/01-kiln-yard-closeup-song-v4.webp",
    video: "/assets/kilns/cizhou-one-shot/cizhou-vase-in-kiln-interior-v1.mp4",
    videoLoop: "trim",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-smoke-v1.webp",
    motion: "none",
    audio: "/assets/kilns/cizhou-traits/audio/02-carved-interior-v1.m4a",
    soundscape: "窑场风声与低缓炉声",
    fact: "白地黑花通常是在坯体上施白色化妆土，以含铁彩料绘纹，再罩透明釉烧成。化妆土是细土调成的泥浆，用于改善器表底色，并不是白色釉料。",
    reconstruction: "画面表现烧成后的窑边检看。梅瓶、窑具与工作台的组合为艺术复原，不是某次发掘的原位记录；入口火焰与纹样变化也不是实际烧造过程的逐步演示。",
    sourceLabel: "故宫博物院 · 磁州窑白地黑花花卉纹梅瓶（同类工艺）",
    sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227567.html",
    hotspots: [
      {
        id: "saggar",
        label: "看黑彩",
        title: "白地黑花",
        body: "梅瓶上的黑花藏在透明釉下。工匠先以细泥调成的白色化妆土铺底，再用含铁彩料绘出花叶，罩釉烧成。白地衬起深色笔意，枝蔓的转折与疏密，至今仍留着落笔时的意趣。",
        x: 64,
        y: 61,
      },
      {
        id: "firing-pad",
        label: "看梅瓶",
        title: "梅瓶之形",
        body: "小口、短颈、丰肩，腹部向下渐收，是梅瓶鲜明的轮廓。宋代这类瓶已有盛酒用途，器名虽带一个“梅”字，身世却不止花事。丰润的肩腹，也为白地黑花留下一片从容舒展的天地。",
        x: 68,
        y: 72,
      },
    ],
  },
  {
    id: "northbound-cart",
    number: "02",
    title: "装载启程",
    tagline: "草衬轻拥，瓶上花枝如故。",
    vessel: "磁州窑白地黑花梅瓶",
    period: "白地黑花瓷",
    image: "/assets/kilns/cizhou-one-shot/02-cizhou-land-loading-v3-meiping-tree.webp",
    video: "/assets/kilns/cizhou-one-shot/02-cizhou-land-loading-v3-meiping-tree.mp4",
    videoLoop: "trim",
    audioSource: "video",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-dust-v1.webp",
    motion: "none",
    soundscape: "窑场院落微风、树叶沙沙、竹篾与草衬轻响",
    fact: "磁州窑的影响不限于一个窑场。河南、山西等地多个窑场也烧造白地黑花等品种，形成具有共同装饰特征的磁州窑系；这不等于所有同类器都产自磁县。",
    reconstruction: "车上的梅瓶以草衬和竹编承护，表现封装前的备运状态。具体包装、行车方向与目的地均为情境推演，没有证据将它们认定为磁州窑固定的运输制度。",
    sourceLabel: "中国国家博物馆 · 白地黑花开光鱼纹梅瓶（窑系资料）",
    sourceUrl: "https://www.chnmuseum.cn/zp/zpml/csp/202203/t20220309_254241.shtml",
    hotspots: [
      {
        id: "cart-load",
        label: "看车载",
        title: "瓷行四方",
        body: "白地黑花不只见于磁县一地，河南、山西等地的窑场也曾烧造相近品种，共同构成磁州窑系的面貌。相似的花叶留在不同器物上，细察胎釉与笔法，仍能读出各自的性情。",
        x: 64,
        y: 61,
      },
      {
        id: "packing",
        label: "看包裹",
        title: "柔草护瓷",
        body: "梅瓶肩腹丰润，口颈细小，坚硬的瓷质也需轻放。草衬填在瓶身与竹编之间，分隔相触的硬面，绳索再将外部货包束稳。草木的柔韧，恰好护住了瓷器的清脆。",
        x: 68,
        y: 78,
      },
    ],
  },
  {
    id: "tavern",
    number: "03",
    title: "酒肆入席",
    tagline: "瓶腹藏花，席间留韵。",
    vessel: "磁州窑白地剔划黑花玉壶春瓶",
    period: "北宋器式",
    image: "/assets/kilns/cizhou-one-shot/03-wine-shop-yuhuchunping-reference-with-white-black-bowl-v6.webp",
    video: "/assets/kilns/cizhou-one-shot/cizhou-tavern-generated-v2.mp4",
    videoLoop: "trim",
    videoStart: 0,
    audioSource: "video",
    atmosphere: "/assets/kilns/cizhou-one-shot/atmosphere-candle-v1.webp",
    motion: "none",
    soundscape: "门外微风、酒旗布面轻响、树叶沙沙与稀疏鸟鸣",
    fact: "主瓶参考中国国家博物馆藏北宋白地剔划黑花玉壶春瓶：口外撇，颈细长，腹部下垂，花叶以剔划技法表现。它与前两幕的梅瓶是不同器式，不能混称。",
    reconstruction: "酒肆与小碗用于说明器物进入生活的可能语境，不表示馆藏原物曾在此使用。小碗是依据白地黑花工艺配置的同类器，不对应一件已确认的馆藏原件。",
    sourceLabel: "中国国家博物馆 · 磁州窑白地剔划黑花玉壶春瓶",
    sourceUrl: "https://www.chnmuseum.cn/zp/zpml/csp/202203/t20220315_254286.shtml",
    additionalSources: [{ label: "故宫博物院 · 白地黑花工艺", url: "https://www.dpm.org.cn/collection/ceramic/227567.html" }],
    hotspots: [
      {
        id: "shape",
        label: "看器形",
        title: "刀笔留花",
        body: "玉壶春瓶口沿外撇，细颈渐接下垂的腹部，与丰肩短颈的梅瓶各有姿态。这件器式以剔划黑花见长，花叶边缘留有刀工的转折，黑白相间处，线条既清劲又婉转。",
        x: 64,
        y: 61,
      },
      {
        id: "wine-cup",
        label: "看小碗",
        title: "黑白相映",
        body: "一只白地黑彩小碗，容得下日常饮食，也容得下简练的花叶。彩绘以笔施料，剔划则用工具处理装饰层；同样的黑白相映，在磁州窑工手中，可以写成不同的面貌。",
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
  additionalSources?: readonly { label: string; url: string }[];
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
        tagline: "鱼耳相对，古意静生。",
        vessel: "传世哥窑鱼耳炉",
        period: "传世哥窑",
        image: "/assets/kilns/ge-one-shot/01-fish-ear-censer-palace-v1.webp",
        video: "/assets/kilns/ge-one-shot/01-fish-ear-censer-palace-v2-loop.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "鱼耳炉借鉴古代青铜簋的形制，以鱼形双耳、鼓腹和圈足构成轮廓。传世哥窑器多见灰青或米黄色乳浊釉；其烧造年代和窑址归属仍是研究议题。",
        reconstruction: "室内焚香情境为艺术复原，不指认某处宋代宫室，也不据此确认传世哥窑的产地。器物名称沿用传世品分类，不能视为窑址已确定。",
        sourceLabel: "故宫博物院 · 哥窑青釉鱼耳炉（同类器）",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/226733.html",
        additionalSources: [{ label: "故宫博物院 · 哥窑学术研讨会", url: "https://www.dpm.org.cn/research_institute/activity/detail/250550.html" }],
        hotspots: [
          {
            id: "fish-ears",
            label: "看鱼耳",
            title: "鱼耳承古",
            body: "鱼形双耳分列鼓腹两侧，圈足稳稳承起炉身，轮廓承袭古代青铜簋的意味。原属盛食礼器的形制，后来也化作焚香之器。乳浊釉与细密开片相映，是传世哥窑的特色；其年代与窑址归属，仍有待进一步厘清。",
            x: 52,
            y: 66,
          },
        ],
      },
      {
        id: "long-neck-crackle",
        number: "02",
        title: "开片之纹",
        tagline: "深浅成纹，疏密有致。",
        vessel: "传世哥窑长颈瓶",
        period: "传世哥窑",
        image: "/assets/kilns/ge-one-shot/02-long-neck-bottle-crackle-v1.webp",
        video: "/assets/kilns/ge-one-shot/02-long-neck-bottle-crackle-v2-loop.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "开片是釉层中的裂纹，与胎、釉热膨胀及冷却收缩的差异有关。“金丝铁线”形容细浅与粗深纹路交织的外观，不是以金丝或铁线镶入器表。",
        reconstruction: "长颈瓶与木案构成近观釉面的赏鉴情境，不对应原物的确切使用地点。光线变化帮助辨认已有纹路，不表示裂纹正在受热生成。",
        sourceLabel: "故宫博物院 · 金丝铁线：哥窑瓷器展",
        sourceUrl: "https://www.dpm.org.cn/show/246117.html",
        hotspots: [
          {
            id: "double-crackle",
            label: "看开片",
            title: "金丝铁线",
            body: "瓶身粗深的纹路与细浅的开片交织，因色泽与层次而有“金丝铁线”之称。它们是胎釉冷却收缩差异留下的釉层裂纹，并非金属镶嵌。纹路行至颈腹转折处，自有疏密，素面也因而耐看。",
            x: 51,
            y: 61,
          },
        ],
      },
      {
        id: "lobed-bowl",
        number: "03",
        title: "紫口铁足",
        tagline: "一线深沿，半碗含青。",
        vessel: "传世哥窑葵口碗",
        period: "传世哥窑",
        image: "/assets/kilns/ge-one-shot/03-lobed-bowl-purple-rim-v1.webp",
        video: "/assets/kilns/ge-one-shot/03-lobed-bowl-purple-rim-v2-loop.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "部分哥窑及官窑器的薄釉口沿透出深色胎骨，未施釉的足端也呈深色，常以“紫口铁足”概括。这一外观并非哥窑独有，传世哥窑的胎色也并不完全一致。",
        reconstruction: "葵口碗置于生活化室内，便于比较口沿、釉面与圈足。陈设属于艺术复原，不据此确认它曾作何种具体用途或属于哪一处宫廷空间。",
        sourceLabel: "故宫博物院 · 官窑青釉圆洗（紫口铁足释义）",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/226749.html",
        additionalSources: [{ label: "故宫博物院 · 哥窑瓷器展", url: "https://www.dpm.org.cn/show/246117.html" }],
        hotspots: [
          {
            id: "rim-foot",
            label: "看口足",
            title: "口足之间",
            body: "葵瓣口沿釉层较薄，隐约透出深色胎骨，圈足底缘的露胎处也见深色，故有“紫口铁足”的说法。它并非哥窑独有，却让浅淡釉色有了清楚的收束。沿口至足，一器的胎与釉，在深浅之间相互映衬。",
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
        tagline: "雨歇天青，釉色初见。",
        vessel: "北宋汝窑青釉莲花式温碗",
        period: "北宋晚期",
        image: "/assets/kilns/ru-one-shot/01-kiln-after-rain-integrated-v2.webp",
        motion: "ru-after-rain",
        fact: "台北故宫博物院藏莲花式温碗为北宋汝窑器，底部留有五处支痕；河南宝丰清凉寺窑址亦发现同类器标本。满釉支烧以细小支点承托器物，烧后会留下接触痕迹。",
        reconstruction: "窑场检选为艺术复原，不对应这件温碗的出窑记录。雨后天气是环境设定，不能解释为天青釉必须在雨天烧成。支钉痕位于器底，本镜头没有展示底部。",
        sourceLabel: "台北故宫博物院 · 汝窑莲花式温碗",
        sourceUrl: "https://www.npm.gov.tw/Articles.aspx?l=2&sno=04012814",
        hotspots: [
          {
            id: "glaze",
            label: "看釉色",
            title: "天青初见",
            body: "汝瓷的天青色蕴于烧成后的釉层，并不取决于开窑时的天气。这类莲花式温碗以细小支钉承托烧造，使器表尽可能覆釉，底部留下轻微支痕。温润的青色之外，那些细小接触处，也记着窑工的用心。",
            x: 67,
            y: 72,
          },
        ],
      },
      {
        id: "river-tribute",
        number: "02",
        title: "水路运瓷",
        tagline: "水声在岸，瓷色藏箱。",
        vessel: "北宋汝窑器物运输情境",
        period: "汝瓷水运意境",
        image: "/assets/kilns/ru-one-shot/02-river-transport-no-people-v2.webp",
        video: "/assets/kilns/ru-one-shot/02-river-transport-no-people-v2.mp4",
        videoLoop: "trim",
        motion: "ru-river",
        fact: "传世汝器与清凉寺窑址出土标本的比较，是认识供御汝瓷的重要依据。器形、胎釉、装烧痕迹可以相互参照，但这些材料不能直接还原每一件器物的运送路线。",
        reconstruction: "码头、货船与包装表现离窑后的水运情境，不是某次宫廷贡运的实录。本篇不将汴水、指定目的地或具体货箱结构认定为已证实的汝瓷运输路线与制度。",
        sourceLabel: "故宫博物院 · 汝窑",
        sourceUrl: "https://www.dpm.org.cn/lemmas/239400.html",
        additionalSources: [{ label: "台北故宫博物院 · 传世温碗与清凉寺同类器", url: "https://www.npm.gov.tw/Articles.aspx?l=2&sno=04012814" }],
        hotspots: [
          {
            id: "packing",
            label: "看装运",
            title: "护瓷远行",
            body: "船板随水轻动，货物却需要安稳。易碎的瓷器经由承托、分隔与捆束，才能减少彼此碰撞。北宋晚期汝瓷曾为宫廷烧造，今天可由清凉寺窑址与传世器相互参照，至于一器曾循哪段水路而行，仍有未解的空白。",
            x: 68,
            y: 82,
          },
        ],
      },
      {
        id: "palace-study",
        number: "03",
        title: "清供照影",
        tagline: "莲瓣含青，窗前凝静。",
        vessel: "北宋汝窑青釉莲花式温碗",
        period: "北宋晚期",
        image: "/assets/kilns/ru-one-shot/03-palace-study-sunlight-v1.webp",
        motion: "ru-window",
        fact: "温碗是一类与执壶配合使用的酒器，可借碗中的温水为壶内酒液保温。莲花式温碗将口沿与碗壁做成连续瓣形，不只是普通饭碗或专用插花器。",
        reconstruction: "窗前单独陈放温碗，是为了展示瓣形和釉色，并未复原完整温酒操作。画面没有执壶，不应据此把馆藏温碗改释为书斋专用清供。",
        sourceLabel: "台北故宫博物院 · 莲花式温碗的器形与用途",
        sourceUrl: "https://www.npm.gov.tw/Articles.aspx?l=2&sno=04012814",
        hotspots: [
          {
            id: "quiet-light",
            label: "看莲瓣",
            title: "莲瓣温酒",
            body: "起伏的口沿延伸为层层瓣形，莲花的轮廓被收进一只温碗。宋代温碗可与执壶配合，以碗中温水暖护壶内酒液。柔和的青釉覆在凹凸器壁上，花形、器用与釉色，在一器之中相合。",
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
        tagline: "牙白映衣褶，童颜带浅笑。",
        vessel: "北宋定窑白釉孩儿枕",
        period: "北宋",
        image: "/assets/kilns/ding-one-shot/01-kiln-inspection-firelight-v1.webp",
        audio: "/assets/kilns/ding-one-shot/audio/01-kiln-inspection-ambience-v1.m4a",
        motion: "ding-ash",
        fact: "定窑位于河北曲阳，以白瓷著称。孩儿枕把人物造型与牙白釉结合，衣饰和榻座还有印纹等装饰；它不是以白色化妆土衬黑花的磁州窑产品。",
        reconstruction: "画面为窑边成品检看情境，不是馆藏孩儿枕的确切出窑现场。背景炉光与火星仅交代窑场环境，前景成品并非直接放在火中再次烧制。",
        sourceLabel: "故宫博物院 · 定窑白釉孩儿枕",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/226760.html",
        hotspots: [
          {
            id: "ivory-glaze",
            label: "看白釉",
            title: "牙白生趣",
            body: "定窑孩儿枕以略带暖意的白釉衬出面容与衣褶，光泽随形体轻轻转折。河北曲阳的窑工善用刻划、印纹等装饰，少了浓彩，细部仍自有层次。一个伏卧的姿态，也让素净白瓷添了亲切的生趣。",
            x: 66,
            y: 62,
          },
        ],
      },
      {
        id: "packing-hall",
        number: "02",
        title: "草衬护器",
        tagline: "草间安卧，衣上花纹犹清。",
        vessel: "北宋定窑白釉孩儿枕",
        period: "北宋",
        image: "/assets/kilns/ding-one-shot/02-packing-decoration-integrated-v1.webp",
        video: "/assets/kilns/ding-one-shot/02-bamboo-blind-seamless-v4.mp4",
        videoLoop: "trim",
        motion: "ding-packing",
        fact: "故宫藏孩儿枕将人物塑形与衣饰、榻座的纹样结合。塑造枕体与压印花纹是不同环节，均需在烧成前完成；不能在烧好的瓷枕上再压出凹凸印花。",
        reconstruction: "竹编护架和草衬表现成品暂置、准备搬运的状态，具体结构为艺术复原。器表印纹在烧造前制作，本幕展示的是烧成后的保护与搬运情境。",
        sourceLabel: "故宫博物院 · 定窑孩儿枕",
        sourceUrl: "https://intl.dpm.org.cn/Ceramicsis/64068.html",
        hotspots: [
          {
            id: "relief",
            label: "看纹饰",
            title: "衣上纹样",
            body: "孩童的姿态与衣褶由立体塑形而成，衣饰、榻座上的重复花纹又见印纹之巧。这些细部都在烧成前完成，出窑后便凝定于白釉之下。柔草承住枕体，也护住了手足与衣角细小的起伏。",
            x: 66,
            y: 62,
          },
        ],
      },
      {
        id: "sleeping-chamber",
        number: "03",
        title: "枕上清凉",
        tagline: "灯影渐低，童子静卧。",
        vessel: "北宋定窑白釉孩儿枕",
        period: "北宋",
        image: "/assets/kilns/ding-one-shot/03-sleeping-chamber-integrated-v1.webp",
        video: "/assets/kilns/ding-one-shot/03-sleeping-chamber-candle-v1-no-music.mp4",
        videoLoop: "trim",
        audio: "/assets/kilns/cizhou-traits/audio/03-painted-pillow-night-v1.m4a",
        motion: "ding-lamp",
        fact: "宋代多处窑场烧造瓷枕，造型包括几何形、人物形和动物形。孩儿枕以伏卧孩童的背部作为承枕面；故宫藏品底部未施釉，并留有通气孔。",
        reconstruction: "寝榻与灯盏表现瓷枕的寝居用途，不对应原物的使用者或居所。文献中关于瓷枕清凉、明目的说法属于古人认识，不能当作已证实的保健功效。",
        sourceLabel: "故宫博物院 · 定窑白釉孩儿枕",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/226760.html",
        hotspots: [
          {
            id: "pillow-use",
            label: "看枕用",
            title: "枕中童趣",
            body: "孩儿枕既是人物塑像，也是寝具。童子伏卧，背部微微隆起，正是承枕之处；衣褶与榻座的纹饰，让日常起居也有可赏的细节。宋代瓷枕形制多样，这一件以孩童的安然姿态，留下寝居中的温柔趣味。",
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
        tagline: "窑火已歇，粉青渐明。",
        vessel: "官窑粉青釉弦纹瓶与青釉洗",
        period: "南宋",
        image: "/assets/kilns/guan-one-shot/01-jiaotanxia-finished-goods-house-lived-in-v10.webp",
        video: "/assets/kilns/guan-one-shot/01-finished-goods-house-v10.mp4",
        videoLoop: "native",
        motion: "guan-storage",
        fact: "郊坛下窑址发现制坯、素烧、施釉和成品收置等生产遗迹。参考瓶以弦纹装饰长颈与圆腹，足部有穿带孔；瓶与洗的造型、釉层各有观察重点。",
        reconstruction: "以郊坛下作坊资料为背景复原成品收置空间。器物摆位、草垫和室内光线为艺术安排，不将这件传世瓶认定为该房间的原位出土物。",
        sourceLabel: "杭州南宋官窑博物馆 · 郊坛下遗址介绍（杭州网刊载）",
        sourceUrl: "https://z.hangzhou.com.cn/2020/rwwhql/content/content_7746554.htm",
        additionalSources: [{ label: "故宫博物院 · 官窑粉青釉弦纹瓶", url: "https://www.dpm.org.cn/collection/ceramic/226843.html" }, { label: "故宫博物院 · 官窑青釉圆洗", url: "https://www.dpm.org.cn/collection/ceramic/226749.html" }],
        hotspots: [
          {
            id: "finished-glaze",
            label: "看弦纹",
            title: "弦纹含青",
            body: "一圈圈弦纹沿瓶颈与腹部展开，借来古铜器的秩序，又被粉青釉柔和包覆。南宋官窑重视仿古器形与厚釉质感，杭州郊坛下遗址留有成品收置等生产遗迹。火候退去，器形的端正与釉面的细润，才得以静静显露。",
            x: 68,
            y: 70,
          },
        ],
      },
      {
        id: "glaze-settling-workshop",
        number: "02",
        title: "厚釉凝青",
        tagline: "釉色凝润，葵瓣轻舒。",
        vessel: "南宋官窑粉青釉葵口洗",
        period: "南宋",
        image: "/assets/kilns/guan-one-shot/02-glaze-settling-workshop-v3-vessel-closeup.webp",
        video: "/assets/kilns/guan-one-shot/02-glaze-settling-workshop-v4-forward-loop-source.mp4",
        videoLoop: "native",
        audio: "/assets/kilns/guan-one-shot/02-glaze-settling-workshop-ambience.m4a",
        motion: "none",
        fact: "南宋官窑制瓷采用素烧、施釉后再烧成等工序。素烧是先以较低温度预烧未施釉的坯体；施釉次数、釉层厚度与烧成条件共同影响成器效果，粉青不是直接涂上的青色颜料。",
        reconstruction: "工房中的葵口洗已是烧成品，作为理解厚釉效果的参照，不表示正在给它再次上釉。釉缸、木台与器物的相对位置属于艺术复原。",
        sourceLabel: "天津博物馆 · 官窑青釉暗龙纹洗（烧造工艺）",
        sourceUrl: "https://www.tjbwg.cn/cn/collectionInfo.aspx?Id=2537",
        additionalSources: [{ label: "杭州南宋官窑博物馆 · 作坊遗迹", url: "https://z.hangzhou.com.cn/2020/rwwhql/content/content_7746554.htm" }],
        hotspots: [
          {
            id: "glaze-close",
            label: "看厚釉",
            title: "厚釉凝青",
            body: "葵口洗的瓣缘轻轻起伏，粉青釉覆于其上，光泽含蓄而凝润。南宋官窑采用素烧后施釉、再行烧成等工序，以施釉与火候成就厚釉效果。厚的是釉层，未必是胎壁，莹润的外表之下，藏着制瓷工序的分寸。",
            x: 58,
            y: 64,
          },
        ],
      },
      {
        id: "ritual-side-hall",
        number: "03",
        title: "簋式承古",
        tagline: "簋形承古，青釉凝香。",
        vessel: "南宋官窑粉青釉簋式炉",
        period: "南宋",
        image: "/assets/kilns/guan-one-shot/03-ritual-side-hall-incense-v3-vessel-closeup.webp",
        video: "/assets/kilns/guan-one-shot/03-ritual-side-hall-incense-v5.mp4",
        videoLoop: "native",
        audio: "/assets/kilns/guan-one-shot/03-ritual-side-hall-incense-ambience.m4a",
        motion: "none",
        fact: "郊坛下窑址出土有南宋官窑青瓷簋式炉。簋原属古代青铜盛食礼器，后世瓷炉借用其形制；出土地点与器式可考，并不等于每件器物的实际使用场合都已确定。",
        reconstruction: "室内焚香表现仿古瓷炉的一种使用情境，不是南宋某次祭祀的实录。不能仅因窑址名为“郊坛下”，就认定画面位于祭坛旁或所烧器物都用于祭祀。",
        sourceLabel: "西湖博物馆 · 南宋官窑青瓷簋式炉",
        sourceUrl: "https://www.westlakemuseum.com/index.php/gcjp/jpzs2/854-gcjp-008.html",
        hotspots: [
          {
            id: "ritual-smoke",
            label: "看炉形",
            title: "古器新用",
            body: "簋本是古代青铜盛食礼器，后世瓷炉借用其形，保留端稳的轮廓，另有焚香之用。郊坛下窑址出土的官窑簋式炉，留下南宋仿古制瓷的线索。青釉代替铜色，器形中那份肃静，却仍可辨认。",
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
        tagline: "素面凝青，清润如玉。",
        vessel: "南宋龙泉窑粉青釉盘口瓶",
        period: "南宋",
        image: "/assets/kilns/longquan-one-shot/01-inspection-shed-reference-locked-v2.webp",
        video: "/assets/kilns/longquan-one-shot/01-inspection-shed-reference-locked-v4.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "龙泉窑在南宋发展出著名的粉青、梅子青釉。石灰碱釉在高温时黏度较大，有利于形成凝厚釉层；盘口瓶以盘状口沿、长颈和简洁瓶身体现素面青瓷的特点。",
        reconstruction: "窑场检选棚与木台为艺术复原，表现成品冷却后检看的环节。瓶形参照器物资料图；馆藏同类器提供釉色与工艺依据，不意味着画面是该器的出土现场。",
        sourceLabel: "故宫博物院 · 龙泉窑青釉盘口瓶",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227552.html",
        hotspots: [
          {
            id: "dish-mouth-vase",
            label: "看粉青",
            title: "粉青如玉",
            body: "盘口舒展，长颈直立，素净瓶身以釉色取胜。南宋龙泉窑发展出粉青与梅子青，石灰碱釉在高温时黏度较大，有利于形成凝厚的釉层。粉青柔和，梅子青青翠，各有深浅，都是窑工在胎釉与火候之间求得的清润。",
            x: 68,
            y: 64,
          },
        ],
      },
      {
        id: "double-fish-washer",
        number: "02",
        title: "双鱼映水",
        tagline: "双鱼相向，一洗涵青。",
        vessel: "南宋龙泉窑青釉双鱼洗",
        period: "南宋",
        image: "/assets/kilns/longquan-one-shot/02-double-fish-washer-reference-locked-v2.webp",
        video: "/assets/kilns/longquan-one-shot/02-double-fish-washer-reference-locked-v3.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "国博藏龙泉窑青釉双鱼洗具有宽沿、弧壁、圈足，外饰莲瓣，内底凸起双鱼。鱼纹先用模具制出，再贴附于器内并施釉烧成，属于模印贴花，而非直接在碗底刻出两条鱼。",
        reconstruction: "书案与浅水用于展示器内浮起的鱼纹，是使用情境的艺术复原。仅凭“洗”的名称，不能断定所有同类器都专用于洗笔。",
        sourceLabel: "中国国家博物馆 · 龙泉窑青釉双鱼洗",
        sourceUrl: "https://www.chnmuseum.cn/zp/zpml/csp/202203/t20220307_254177.shtml",
        hotspots: [
          {
            id: "molded-fish",
            label: "看双鱼",
            title: "釉下双鱼",
            body: "双鱼微微浮起于洗底，鳍尾的转折被青釉柔和包覆。鱼纹先以模具制出，再贴附于器内，随后施釉烧成；外壁莲瓣与内底双鱼，一同隐现于厚釉之下。一池水意，留在青瓷之间。",
            x: 55,
            y: 66,
          },
        ],
      },
      {
        id: "guan-ear-study",
        number: "03",
        title: "贯耳入室",
        tagline: "贯耳承古，一枝入室。",
        vessel: "南宋龙泉窑粉青釉贯耳瓶",
        period: "南宋",
        image: "/assets/kilns/longquan-one-shot/03-lived-in-study-guan-ear-reference-locked-v2.webp",
        video: "/assets/kilns/longquan-one-shot/03-lived-in-study-guan-ear-reference-locked-v5-loop.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "贯耳瓶借鉴古代青铜壶式样，颈侧对称的管状耳是命名线索。环绕颈腹的弦纹属于横向线条装饰，和釉面的细微纹理不是同一概念。",
        reconstruction: "瓶与卷轴、砚台及枝叶共同构成书斋陈设的艺术复原。插枝是此处的情境安排，不表示该器仅为插花而制，也不指认某位宋人的书房。",
        sourceLabel: "故宫博物院 · 龙泉窑青釉贯耳弦纹瓶（同类器）",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227558.html",
        hotspots: [
          {
            id: "guan-ears",
            label: "看贯耳",
            title: "贯耳古韵",
            body: "长颈两侧各出一段中空管状耳，因可贯通而称“贯耳”。这一瓶式取意于古代青铜壶，颈腹弦纹又添几分端整。龙泉窑以粉青釉柔化古器的轮廓，枝影相伴时，庄重之中也有清雅。",
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
        tagline: "晨色初匀，一碗含青。",
        vessel: "钧窑天青釉碗",
        period: "钧窑日用瓷",
        image: "/assets/kilns/jun-one-shot/01-indoor-dawn-bowl-v1.webp",
        video: "/assets/kilns/jun-one-shot/01-indoor-dawn-bowl-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "钧窑日用碗可见乳浊青蓝釉和略带黄褐色的口沿，并非件件都有红紫斑。相关器物的断代须结合具体资料：故宫藏天蓝釉墩式碗的年代标注即保留“北宋？”的疑问。",
        reconstruction: "木架与器物组成成品检看的艺术复原，不对应某处窑址的精确室内格局。参考碗的年代未能逐件确认，因此以器类和釉质为主要观察内容。",
        sourceLabel: "故宫博物院 · 钧窑天蓝釉墩式碗（同类器与断代提示）",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227931.html",
        hotspots: [
          {
            id: "dawn-glaze",
            label: "看天青",
            title: "一碗天青",
            body: "敛口圆腹收住柔和的青蓝，口沿釉薄处略泛黄褐，是钧窑日用碗可见的面貌。乳浊釉并非透明如水，而以含蓄的色泽见长；即便没有红紫彩斑，一碗清青也自成气韵。同类器的具体年代，仍需分别考订。",
            x: 69,
            y: 67,
          },
        ],
      },
      {
        id: "glaze-transformation",
        number: "02",
        title: "釉中万色",
        tagline: "青蓝深处，紫意漫生。",
        vessel: "钧窑青釉紫红斑碗",
        period: "钧窑日用瓷",
        image: "/assets/kilns/jun-one-shot/02-glaze-colors-closeup-v1.webp",
        video: "/assets/kilns/jun-one-shot/02-glaze-colors-closeup-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "钧瓷的紫红呈色与含铜釉料及高温还原烧成有关。“还原气氛”是窑内影响金属呈色状态的烧成条件；釉料的施用与烧成变化共同作用，并非颜色凭空出现。",
        reconstruction: "近观碗内彩斑，展示已经烧成的釉色。光线变化只改变观看效果，不代表常温下釉色仍在流动或继续窑变；本幕不模拟实际窑炉反应。",
        sourceLabel: "中国国家博物馆 · 钧窑镂空座四兽面双螭耳瓷瓶（铜红呈色）",
        sourceUrl: "https://www.chnmuseum.cn/zp/zpml/kgfjp/202111/t20211116_252340.shtml",
        hotspots: [
          {
            id: "copper-red",
            label: "看窑变",
            title: "青中见紫",
            body: "碗内青蓝与紫红相接，斑色边缘自然晕散。钧瓷的紫红与含铜釉料及高温还原烧成有关，既有工匠配釉施料的选择，也有窑中条件带来的变化。那些浓淡相融的色泽，出窑时便已凝定，近看却仍如云霞舒展。",
            x: 54,
            y: 62,
          },
        ],
      },
      {
        id: "garden-flowerpot",
        number: "03",
        title: "花器承影",
        tagline: "紫蓝相映，花影轻移。",
        vessel: "钧窑玫瑰紫釉菱花式花盆",
        period: "钧窑陈设瓷",
        image: "/assets/kilns/jun-one-shot/03-flower-shadow-garden-v1.webp",
        video: "/assets/kilns/jun-one-shot/03-flower-shadow-garden-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "钧窑陈设花器的断代存在传统著录与考古研究的差异。部分馆藏仍著录为宋，另有研究根据钧台窑材料将相关花器置于元末明初或明代早中期，不能全部归为北宋。",
        reconstruction: "山石、苔藓与花盆组成庭院陈设的艺术复原，不作为北宋盆景的直接证据。器形、釉色参照传世花器，底款、排水孔等未展示部位不作画面推断。",
        sourceLabel: "故宫博物院 · 钧窑玫瑰紫釉菱花式花盆（器形）",
        sourceUrl: "https://www.dpm.org.cn/collection/ceramic/227967.html",
        additionalSources: [{ label: "故宫博物院院刊 · 钧窑概念的形成及其产品时代辨析（PDF）", url: "https://www.dpm.org.cn/Uploads/File/2018/05/31/u5b0fbd8e2d5e4.pdf" }],
        hotspots: [
          {
            id: "flowerpot-form",
            label: "看花器",
            title: "花器流霞",
            body: "菱花式口沿向下延为分瓣，棱线与腹壁之间，玫瑰紫和青蓝各见浓淡。钧窑花器以轮廓与釉色相映成趣，山石花木也因之多了一层衬色。这类传世花器的年代仍有讨论，考古研究已提出元末明初及明代的解释。",
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
        tagline: "刀痕入釉，花叶成青。",
        vessel: "北宋耀州窑青釉刻牡丹纹莱菔尊",
        period: "北宋",
        image: "/assets/kilns/yaozhou-one-shot/01-fired-inspection-concept-v2.webp",
        video: "/assets/kilns/yaozhou-one-shot/01-fired-inspection-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "耀州窑以陕西铜川黄堡窑场为代表，北宋中期刻花技术成熟。莱菔即萝卜，莱菔尊因整体轮廓近似而得名，属陈设器，并不是盛放萝卜的容器。",
        reconstruction: "窑旁工作台表现成品冷却后的检看环节，是依据窑场生产背景作的艺术复原。器物与窑口的具体位置，不对应某次出土或开窑记录。",
        sourceLabel: "中国国家博物馆 · 青釉刻牡丹纹莱菔尊",
        sourceUrl: "https://www.chnmuseum.cn/zp/zpml/csp/202208/t20220811_256924.shtml",
        hotspots: [
          {
            id: "laifu-zun",
            label: "看莱菔尊",
            title: "莱菔成器",
            body: "“莱菔”读作 lái fú，即萝卜。此类尊因轮廓相似而得名，是别具形趣的陈设器。肩腹之间刻出牡丹，凹处积釉显深，花叶便在青色中分出层次，留下耀州窑工运刀的清劲。",
            x: 57,
            y: 69,
          },
          {
            id: "kiln-exit",
            label: "看窑口",
            title: "窑火之后",
            body: "耀州窑以陕西铜川黄堡窑场为代表，北宋刻花青瓷尤具特色。器形先由泥成，花纹再以刀就，施釉烧成之后，刀痕与青釉才相映成色。窑火留下的，不只是一件坚实的器物，也有花叶的深浅与起伏。",
            x: 24,
            y: 51,
          },
        ],
      },
      {
        id: "glaze-pooling",
        number: "02",
        title: "刻影积釉",
        tagline: "花随刀起，青向深处。",
        vessel: "北宋耀州窑青釉划花牡丹纹碗",
        period: "北宋",
        image: "/assets/kilns/yaozhou-one-shot/02-incised-peony-glaze-concept-v2.webp",
        video: "/assets/kilns/yaozhou-one-shot/02-incised-peony-glaze-v4.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "参考器为台北故宫藏北宋耀州窑青瓷划花牡丹纹碗。花叶以斜刀深划，并辅以细密线纹；橄榄青釉在凹槽处积聚较厚，形成近似阴影的深色轮廓。",
        reconstruction: "俯视成品碗用于比较花叶凹凸与积釉，不是正在刻坯或施釉的现场。木案及陪衬器物为艺术复原；花纹在烧成后已经固定。",
        sourceLabel: "台北故宫博物院 · 耀州窑青瓷划花牡丹纹碗",
        sourceUrl: "https://digitalarchive.npm.gov.tw/Collection/Detail/30090?dep=U",
        hotspots: [
          {
            id: "incised-peony",
            label: "看刻花",
            title: "刀下牡丹",
            body: "牡丹沿碗壁舒展，花叶轮廓以斜刀刻划，细密线纹补足叶脉与瓣理。纹饰先成于未烧的坯体，再施青釉入窑；刀锋的轻重与转折，便留在一碗浓淡相间的青色之中。",
            x: 54,
            y: 67,
          },
          {
            id: "pooled-glaze",
            label: "看积釉",
            title: "积釉见深",
            body: "花叶凹槽中积釉较厚，颜色便较周围深些，看似阴影，却是刀工与釉层共同留下的层次。耀州窑刻花的妙处，正在这同色之间的浓淡：花纹不靠另添黑彩，已能清楚浮现。",
            x: 69,
            y: 57,
          },
        ],
      },
      {
        id: "spring-tea",
        number: "03",
        title: "茶盏见春",
        tagline: "茶末初匀，盏中见春。",
        vessel: "耀州窑青釉刻花碗",
        period: "宋代茶事",
        image: "/assets/kilns/yaozhou-one-shot/03-spring-tea-life-concept-v2.webp",
        video: "/assets/kilns/yaozhou-one-shot/03-spring-tea-life-v1.mp4",
        videoLoop: "native",
        motion: "none",
        fact: "宋代流行的点茶法将茶研为细末，入盏以少量水调膏，再注水、用茶筅或茶匙击拂。碾磨是制备茶末的环节，不能把点茶等同于今天直接冲泡整叶茶。",
        reconstruction: "木桌、石磨和青瓷碗组成日常茶事的艺术复原，并未展示完整点茶步骤。青瓷碗借此进入生活语境，不表示所有耀州窑刻花碗都是专用茶具。",
        sourceLabel: "故宫博物院 · 点茶成画",
        sourceUrl: "https://www.dpm.org.cn/subject_tea/single/detail/260797.html",
        additionalSources: [{ label: "蒙特利尔美术馆 · 北宋陕西青瓷碗（同类器）", url: "https://www.mbam.qc.ca/en/works/23296/" }],
        hotspots: [
          {
            id: "tea-bowl",
            label: "看茶碗",
            title: "青瓷伴茶",
            body: "青釉碗以刻花装点器内，盛物之用与赏纹之趣相随。宋代点茶盛行，茶末先调膏，再注水击拂，盏中渐起细沫。茶事给青瓷添了一重生活意味，而一只碗的用途，原也不必尽于茶席。",
            x: 68,
            y: 70,
          },
          {
            id: "tea-mill",
            label: "看石磨",
            title: "细末成茶",
            body: "石磨将茶研细，筛罗再取匀净茶末，这是宋代点茶的准备。入盏后以少量水调膏，继而注水，用茶筅或茶匙击拂。由细末至轻沫，杯盏间的片刻清闲，原有一番细致工夫。",
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
  view: { current: { yaw: number; pitch: number } };
  originYaw: number;
  originPitch: number;
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
  view: viewRef,
  originYaw,
  originPitch,
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
  const activityRef = useRef(activity);
  const inkHeatRef = useRef(inkHeat);
  const heatOriginRef = useRef(heatOrigin);
  const enabledRef = useRef(enabled);

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

      const nextView = {
        yaw: normalizeYaw(viewRef.current.yaw - originYaw),
        pitch: viewRef.current.pitch - originPitch,
      };
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
  }, [emberOverlaySrc, heatMaskSrc, heatStrength, motion, src, originYaw, originPitch, viewRef]);

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
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    if (!gl) return;
    // The flow hash exceeds mediump's reliable range on some mobile GPUs.
    // Use full precision, or retain the unchanged source flame as fallback.
    if (!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision) return;

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision highp float;
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
    let firstFramePresented = false;
    const handleContextLost = () => {
      firstFramePresented = false;
      canvas.dataset.ready = "false";
      setReady(false);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
    };
    image.src = src;

    let frame = 0;
    let width = 0;
    let height = 0;
    let resizeDirty = true;
    let previousTime = performance.now();
    let elapsed = 0;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
    const observer = new ResizeObserver(() => { resizeDirty = true; });
    observer.observe(canvas);
    const render = (time: number) => {
      if (disposed || document.hidden || gl.isContextLost()) return;
      elapsed += Math.min(50, Math.max(0, time - previousTime));
      previousTime = time;
      if (resizeDirty) {
        width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        resizeDirty = false;
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (textureReady) {
        gl.uniform1f(timeLocation, elapsed / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (!firstFramePresented && !gl.isContextLost()) {
          firstFramePresented = true;
          canvas.dataset.ready = "true";
          setReady(true);
        }
      }
      frame = window.requestAnimationFrame(render);
    };
    const onVisibility = () => {
      window.cancelAnimationFrame(frame);
      if (!document.hidden && !disposed) {
        previousTime = performance.now();
        frame = window.requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    frame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      image.onload = null;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
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

/** App-owned presentation only; the protected Carousel still owns touch physics. */
function installSceneNavigation({ root, prefix, sceneIds, initialIndex, reducedMotion, onCommit, onMove }: {
  root: HTMLElement;
  prefix: "cizhou" | "story";
  sceneIds: string[];
  initialIndex: number;
  reducedMotion: boolean;
  onCommit: (index: number) => void;
  onMove: () => void;
}) {
  const cizhou = prefix === "cizhou";
  const viewport = root.querySelector<HTMLElement>(cizhou ? ".cizhou-trait-carousel" : ".kiln-story-carousel");
  const track = viewport?.querySelector<HTMLElement>(cizhou ? ".cizhou-trait-track" : ".kiln-story-track");
  if (!viewport || !track) return;
  const cards = Array.from(track.children) as HTMLElement[];
  const layers = Array.from(root.querySelectorAll<HTMLElement>(cizhou ? ".cizhou-scene-layer" : ".kiln-story-scene"));
  const slices = Array.from(root.querySelectorAll<HTMLElement>("[data-scene-slice]"));
  const count = sceneIds.length;
  let width = Math.max(1, viewport.clientWidth);
  let origin = initialIndex + 1;
  let position = origin;
  let frame = 0;
  let settleTimer = 0;
  let wrappingFrame = 0;
  let wheelTimer = 0;
  let pointer: number | null = null;
  let gestureAccepted = false;
  let released = false;
  let moving = false;
  let wrapping = false;
  let disposed = false;
  let tween: gsap.core.Tween | null = null;
  const setTrackX = gsap.quickSetter(track, "x", "px");
  const logical = (physical: number) => wrapIndex(physical - 1, count);
  const weight = (index: number) => {
    const distance = Math.abs(position - 1 - index);
    return clamp(1 - Math.min(distance, Math.abs(distance - count)), 0, 1);
  };
  const present = () => {
    frame = 0;
    if (disposed) return;
    cards.forEach((card, index) => {
      const distance = index - position;
      const stem = cizhou ? "--scene" : "--story";
      card.style.setProperty(`${stem}-copy-x`, `${distance * 10}px`);
      card.style.setProperty(`${stem}-copy-opacity`, `${Math.max(0, 1 - Math.abs(distance) * 2.4)}`);
      if (cizhou) card.style.setProperty("--scene-content-opacity", `${Math.max(0, 1 - Math.abs(distance) * 2.1)}`);
    });
    // Source-over alpha is not additive. Keep the lower contributing image
    // opaque so a 50/50 dissolve never exposes 25% of the dark parent.
    let accumulated = 0;
    layers.forEach((layer, index) => {
      const contribution = weight(index);
      accumulated += contribution;
      const alpha = contribution > 0 ? contribution / accumulated : 0;
      layer.style.setProperty(cizhou ? "--scene-layer-opacity" : "--story-scene-opacity", `${alpha}`);
      layer.style.visibility = contribution > 0 ? "visible" : "hidden";
      layer.dataset.running = !moving && contribution > 0.98 ? "true" : "false";
    });
    slices.forEach((slice) => {
      const contribution = weight(Number(slice.dataset.sceneSlice ?? 0));
      slice.style.setProperty("--scene-weight", `${contribution}`);
      slice.dataset.running = !moving && contribution > 0.98 ? "true" : "false";
    });
    root.dataset.scene = sceneIds[logical(Math.round(position))];
  };
  const requestPresentation = () => {
    // Do not pass present(position) directly to RAF: RAF supplies a timestamp.
    if (!frame) frame = window.requestAnimationFrame(() => present());
  };
  const markMoving = () => {
    if (moving) return;
    moving = true;
    root.dataset.sceneMoving = "true";
    onMove();
  };
  const reconcile = () => {
    wrapping = true;
    viewport.scrollLeft = position * width;
    setTrackX(0);
    window.cancelAnimationFrame(wrappingFrame);
    wrappingFrame = window.requestAnimationFrame(() => { wrapping = false; });
  };
  const finish = (physical: number) => {
    tween = null;
    const index = logical(physical);
    released = true;
    position = origin = index + 1;
    reconcile();
    moving = false;
    root.dataset.sceneMoving = "false";
    present();
    onCommit(index);
  };
  const settle = (target = Math.round(position)) => {
    if (disposed || pointer !== null || tween) return;
    const start = position;
    const destination = clamp(target, Math.max(0, origin - 1), Math.min(count + 1, origin + 1));
    const travel = Math.abs(destination - start);
    if (reducedMotion || travel < 0.002) { finish(destination); return; }
    markMoving();
    const value = { position: start };
    tween = gsap.to(value, {
      position: destination, duration: 0.24 + Math.min(travel, 1) * 0.1,
      ease: "power1.out",
      onUpdate: () => {
        position = value.position;
        // Runtime inertia can continue underneath; it cannot move the chosen page.
        setTrackX(viewport.scrollLeft - position * width);
        present();
      },
      onComplete: () => finish(destination),
    });
  };
  const scheduleSettle = () => {
    window.clearTimeout(settleTimer);
    if (pointer === null && !tween && !released) settleTimer = window.setTimeout(() => settle(), 34);
  };
  const onScroll = () => {
    if (wrapping) return;
    if (released || tween) {
      setTrackX(viewport.scrollLeft - position * width);
      if (!tween) {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => reconcile(), 80);
      }
      return;
    }
    const nextPosition = clamp(viewport.scrollLeft / width, Math.max(0, origin - 1), Math.min(count + 1, origin + 1));
    if (Math.abs(nextPosition - position) < 0.0001) {
      setTrackX(viewport.scrollLeft - position * width);
      return;
    }
    position = nextPosition;
    setTrackX(viewport.scrollLeft - position * width);
    markMoving();
    requestPresentation();
    scheduleSettle();
  };
  const onDown = (event: PointerEvent) => {
    if (pointer !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointer = event.pointerId;
    // Do not queue another scene while the previous short snap is completing.
    gestureAccepted = !tween;
    if (!gestureAccepted) return;
    window.clearTimeout(settleTimer);
    released = false;
    origin = Math.round(position);
    // Runs before Carousel's own pointer-down, so its next drag starts here.
    reconcile();
    window.cancelAnimationFrame(wrappingFrame);
    wrapping = false;
  };
  const onUp = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    if (!gestureAccepted) return;
    gestureAccepted = false;
    position = clamp(viewport.scrollLeft / width, Math.max(0, origin - 1), Math.min(count + 1, origin + 1));
    const delta = position - origin;
    // A deliberate light swipe (24–32 layout px) advances one neighbour.
    // Decide before Carousel adds release velocity, never from that momentum.
    const threshold = clamp(width * 0.07, 24, 32) / width;
    const target = event.type === "pointercancel" || Math.abs(delta) < threshold ? origin : origin + Math.sign(delta);
    released = true;
    if (moving || Math.abs(delta) > 0.001) settle(target);
  };
  const onWheel = () => {
    if (!wheelTimer && !tween && pointer === null) {
      released = false;
      origin = Math.round(position);
      reconcile();
    }
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => { wheelTimer = 0; }, 180);
  };
  const onKey = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || root.dataset.detailOpen === "true") return;
    event.preventDefault();
    event.stopPropagation();
    if (tween || pointer !== null || event.repeat) return;
    window.clearTimeout(settleTimer);
    released = true;
    settle(origin + (event.key === "ArrowRight" ? 1 : -1));
  };
  const resize = new ResizeObserver(() => {
    const nextWidth = Math.max(1, viewport.clientWidth);
    if (nextWidth === width) return;
    width = nextWidth;
    tween?.kill(); tween = null;
    pointer = null;
    finish(Math.round(position));
  });
  viewport.tabIndex = 0;
  viewport.setAttribute("aria-roledescription", "循环场景浏览");
  reconcile(); present(); resize.observe(viewport);
  viewport.addEventListener("scroll", onScroll, { passive: true });
  viewport.addEventListener("pointerdown", onDown, { passive: true });
  viewport.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("pointerup", onUp, true);
  window.addEventListener("pointercancel", onUp, true);
  root.addEventListener("keydown", onKey);
  return () => {
    disposed = true;
    tween?.kill(); resize.disconnect();
    window.clearTimeout(settleTimer);
    window.clearTimeout(wheelTimer);
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(wrappingFrame);
    viewport.removeEventListener("scroll", onScroll);
    viewport.removeEventListener("pointerdown", onDown);
    viewport.removeEventListener("wheel", onWheel);
    window.removeEventListener("pointerup", onUp, true);
    window.removeEventListener("pointercancel", onUp, true);
    root.removeEventListener("keydown", onKey);
    gsap.set(track, { clearProps: "transform" });
  };
}

const SCENE_NUMERALS = ["一", "二", "三"] as const;

function KilnKnowledgeSheet({ hotspot, scene, onClose }: {
  hotspot: CizhouTraitHotspot | null;
  scene: { title: string };
  onClose: () => void;
}) {
  const lastHotspot = useRef(hotspot);
  if (hotspot) lastHotspot.current = hotspot;
  const content = hotspot ?? lastHotspot.current;
  return (
    <BottomSheet open={Boolean(hotspot)} onOpenChange={(open) => { if (!open) onClose(); }}
      title={content?.title ?? scene.title} snap={0.56}>
      <div className="kiln-knowledge-content">
        <button className="kiln-knowledge-close" type="button" onClick={onClose} aria-label="关闭知识详情">
          <KilnUiIcon kind="close" />
        </button>
        <MobileScroll className="kiln-knowledge-scroll">
          <div className="kiln-knowledge-body">
            <p>{content?.body}</p>
          </div>
        </MobileScroll>
      </div>
    </BottomSheet>
  );
}

/** A slow connection or blocked autoplay must not look like a broken scene. */
function ScenePlaybackStatus({ videoRefs, secondaryRefs, activeIndex, enabled }: {
  videoRefs: { current: (HTMLVideoElement | null)[] };
  secondaryRefs?: { current: (HTMLVideoElement | null)[] };
  activeIndex: number;
  enabled: boolean;
}) {
  const [status, setStatus] = useState<"quiet" | "loading" | "blocked" | "error">("quiet");
  useEffect(() => {
    setStatus("quiet");
    const videos = [videoRefs.current[activeIndex], secondaryRefs?.current[activeIndex]]
      .filter((video): video is HTMLVideoElement => Boolean(video));
    if (!enabled || !videos.length) return;
    const foreground = () => videos.reduce((front, video) =>
      Number(video.style.opacity || 1) > Number(front.style.opacity || 1) ? video : front);
    let timer = 0;
    const quiet = () => { window.clearTimeout(timer); setStatus("quiet"); };
    const wait = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.hidden) return;
        // A loop may hand off to its second element while the first is paused.
        if (videos.some((video) => !video.paused && !video.ended && video.readyState >= 3)) {
          setStatus("quiet");
          return;
        }
        const video = foreground();
        setStatus(video.error ? "error" : video.readyState < 3 ? "loading" : video.paused ? "blocked" : "quiet");
      }, 1200);
    };
    videos.forEach((video) => {
      video.addEventListener("playing", quiet);
      video.addEventListener("waiting", wait);
      video.addEventListener("canplay", wait);
      video.addEventListener("pause", wait);
      video.addEventListener("error", wait);
    });
    wait();
    return () => {
      window.clearTimeout(timer);
      videos.forEach((video) => {
        video.removeEventListener("playing", quiet);
        video.removeEventListener("waiting", wait);
        video.removeEventListener("canplay", wait);
        video.removeEventListener("pause", wait);
        video.removeEventListener("error", wait);
      });
    };
  }, [activeIndex, enabled, videoRefs, secondaryRefs]);
  if (!enabled || status === "quiet") return null;
  const retry = () => {
    const primary = videoRefs.current[activeIndex];
    const secondary = secondaryRefs?.current[activeIndex];
    const video = secondary && Number(secondary.style.opacity || 0) > Number(primary?.style.opacity || 1) ? secondary : primary;
    if (!video) return;
    setStatus("loading");
    if (video.error) video.load();
    void video.play().then(() => setStatus("quiet")).catch(() => setStatus(video.error ? "error" : "blocked"));
  };
  return <div className="scene-playback-status" role="status" aria-live="polite">
    {status === "loading" ? <span>动态加载中 · 可继续浏览</span> :
      <button type="button" onClick={retry}>{status === "error" ? "动态暂未载入 · 重试" : "轻触播放动态"}</button>}
  </div>;
}

function CizhouKnowledgeExperience({ onBack }: CizhouKnowledgeExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const audioFrameRef = useRef<number | null>(null);
  const sceneVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sceneVideoSecondaryRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sceneVideoCrossfadeCleanupRef = useRef<(() => void) | null>(null);
  const arrivalTimelineRef = useRef<gsap.core.Timeline | null>(null);
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
    let loopEnd = 0;
    let fadeDuration = 0;
    let outgoing = primary;
    let incoming = secondary;
    let fading = false;
    let preparing = false;
    let fadeFrom = 0;
    let frame = 0;

    primary.style.opacity = "1";
    secondary.style.opacity = "0";
    secondary.muted = true;
    secondary.volume = 0;

    const tick = () => {
      // Inactive videos use preload="none": duration may still be NaN on entry.
      // Resolve it after metadata arrives instead of freezing an invalid seam.
      if (loopEnd <= loopStart) {
        const duration = outgoing.duration;
        if (!Number.isFinite(duration) || duration <= loopStart) {
          frame = window.requestAnimationFrame(tick);
          return;
        }
        loopEnd = Math.min(trait.videoEnd ?? duration, duration);
        const loopDuration = Math.max(0.1, loopEnd - loopStart);
        fadeDuration = Math.min(loopDuration * 0.5, 1.12, Math.max(0.86, loopDuration * 0.2));
      }
      if (!preparing && outgoing.currentTime >= loopEnd - fadeDuration - 0.2) {
        preparing = true;
        incoming.currentTime = loopStart;
        incoming.muted = !audioEnabled;
        incoming.volume = audioEnabled ? 0.42 : 0;
        incoming.style.opacity = "0";
        void incoming.play().catch(() => undefined);
      }

      // Never replace a decoded frame with an unready or rejected copy.
      if (!fading && preparing && incoming.readyState >= 2 && !incoming.paused && outgoing.currentTime >= loopEnd - fadeDuration) {
        fading = true;
        fadeFrom = loopEnd - fadeDuration;
      }

      if (fading) {
        const progress = outgoing.ended ? 1 : clamp((outgoing.currentTime - fadeFrom) / fadeDuration, 0, 1);
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
          preparing = false;
        }
      }

      if (!fading && Number.isFinite(outgoing.duration) && outgoing.currentTime >= loopEnd - 0.04) {
        outgoing.currentTime = loopStart;
        if (outgoing.paused) void outgoing.play().catch(() => undefined);
        preparing = false;
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
    if (!root || !ready) return;
    return installSceneNavigation({
      root, prefix: "cizhou", sceneIds: cizhouTraits.map((scene) => scene.id),
      initialIndex: activeIndex, reducedMotion,
      onCommit: (index) => { setActiveIndex(index); setActiveHotspot(null); },
      onMove: () => setActiveHotspot(null),
    });
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
      aria-label="识窑 · 磁州三幕"
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
        ariaLabel="磁州窑三幕场景，左右滑动切换"
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
              <span aria-label={`第${trait.number}幕，共三幕`}>{SCENE_NUMERALS[traitIndex]} · 三</span>
              <h2>{trait.title}</h2>
              <p>{trait.tagline}</p>
              <div className="cizhou-trait-vessel">
                <strong>{trait.vessel}</strong>
                <small>{trait.period}</small>
              </div>
            </header>

            <div className="cizhou-trait-hotspots" aria-label={`${trait.title}器物解读`}>
              {trait.hotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  type="button"
                  className="cizhou-trait-hotspot"
                  style={{ "--hotspot-x": `${hotspot.x}%`, "--hotspot-y": `${hotspot.y}%` } as CSSProperties}
                  aria-label={`${hotspot.label}：${hotspot.title}`}
                  onClick={() => setActiveHotspot(hotspot)}
                >
                  <i aria-hidden="true"><KilnUiIcon kind="read" /></i>
                  <span>{hotspot.label}</span>
                </button>
              ))}
            </div>

          </article>
          );
        })}
      </Carousel>

      <div className="cizhou-scene-hotspots" aria-label={`${activeTrait.title}器物解读`}>
        {activeTrait.hotspots.map((hotspot) => (
          <button
            key={`${activeTrait.id}-${hotspot.id}`}
            type="button"
            className="cizhou-trait-hotspot"
            style={{ "--hotspot-x": `${hotspot.x}%`, "--hotspot-y": `${hotspot.y}%` } as CSSProperties}
            aria-label={`${hotspot.label}：${hotspot.title}`}
            disabled={!ready}
            onClick={() => setActiveHotspot(hotspot)}
          >
            <i aria-hidden="true"><KilnUiIcon kind="read" /></i>
            <span>{hotspot.label}</span>
          </button>
        ))}
      </div>

      <button type="button" className="cizhou-knowledge-back" onClick={onBack} aria-label="返回窑口">
        <KilnUiIcon kind="back" />
      </button>

      <button
        type="button"
        className="cizhou-audio-toggle"
        data-enabled={audioEnabled}
        aria-pressed={audioEnabled}
        disabled={!ready}
        onClick={() => setAudioEnabled((enabled) => !enabled)}
        aria-label={audioEnabled ? "关闭场景环境音" : "开启场景环境音"}
      >
        <KilnUiIcon kind={audioEnabled ? "sound" : "muted"} />
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
            preload={index === activeIndex && audioEnabled ? "metadata" : "none"}
          />
        ) : null,
      )}

      <ScenePlaybackStatus videoRefs={sceneVideoRefs} secondaryRefs={sceneVideoSecondaryRefs} activeIndex={activeIndex} enabled={ready && !reducedMotion} />
      <KilnKnowledgeSheet hotspot={activeHotspot} scene={activeTrait} onClose={() => setActiveHotspot(null)} />
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
    if (!root || !ready) return;
    return installSceneNavigation({
      root, prefix: "story", sceneIds: story.scenes.map((scene) => scene.id),
      initialIndex: activeIndex, reducedMotion,
      onCommit: (index) => { setActiveIndex(index); setActiveHotspot(null); },
      onMove: () => setActiveHotspot(null),
    });
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
      const videoAudioEnabled = !hasDedicatedAudio && sceneAudioEnabled && isActive;
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
    if (ready && !reducedMotion && story.scenes[activeIndex].videoLoop === "trim") {
      frame = window.requestAnimationFrame(monitorTrimLoop);
    }
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
                <span aria-label={`第${scene.number}幕，共三幕`}>{SCENE_NUMERALS[sceneIndex]} · 三</span>
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
          aria-pressed={sceneAudioEnabled}
          disabled={!ready}
          aria-label={sceneAudioEnabled ? "关闭场景环境音" : "开启场景环境音"}
          onClick={() => setSceneAudioEnabled((enabled) => !enabled)}
        >
          <KilnUiIcon kind={sceneAudioEnabled ? "sound" : "muted"} />
        </button>
      ) : null}

      <div className="kiln-story-hotspots" aria-label={`${activeScene.title}器物解读`}>
        {activeScene.hotspots.map((hotspot) => (
          <button
            key={`${activeScene.id}-${hotspot.id}`}
            type="button"
            className="kiln-story-hotspot"
            style={{ "--hotspot-x": `${hotspot.x}%`, "--hotspot-y": `${hotspot.y}%` } as CSSProperties}
            aria-label={`${hotspot.label}：${hotspot.title}`}
            disabled={!ready}
            onClick={() => setActiveHotspot(hotspot)}
          >
            <i aria-hidden="true"><KilnUiIcon kind="read" /></i>
            <span>{hotspot.label}</span>
          </button>
        ))}
      </div>

      <button type="button" className="kiln-story-back" onClick={onBack} aria-label="返回窑口">
        <KilnUiIcon kind="back" />
      </button>

      <ScenePlaybackStatus videoRefs={sceneVideoRefs} secondaryRefs={sceneVideoSecondaryRefs} activeIndex={activeIndex} enabled={ready && !reducedMotion} />
      <KilnKnowledgeSheet hotspot={activeHotspot} scene={activeScene} onClose={() => setActiveHotspot(null)} />
    </section>
  );
}

export default function Prototype() {
  const keyboard = useKeyboard();
  const sphereRef = useRef<HTMLElement>(null);
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
    // The renderer reads the live ref. Panning must not reconcile the entire
    // React tree on every frame; only the four parallax properties change.
    const style = sphereRef.current?.style;
    if (!style) return;
    const y = nextYaw * Math.PI / 180;
    const p = nextPitch * Math.PI / 180;
    style.setProperty("--sphere-x", `${Math.sin(y) * -72}px`);
    style.setProperty("--sphere-y", `${Math.sin(p) * 54}px`);
    style.setProperty("--sphere-detail-x", `${Math.sin(y + 0.8) * 38}px`);
    style.setProperty("--sphere-detail-y", `${Math.sin(p * 1.4) * -28}px`);
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
      const duration = clamp(distance * 3.15, 180, 420);
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
    if (introPhase !== "hidden" || typeof window === "undefined") return;
    const neighboringKilns = [
      kilns[wrapIndex(activeIndex - 1, kilns.length)],
      kilns[wrapIndex(activeIndex + 1, kilns.length)],
    ];
    const images = neighboringKilns.flatMap((kiln) => [kiln.panorama, kiln.fire, kiln.image])
      .filter((source): source is string => Boolean(source))
      .map((source) => {
        const image = new window.Image();
        image.decoding = "async";
        image.src = source;
        return image;
      });
    return () => {
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [activeIndex, introPhase]);

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
    event.currentTarget.dataset.viewEdge = "false";
    setDragging(true);
    setInspecting(false);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startYaw: viewRef.current.yaw,
      startPitch: viewRef.current.pitch,
      axis: null,
      targetIndex: null,
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
    drag.moved ||= Math.hypot(totalX, totalY) > 7;
    if (!drag.moved) return;

    const centerYaw = activeKiln.yaw + Math.round((drag.startYaw - activeKiln.yaw) / 360) * 360;
    const centerPitch = activeKiln.pitch + Math.round((drag.startPitch - activeKiln.pitch) / 360) * 360;
    const rawYaw = drag.startYaw - totalX * 0.16;
    const rawPitch = drag.startPitch + totalY * 0.12;
    const yawOffset = rawYaw - centerYaw;
    const pitchOffset = rawPitch - centerPitch;
    const horizontalEdge = Math.abs(yawOffset) >= KILN_VIEW_YAW_LIMIT;
    const verticalEdge = Math.abs(pitchOffset) >= KILN_VIEW_PITCH_LIMIT;
    const nextYaw = centerYaw + applyKilnViewResistance(yawOffset, KILN_VIEW_YAW_LIMIT);
    const nextPitch = centerPitch + applyKilnViewResistance(pitchOffset, KILN_VIEW_PITCH_LIMIT);

    if (horizontalEdge || verticalEdge) {
      drag.axis = Math.abs(yawOffset) / KILN_VIEW_YAW_LIMIT >= Math.abs(pitchOffset) / KILN_VIEW_PITCH_LIMIT ? "x" : "y";
      const boundaryTravel = drag.axis === "x" ? totalX : totalY;
      const direction = boundaryTravel < 0 ? 1 : -1;
      drag.targetIndex = wrapIndex(activeIndex + direction, kilns.length);
      event.currentTarget.dataset.viewEdge = "true";
    } else {
      drag.axis = null;
      drag.targetIndex = null;
      event.currentTarget.dataset.viewEdge = "false";
    }
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
    event.currentTarget.dataset.viewEdge = "false";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 120);
      if (drag.targetIndex !== null) navigateTo(drag.targetIndex);
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
    const { yaw, pitch } = viewRef.current;
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
  }, [activeKiln]);

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
        ref={sphereRef}
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
        aria-label="八窑无边球面，拖动观察当前窑面，触及边界切换窑口"
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
            view={viewRef}
            originYaw={activeKiln.yaw}
            originPitch={activeKiln.pitch}
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
          <small>宋瓷 · 八窑</small>
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
              aria-label={`轻触焰心，进入${activeKiln.name}三幕场景`}
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
              aria-label={`进入${activeKiln.name}三幕场景`}
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
          aria-label={`${inspecting ? "收起" : "查看"}${activeKiln.name}器物说明`}
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
          <small>再次轻触 · 收起说明</small>
        </aside>

        <div className="orbit-hint" aria-hidden="true">
          <span>拖动观察窑面纹理</span>
          <small>触及边界 · 切换窑口</small>
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
