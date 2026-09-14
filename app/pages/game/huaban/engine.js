import * as THREE from "three";

/* =========================================================
   一、基础常量与数学工具
   ========================================================= */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

const ROAD_HALF = 6.2; // 半路宽（4 车道）
const LANES = [-4.6, -1.55, 1.55, 4.6]; // 各车道中心（横向偏移）
const SEG = 4; // 横截面间距
const SECTIONS = 47; // 横截面数量（覆盖 Z_NEAR ~ Z_NEAR + 188）
const Z_NEAR = -34; // 最近横截面（相机身后）
const SPAWN_AHEAD = 150; // 前向生成距离
const DESPAWN_BEHIND = -40; // 回收距离
const FOG_NEAR = 50;
const FOG_FAR = 146;
const CAM_LOCAL_Z = -9.6;
const PLAYER_HALF_W = 0.5;
const PLAYER_HALF_L = 1.05;
const GRAVITY = 17;
const JUMP_V = 6.4;

/* 赛道中心线：横向蜿蜒 + 起伏（整体下坡） */
function curveX(d) {
  return (
    15 * Math.sin(d * 0.0062) +
    6.5 * Math.sin(d * 0.0027 + 1.7) +
    2.2 * Math.sin(d * 0.0113 + 0.6)
  );
}
function curveDX(d) {
  return (
    15 * 0.0062 * Math.cos(d * 0.0062) +
    6.5 * 0.0027 * Math.cos(d * 0.0027 + 1.7) +
    2.2 * 0.0113 * Math.cos(d * 0.0113 + 0.6)
  );
}
function curveY(d) {
  return 1.6 * Math.sin(d * 0.0039) + 1.1 * Math.sin(d * 0.0091 + 2.2) - d * 0.012 + 3.2;
}
/* 路拱（横向坡度），弯道更立体 */
function bankAt(d) {
  return 0.05 * Math.sin(d * 0.0043 + 0.9) + 0.1 * curveDX(d);
}
/* 路外地形抬升（远处形成山坡） */
function terrainLift(lat) {
  const a = Math.abs(lat);
  if (a <= ROAD_HALF) return 0;
  return 4.2 * ((a - ROAD_HALF) / 58);
}
/* 地面高度 */
function groundY(d, lat) {
  return curveY(d) + bankAt(d) * lat + terrainLift(lat);
}

/* =========================================================
   二、程序化贴图（无外部资源）
   ========================================================= */
function texRoad() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#43454b";
  g.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 9000; i++) {
    const v = (Math.random() * 60 - 30) | 0;
    g.fillStyle = `rgba(${150 + v},${150 + v},${156 + v},0.10)`;
    g.fillRect(Math.random() * 256, Math.random() * 1024, 2, 2);
  }
  const grd = g.createLinearGradient(0, 0, 256, 0);
  grd.addColorStop(0, "rgba(0,0,0,0.22)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.05)");
  grd.addColorStop(1, "rgba(0,0,0,0.22)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 1024);
  g.fillStyle = "#eceff2";
  g.fillRect(8, 0, 7, 1024);
  g.fillRect(241, 0, 7, 1024);
  g.fillStyle = "#e9b62c";
  for (let y = 0; y < 1024; y += 170) {
    g.fillRect(121, y, 6, 96);
    g.fillRect(129, y, 6, 96);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function texGrass() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#6d9a4e";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2600; i++) {
    const v = (Math.random() * 60 - 30) | 0;
    g.fillStyle = `rgba(${86 + v},${140 + v},${64 + v},0.5)`;
    g.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function texSky() {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, "#2f7fc4");
  grd.addColorStop(0.45, "#7fbce8");
  grd.addColorStop(1, "#e7f2f9");
  g.fillStyle = grd;
  g.fillRect(0, 0, 16, 256);
  return new THREE.CanvasTexture(c);
}

function texCloud() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  grd.addColorStop(0, "rgba(255,255,255,0.95)");
  grd.addColorStop(0.55, "rgba(255,255,255,0.5)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function texBanner() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#111318";
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#ffd233";
  g.fillRect(0, 0, 512, 10);
  g.fillRect(0, 118, 512, 10);
  g.fillStyle = "#ffffff";
  g.font = "bold 60px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("FINISH 终点", 256, 66);
  return new THREE.CanvasTexture(c);
}

function texChecker() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 32;
  const g = c.getContext("2d");
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 2; y++) {
      g.fillStyle = (x + y) % 2 ? "#ffffff" : "#141414";
      g.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 1);
  return t;
}

/* =========================================================
   三、音效（WebAudio 合成）
   ========================================================= */
function createAudio() {
  let ctx = null;
  let muted = false;
  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  function tone(o) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (o.delay || 0);
    const dur = o.dur || 0.12;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, o.slide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(o.vol || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }
  return {
    unlock: ensure,
    setMuted: (v) => (muted = !!v),
    coin() {
      tone({ freq: 900, dur: 0.08, type: "triangle", vol: 0.1 });
      tone({ freq: 1360, dur: 0.11, type: "triangle", vol: 0.09, delay: 0.055 });
    },
    jump() {
      tone({ freq: 320, dur: 0.16, type: "square", vol: 0.06, slide: 760 });
    },
    hit() {
      tone({ freq: 170, dur: 0.3, type: "sawtooth", vol: 0.13, slide: 60 });
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) =>
        tone({ freq: f, dur: 0.24, type: "triangle", vol: 0.13, delay: i * 0.13 })
      );
    },
    dead() {
      [420, 330, 250, 170].forEach((f, i) =>
        tone({ freq: f, dur: 0.3, type: "sawtooth", vol: 0.11, delay: i * 0.12 })
      );
    },
  };
}

/* =========================================================
   四、难度与障碍配置
   ========================================================= */
export const DIFFICULTIES = {
  easy: { key: "easy", name: "轻松", desc: "障碍稀疏，血量充足", target: 800, baseSpeed: 12, maxSpeed: 20, gap: [26, 38], lives: 5, blockMax: 1, coinRate: 0.95 },
  normal: { key: "normal", name: "正常", desc: "标准下坡，考验走位", target: 1500, baseSpeed: 15, maxSpeed: 25, gap: [20, 30], lives: 3, blockMax: 2, coinRate: 0.75 },
  hard: { key: "hard", name: "地狱", desc: "能通关你是真的牛", target: 2200, baseSpeed: 17, maxSpeed: 29, gap: [15, 24], lives: 3, blockMax: 2, coinRate: 0.55 },
};

/* halfW：横向半径 / halfL：纵向半径 / height：高度（跳跃可越过） */
const OBSTACLE_TYPES = [
  { kind: "npc", halfW: 0.6, halfL: 0.5, height: 2.1, w: 1.15 },
  { kind: "cone", halfW: 0.45, halfL: 0.45, height: 0.75, w: 1.1 },
  { kind: "barrier", halfW: 1.5, halfL: 0.35, height: 0.85, w: 0.8 },
  { kind: "car", halfW: 1.3, halfL: 2.3, height: 1.7, w: 0.75 },
  { kind: "barrel", halfW: 0.5, halfL: 0.5, height: 1.0, w: 0.7 },
];
const POOL_SIZE = { npc: 12, cone: 10, barrier: 6, car: 6, barrel: 6 };

/* =========================================================
   五、主工厂
   ========================================================= */
export function createSkateGame({ canvas, container, onState, onEvent }) {
  /* ---------- 渲染器 ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: (window.devicePixelRatio || 1) < 2,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x9fd0ef, 1);
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd6e8f4, FOG_NEAR, FOG_FAR);
  const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 900);

  scene.add(new THREE.HemisphereLight(0xdceaff, 0x76824f, 0.98));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(1.2, 2.4, 0.6);
  scene.add(sun);

  const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
  const roadTex = texRoad();
  const grassTex = texGrass();
  roadTex.anisotropy = grassTex.anisotropy = Math.min(4, maxAniso);

  /* ---------- 天空 / 云 ---------- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(620, 20, 14),
    new THREE.MeshBasicMaterial({ map: texSky(), side: THREE.BackSide, fog: false, depthWrite: false })
  );
  scene.add(sky);

  const cloudTex = texCloud();
  const clouds = [];
  for (let i = 0; i < 10; i++) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.85, fog: false, depthWrite: false })
    );
    const s = rnd(45, 95);
    sp.scale.set(s, s * 0.6, 1);
    scene.add(sp);
    clouds.push({ sp, dist: rnd(-60, 320), ox: rnd(-220, 220), h: rnd(52, 118) });
  }

  /* ---------- 沿赛道的条带（路面 / 草地 / 护栏） ---------- */
  const ribbons = [];
  function createRibbon(a, b, material, vScale) {
    const count = SECTIONS + 1;
    const pos = new Float32Array(count * 2 * 3);
    const uv = new Float32Array(count * 2 * 2);
    const index = [];
    for (let i = 0; i < SECTIONS; i++) {
      const p0 = i * 2;
      const p1 = i * 2 + 1;
      const p2 = (i + 1) * 2;
      const p3 = (i + 1) * 2 + 1;
      index.push(p0, p2, p1, p1, p2, p3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geometry.setIndex(index);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const item = { mesh, a, b, vScale, pos, uv };
    ribbons.push(item);
    return item;
  }
  function updateRibbon(r, d) {
    const { a, b, pos, uv } = r;
    for (let i = 0; i <= SECTIONS; i++) {
      const localZ = Z_NEAR + i * SEG;
      const wd = d + localZ;
      const cx = curveX(wd);
      const o = i * 6;
      pos[o] = cx + a.lat;
      pos[o + 1] = groundY(wd, a.lat) + (a.y || 0);
      pos[o + 2] = localZ;
      pos[o + 3] = cx + b.lat;
      pos[o + 4] = groundY(wd, b.lat) + (b.y || 0);
      pos[o + 5] = localZ;
      const v = wd / r.vScale;
      const uo = i * 4;
      uv[uo] = 0;
      uv[uo + 1] = v;
      uv[uo + 2] = 1;
      uv[uo + 3] = v;
    }
    r.mesh.geometry.attributes.position.needsUpdate = true;
    r.mesh.geometry.attributes.uv.needsUpdate = true;
  }

  const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
  const grassMat = new THREE.MeshLambertMaterial({ map: grassTex });
  const railMat = new THREE.MeshLambertMaterial({ color: 0xd7dce2, side: THREE.DoubleSide });
  const farMat = new THREE.MeshLambertMaterial({ color: 0x7d8f60, side: THREE.DoubleSide });

  createRibbon({ lat: -ROAD_HALF, y: 0.02 }, { lat: ROAD_HALF, y: 0.02 }, roadMat, 30);
  createRibbon({ lat: -66, y: 0 }, { lat: -ROAD_HALF, y: -0.02 }, grassMat, 14);
  createRibbon({ lat: ROAD_HALF, y: -0.02 }, { lat: 66, y: 0 }, grassMat, 14);
  createRibbon({ lat: -6.6, y: 0.35 }, { lat: -6.6, y: 1.0 }, railMat, 8);
  createRibbon({ lat: 6.6, y: 1.0 }, { lat: 6.6, y: 0.35 }, railMat, 8);
  createRibbon({ lat: -190, y: -2 }, { lat: -66, y: 0 }, farMat, 46);
  createRibbon({ lat: 66, y: 0 }, { lat: 190, y: -2 }, farMat, 46);

  /* ---------- 共享几何 / 材质 ---------- */
  const mats = {
    skin: new THREE.MeshLambertMaterial({ color: 0xf0c39a }),
    jean: new THREE.MeshLambertMaterial({ color: 0x3d5b93 }),
    shoe: new THREE.MeshLambertMaterial({ color: 0x23262b }),
    white: new THREE.MeshLambertMaterial({ color: 0xf5f6f8 }),
    dark: new THREE.MeshLambertMaterial({ color: 0x1d2025 }),
    glass: new THREE.MeshLambertMaterial({ color: 0x223344 }),
    wood: new THREE.MeshLambertMaterial({ color: 0x9c6a3c }),
    grip: new THREE.MeshLambertMaterial({ color: 0x2a2d33 }),
    wheel: new THREE.MeshLambertMaterial({ color: 0xe8e2d4 }),
    cone: new THREE.MeshLambertMaterial({ color: 0xf07a1f }),
    metal: new THREE.MeshLambertMaterial({ color: 0xb9c0c9 }),
    red: new THREE.MeshLambertMaterial({ color: 0xd6342c }),
    gold: new THREE.MeshLambertMaterial({ color: 0xffc92e, emissive: 0x6a4a00 }),
    rock: new THREE.MeshLambertMaterial({ color: 0x8d8577 }),
    rock2: new THREE.MeshLambertMaterial({ color: 0x9b8f7c }),
    leaf: new THREE.MeshLambertMaterial({ color: 0x3f7a3a }),
    trunk: new THREE.MeshLambertMaterial({ color: 0x6b4a2c }),
    shirt: [
      new THREE.MeshLambertMaterial({ color: 0xe2452f }),
      new THREE.MeshLambertMaterial({ color: 0x2f7fd0 }),
      new THREE.MeshLambertMaterial({ color: 0xe8c235 }),
      new THREE.MeshLambertMaterial({ color: 0xf2f3f5 }),
      new THREE.MeshLambertMaterial({ color: 0x9b59b6 }),
      new THREE.MeshLambertMaterial({ color: 0x2fa37a }),
    ],
    carBody: [
      new THREE.MeshLambertMaterial({ color: 0x2f6fd0 }),
      new THREE.MeshLambertMaterial({ color: 0xdcd7cc }),
      new THREE.MeshLambertMaterial({ color: 0x2fae6b }),
      new THREE.MeshLambertMaterial({ color: 0xd94b3a }),
      new THREE.MeshLambertMaterial({ color: 0xe8c235 }),
    ],
    shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
  };

  const geo = {
    box: new THREE.BoxGeometry(1, 1, 1),
    sphere: new THREE.SphereGeometry(0.5, 10, 8),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
    cylLo: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
    coneShape: new THREE.ConeGeometry(0.5, 1, 10),
    shadow: new THREE.CircleGeometry(1, 12),
  };
  function box(mat, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(geo.box, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function shadowBlob(sx, sz) {
    const m = new THREE.Mesh(geo.shadow, mats.shadow);
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.04;
    m.scale.set(sx, sz, 1);
    return m;
  }

  /* ---------- 玩家：滑板 + 滑手 ---------- */
  const wheelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.16, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const truckGeo = new THREE.BoxGeometry(0.9, 0.12, 0.26);

  function createSkater() {
    const root = new THREE.Group();
    root.rotation.order = "YXZ";
    const tilt = new THREE.Group();
    root.add(tilt);
    const board = new THREE.Group();
    tilt.add(board);
    board.add(box(mats.wood, 0.95, 0.1, 2.3, 0, 0.22, 0));
    board.add(box(mats.grip, 0.9, 0.03, 2.2, 0, 0.29, 0));
    board.add(shadowBlob(1.5, 1.5));
    [0.75, -0.78].forEach((z) => {
      const t = new THREE.Mesh(truckGeo, mats.metal);
      t.position.set(0, 0.14, z);
      board.add(t);
    });
    const wheels = [];
    [
      [-0.42, 0.75],
      [0.42, 0.75],
      [-0.42, -0.78],
      [0.42, -0.78],
    ].forEach(([x, z]) => {
      const w = new THREE.Mesh(wheelGeo, mats.wheel);
      w.position.set(x, 0.12, z);
      board.add(w);
      wheels.push(w);
    });

    const rider = new THREE.Group();
    rider.rotation.x = 0.16;
    tilt.add(rider);

    const legs = new THREE.Group();
    rider.add(legs);
    [-1, 1].forEach((s, i) => {
      const leg = box(mats.jean, 0.26, 0.95, 0.28, s * 0.26, 0.8, i === 0 ? 0.42 : -0.44);
      leg.rotation.x = i === 0 ? 0.06 : -0.06;
      legs.add(leg);
      legs.add(box(mats.shoe, 0.3, 0.16, 0.62, s * 0.26, 0.34, i === 0 ? 0.46 : -0.46));
    });

    rider.add(box(mats.shirt[0], 0.82, 0.98, 0.46, 0, 1.72, 0));
    rider.add(box(mats.white, 0.36, 0.44, 0.06, 0, 1.78, 0.25));
    rider.add(box(mats.red, 0.36, 0.1, 0.06, 0, 1.74, 0.26));

    const arms = [];
    [-1, 1].forEach((s) => {
      const arm = new THREE.Group();
      arm.position.set(s * 0.44, 2.05, 0);
      arm.add(box(mats.shirt[0], 0.2, 0.72, 0.22, 0, -0.36, 0));
      arm.add(box(mats.skin, 0.18, 0.62, 0.2, 0, -0.98, 0.1));
      const hand = new THREE.Mesh(geo.sphere, mats.skin);
      hand.scale.setScalar(0.24);
      hand.position.set(0, -1.32, 0.16);
      arm.add(hand);
      arm.rotation.set(-0.18, 0, s * 1.05);
      rider.add(arm);
      arms.push(arm);
    });

    rider.add(box(mats.skin, 0.16, 0.14, 0.16, 0, 2.24, 0));
    const head = new THREE.Mesh(geo.sphere, mats.skin);
    head.scale.set(0.6, 0.66, 0.6);
    head.position.set(0, 2.55, 0.02);
    rider.add(head);
    const cap = new THREE.Mesh(geo.cyl, mats.shirt[1]);
    cap.scale.set(0.64, 0.22, 0.64);
    cap.position.set(0, 2.76, 0.02);
    rider.add(cap);
    rider.add(box(mats.shirt[1], 0.56, 0.07, 0.42, 0, 2.7, 0.36));

    return { root, tilt, rider, legs, arms, wheels };
  }
  const skater = createSkater();
  scene.add(skater.root);

  /* ---------- 障碍物模型 ---------- */
  function createObstacle(kind) {
    const g = new THREE.Group();
    if (kind === "npc") {
      const shirt = pick(mats.shirt);
      const pants = pick([mats.dark, mats.jean, mats.metal]);
      g.add(box(shirt, 0.72, 0.92, 0.42, 0, 1.42, 0));
      g.add(box(mats.skin, 0.16, 0.14, 0.16, 0, 1.94, 0));
      const h = new THREE.Mesh(geo.sphere, mats.skin);
      h.scale.set(0.56, 0.62, 0.56);
      h.position.set(0, 2.24, 0);
      g.add(h);
      [-1, 1].forEach((s) => {
        const arm = box(shirt, 0.2, 0.86, 0.2, s * 0.46, 1.5, 0.02);
        arm.rotation.z = s * 0.12;
        g.add(arm);
        g.add(box(pants, 0.26, 0.96, 0.28, s * 0.2, 0.5, 0));
      });
      g.userData.swing = true;
    } else if (kind === "cone") {
      const cone = new THREE.Mesh(geo.coneShape, mats.cone);
      cone.scale.set(0.9, 0.78, 0.9);
      cone.position.y = 0.39;
      g.add(cone);
      const band = new THREE.Mesh(geo.cylLo, mats.white);
      band.scale.set(0.62, 0.14, 0.62);
      band.position.y = 0.42;
      g.add(band);
      g.add(box(mats.cone, 0.92, 0.08, 0.92, 0, 0.04, 0));
    } else if (kind === "barrier") {
      g.add(box(mats.dark, 0.14, 0.85, 0.14, -1.3, 0.42, 0));
      g.add(box(mats.dark, 0.14, 0.85, 0.14, 1.3, 0.42, 0));
      g.add(box(mats.white, 2.9, 0.5, 0.16, 0, 0.86, 0));
      g.add(box(mats.red, 0.5, 0.52, 0.18, -0.9, 0.86, 0.01));
      g.add(box(mats.red, 0.5, 0.52, 0.18, 0.9, 0.86, 0.01));
    } else if (kind === "car") {
      const body = pick(mats.carBody);
      g.add(box(body, 2.5, 0.9, 4.4, 0, 0.72, 0));
      g.add(box(mats.glass, 2.3, 0.7, 2.0, 0, 1.5, -0.2));
      g.add(box(mats.white, 1.9, 0.3, 0.12, 0, 0.75, 2.22));
      const wg = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 8);
      wg.rotateZ(Math.PI / 2);
      [
        [-1.25, 1.4],
        [1.25, 1.4],
        [-1.25, -1.5],
        [1.25, -1.5],
      ].forEach(([x, z]) => {
        const w = new THREE.Mesh(wg, mats.dark);
        w.position.set(x, 0.34, z);
        g.add(w);
      });
    } else {
      const barrel = new THREE.Mesh(geo.cylLo, mats.red);
      barrel.scale.set(0.5, 1.0, 0.5);
      barrel.position.y = 0.5;
      g.add(barrel);
      [0.3, 0.72].forEach((y) => {
        const b = new THREE.Mesh(geo.cylLo, mats.white);
        b.scale.set(0.53, 0.14, 0.53);
        b.position.y = y;
        g.add(b);
      });
    }
    g.add(shadowBlob(1.5, 1.5));
    return g;
  }

  /* ---------- 金币 / 风景 / 终点 ---------- */
  const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12);
  coinGeo.rotateX(Math.PI / 2);
  const coinRingGeo = new THREE.TorusGeometry(0.42, 0.07, 5, 12);
  function createCoin() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(coinGeo, mats.gold));
    g.add(new THREE.Mesh(coinRingGeo, mats.gold));
    return g;
  }

  function createScenery(kind) {
    const g = new THREE.Group();
    if (kind === "tree") {
      const trunk = new THREE.Mesh(geo.cylLo, mats.trunk);
      trunk.scale.set(0.24, 1.3, 0.24);
      trunk.position.y = 0.65;
      g.add(trunk);
      const top = new THREE.Mesh(geo.coneShape, mats.leaf);
      top.scale.set(2, 2.6, 2);
      top.position.y = 2.2;
      g.add(top);
    } else {
      const r1 = new THREE.Mesh(geo.box, Math.random() > 0.5 ? mats.rock : mats.rock2);
      r1.scale.set(rnd(1.8, 3.6), rnd(1.4, 3), rnd(1.8, 3.4));
      r1.position.y = r1.scale.y / 2;
      r1.rotation.y = rnd(0, Math.PI);
      g.add(r1);
      if (Math.random() > 0.5) {
        const r2 = new THREE.Mesh(geo.box, mats.rock2);
        r2.scale.set(rnd(1, 2.2), rnd(1, 2.2), rnd(1, 2.2));
        r2.position.set(rnd(-1.8, 1.8), r2.scale.y / 2, rnd(-1.8, 1.8));
        r2.rotation.y = rnd(0, Math.PI);
        g.add(r2);
      }
    }
    return g;
  }

  const finishGroup = new THREE.Group();
  finishGroup.add(box(new THREE.MeshBasicMaterial({ map: texBanner() }), 13.4, 1.7, 0.25, 0, 5.1, 0));
  const poleGeo = new THREE.CylinderGeometry(0.16, 0.16, 6, 8);
  [-6.6, 6.6].forEach((x) => {
    const p = new THREE.Mesh(poleGeo, mats.metal);
    p.position.set(x, 3, 0);
    finishGroup.add(p);
  });
  const checkTex = texChecker();
  finishGroup.add(box(new THREE.MeshBasicMaterial({ map: checkTex }), 12.4, 0.1, 1.4, 0, 0.06, 0));
  finishGroup.visible = false;
  scene.add(finishGroup);

  /* ---------- 对象池 ---------- */
  const pools = {};
  for (const type of OBSTACLE_TYPES) {
    const list = [];
    for (let i = 0; i < POOL_SIZE[type.kind]; i++) {
      const obj = createObstacle(type.kind);
      obj.visible = false;
      scene.add(obj);
      list.push({ obj, active: false, type, kind: type.kind, dist: 0, lat: 0, phase: 0 });
    }
    pools[type.kind] = list;
  }
  const coinPool = [];
  for (let i = 0; i < 20; i++) {
    const obj = createCoin();
    obj.visible = false;
    scene.add(obj);
    coinPool.push({ obj, active: false, dist: 0, lat: 0 });
  }
  const sceneryPool = [];
  for (let i = 0; i < 26; i++) {
    const kind = i % 3 === 0 ? "tree" : "rock";
    const obj = createScenery(kind);
    obj.visible = false;
    scene.add(obj);
    sceneryPool.push({ obj, side: i % 2 === 0 ? -1 : 1, dist: 0, lat: 0 });
  }

  /* ---------- 状态 ---------- */
  const state = {
    status: "menu", // menu | playing | paused | dead | win
    diff: "normal",
    dist: 0,
    target: DIFFICULTIES.normal.target,
    coins: 0,
    health: 3,
    maxHealth: 3,
    speed: 15,
    lat: 0,
    steer: 0,
    jumpY: 0,
    vy: 0,
    grounded: true,
    invuln: 0,
    time: 0,
    shake: 0,
    nextObstacle: 40,
    finishQueued: false,
  };
  const stats = { maxSpeed: 0, hits: 0 };

  const audio = createAudio();
  let lastEmit = 0;

  function emitState(force) {
    const now = performance.now();
    if (!force && now - lastEmit < 90) return;
    lastEmit = now;
    if (!onState) return;
    onState({
      status: state.status,
      diff: state.diff,
      dist: Math.floor(state.dist),
      target: state.target,
      coins: state.coins,
      health: state.health,
      maxHealth: state.maxHealth,
      speed: Math.round(state.speed * 3.6),
      progress: clamp(state.dist / state.target, 0, 1),
      maxSpeed: Math.round(stats.maxSpeed * 3.6),
      hits: stats.hits,
    });
  }
  function fire(type, payload) {
    if (onEvent) onEvent({ type, ...(payload || {}) });
  }

  /* ---------- 生成 / 回收 ---------- */
  function freeSlot(kind) {
    const list = pools[kind];
    for (let i = 0; i < list.length; i++) if (!list[i].active) return list[i];
    return null;
  }
  function pickType() {
    const avail = OBSTACLE_TYPES.filter((t) => freeSlot(t.kind));
    if (!avail.length) return null;
    const total = avail.reduce((s, t) => s + t.w, 0);
    let r = Math.random() * total;
    for (const t of avail) {
      r -= t.w;
      if (r <= 0) return t;
    }
    return avail[avail.length - 1];
  }

  function spawnRow(dist, D) {
    const lanes = [0, 1, 2, 3];
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    const blockCount = Math.min(Math.random() < 0.4 ? 1 : D.blockMax, 2);
    const usedLanes = [];
    for (let k = 0; k < blockCount; k++) {
      const type = pickType();
      if (!type) break;
      const slot = freeSlot(type.kind);
      if (!slot) break;
      const lane = lanes[k];
      const lat = clamp(LANES[lane] + rnd(-0.3, 0.3), -ROAD_HALF + 0.7, ROAD_HALF - 0.7);
      // 避免两辆大车堵死同一段
      if (type.kind === "car" && usedLanes.length) continue;
      slot.active = true;
      slot.obj.visible = true;
      slot.type = type;
      slot.kind = type.kind;
      slot.dist = dist + (type.kind === "car" ? rnd(-2, 2) : 0);
      slot.lat = lat;
      slot.phase = rnd(0, 6.3);
      usedLanes.push(lane);
    }
    // 金币放在空车道上
    if (Math.random() < D.coinRate) {
      const freeLanes = lanes.slice(blockCount);
      const lane = freeLanes.length ? freeLanes[(Math.random() * freeLanes.length) | 0] : lanes[3];
      const n = 2 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const slot = coinPool.find((c) => !c.active);
        if (!slot) break;
        slot.active = true;
        slot.obj.visible = true;
        slot.dist = dist + i * 3.4;
        slot.lat = clamp(LANES[lane] + Math.sin(i * 0.9) * 0.7, -ROAD_HALF + 0.7, ROAD_HALF - 0.7);
      }
    }
  }

  function placeScenery(s, from) {
    s.dist = from + rnd(0, 60);
    s.lat = s.side * rnd(8, 34);
    s.obj.scale.setScalar(rnd(0.8, 1.6));
    s.obj.rotation.y = rnd(0, Math.PI * 2);
  }

  function reset(diffKey) {
    const D = DIFFICULTIES[diffKey] || DIFFICULTIES.normal;
    state.diff = D.key;
    state.dist = 0;
    state.target = D.target;
    state.coins = 0;
    state.maxHealth = D.lives;
    state.health = D.lives;
    state.speed = D.baseSpeed;
    state.lat = 0;
    state.steer = 0;
    state.jumpY = 0;
    state.vy = 0;
    state.grounded = true;
    state.invuln = 0;
    state.time = 0;
    state.shake = 0;
    state.nextObstacle = 42;
    state.finishQueued = false;
    stats.maxSpeed = 0;
    stats.hits = 0;
    Object.values(pools).forEach((list) =>
      list.forEach((o) => {
        o.active = false;
        o.obj.visible = false;
      })
    );
    coinPool.forEach((c) => {
      c.active = false;
      c.obj.visible = false;
    });
    sceneryPool.forEach((s) => placeScenery(s, rnd(-30, SPAWN_AHEAD)));
    finishGroup.visible = false;
  }

  /* ---------- 物理 / 玩法模拟 ---------- */
  function step(dt) {
    const st = state;
    const D = DIFFICULTIES[st.diff];

    if (st.status === "menu") {
      st.time += dt;
      st.dist += 9 * dt;
      st.lat = Math.sin(st.time * 0.5) * 2.6;
      return;
    }
    if (st.status !== "playing") return;

    st.time += dt;
    const p = clamp(st.dist / (D.target * 0.75), 0, 1);
    st.speed = lerp(st.speed, lerp(D.baseSpeed, D.maxSpeed, p), clamp(dt * 0.8, 0, 1));
    if (st.invuln > 0) st.invuln = Math.max(0, st.invuln - dt);

    // 横向走位
    const latSpeed = 13 * (0.6 + (st.speed / D.maxSpeed) * 0.6);
    st.lat = clamp(st.lat + st.steer * latSpeed * dt, -(ROAD_HALF - 0.85), ROAD_HALF - 0.85);

    // 跳跃
    if (!st.grounded) {
      st.vy -= GRAVITY * dt;
      st.jumpY += st.vy * dt;
      if (st.jumpY <= 0) {
        st.jumpY = 0;
        st.vy = 0;
        st.grounded = true;
      }
    }

    st.dist += st.speed * dt;
    stats.maxSpeed = Math.max(stats.maxSpeed, st.speed);

    if (!st.finishQueued && st.dist >= st.target - 100) {
      st.finishQueued = true;
      finishGroup.visible = true;
      fire("finishNear");
    }
    if (st.dist >= st.target) {
      st.dist = st.target;
      st.status = "win";
      st.speed = 0;
      audio.win();
      fire("win");
      emitState(true);
      return;
    }

    while (st.nextObstacle < st.dist + SPAWN_AHEAD) {
      spawnRow(st.nextObstacle, D);
      st.nextObstacle += rnd(D.gap[0], D.gap[1]);
    }

    // 撞障碍
    for (const list of Object.values(pools)) {
      for (const o of list) {
        if (!o.active) continue;
        const dd = o.dist - st.dist;
        const dl = o.lat - st.lat;
        if (
          Math.abs(dd) < o.type.halfL + PLAYER_HALF_L &&
          Math.abs(dl) < o.type.halfW + PLAYER_HALF_W
        ) {
          const cleared = st.jumpY > o.type.height - 0.1;
          if (cleared) continue;
          if (st.invuln > 0) continue;
          o.active = false;
          o.obj.visible = false;
          st.health -= 1;
          st.invuln = 1.5;
          st.shake = 0.6;
          st.speed = Math.max(D.baseSpeed * 0.75, st.speed - 7);
          stats.hits += 1;
          audio.hit();
          fire("hit", { health: st.health, kind: o.kind });
          if (st.health <= 0) {
            st.status = "dead";
            st.speed = 0;
            audio.dead();
            fire("dead");
            emitState(true);
            return;
          }
        }
      }
    }

    // 收集金币
    for (const c of coinPool) {
      if (!c.active) continue;
      if (Math.abs(c.dist - st.dist) < 1.5 && Math.abs(c.lat - st.lat) < 1.25 && st.jumpY < 2.4) {
        c.active = false;
        c.obj.visible = false;
        st.coins += 1;
        audio.coin();
        fire("coin", { coins: st.coins });
      }
    }
  }

  /* ---------- 世界布局（每帧跟随玩家） ---------- */
  function layout(dt) {
    const st = state;
    const d = st.dist;

    for (const list of Object.values(pools)) {
      for (const o of list) {
        if (!o.active) continue;
        const localZ = o.dist - d;
        if (localZ < DESPAWN_BEHIND) {
          o.active = false;
          o.obj.visible = false;
          continue;
        }
        o.obj.visible = localZ < FOG_FAR + 8;
        if (!o.obj.visible) continue;
        o.obj.position.set(curveX(o.dist) + o.lat, groundY(o.dist, o.lat), localZ);
        o.obj.rotation.y = -Math.atan(curveDX(o.dist)) + (o.kind === "car" ? Math.PI : 0);
        o.obj.rotation.z = -Math.atan(bankAt(o.dist));
        if (o.kind === "npc") {
          o.phase += dt * 2.4;
          o.obj.rotation.z += Math.sin(o.phase) * 0.05;
          const arm = o.obj.children[3];
          if (arm) arm.rotation.x = Math.sin(o.phase + 1.2) * 0.22;
        }
      }
    }

    for (const c of coinPool) {
      if (!c.active) continue;
      const localZ = c.dist - d;
      if (localZ < DESPAWN_BEHIND) {
        c.active = false;
        c.obj.visible = false;
        continue;
      }
      c.obj.visible = localZ < FOG_FAR + 8;
      if (!c.obj.visible) continue;
      c.obj.position.set(curveX(c.dist) + c.lat, groundY(c.dist, c.lat) + 1.1, localZ);
      c.obj.rotation.y += dt * 3.4;
    }

    for (const s of sceneryPool) {
      if (s.dist - d < DESPAWN_BEHIND - 20) placeScenery(s, d + SPAWN_AHEAD);
      const localZ = s.dist - d;
      s.obj.visible = localZ < FOG_FAR + 20;
      if (!s.obj.visible) continue;
      s.obj.position.set(curveX(s.dist) + s.lat, groundY(s.dist, s.lat) - 0.2, localZ);
    }

    if (finishGroup.visible) {
      const wd = st.target;
      finishGroup.position.set(curveX(wd), groundY(wd, 0), wd - d);
      finishGroup.rotation.y = -Math.atan(curveDX(wd));
      finishGroup.rotation.z = -Math.atan(bankAt(wd));
    }

    for (const c of clouds) {
      if (c.dist - d < -260) c.dist = d + rnd(300, 560);
      const localZ = c.dist - d;
      c.sp.visible = localZ > -200 && localZ < 700;
      if (!c.sp.visible) continue;
      c.sp.position.set(curveX(c.dist) + c.ox, curveY(c.dist) + c.h, localZ);
    }
  }

  /* ---------- 玩家 / 相机表现 ---------- */
  function updatePlayer(dt) {
    const st = state;
    const d = st.dist;
    skater.root.position.set(curveX(d) + st.lat, groundY(d, st.lat) + st.jumpY, 0);
    skater.root.rotation.y = -Math.atan(curveDX(d)) + st.steer * 0.34;
    skater.tilt.rotation.z = Math.atan(bankAt(d)) - st.steer * 0.15;

    const spin = (st.speed * dt) / 0.14;
    for (const w of skater.wheels) w.rotation.x -= spin;
    const t = st.time * (2 + st.speed * 0.25);
    skater.rider.rotation.x = 0.16 + Math.sin(t) * 0.035;
    skater.rider.position.y = Math.sin(t * 2) * 0.04;
    const air = clamp(st.jumpY / 2, 0, 1);
    skater.legs.rotation.x = -air * 0.45;
    skater.arms[0].rotation.z = 1.05 - Math.sin(t) * 0.12 - air * 0.35;
    skater.arms[1].rotation.z = -1.05 + Math.sin(t) * 0.12 + air * 0.35;
    skater.root.visible = !(st.invuln > 0 && Math.floor(st.invuln * 12) % 2 === 0);
  }

  const lookTarget = new THREE.Vector3();
  function updateCamera(dt) {
    const st = state;
    const d = st.dist;
    const camWd = d + CAM_LOCAL_Z;
    const latCam = st.lat * 0.35;
    camera.position.set(
      curveX(camWd) + latCam,
      groundY(camWd, latCam) + 3.5 + st.jumpY * 0.35,
      CAM_LOCAL_Z
    );
    const lookWd = d + 17;
    lookTarget.set(curveX(lookWd) + st.lat * 0.5, groundY(lookWd, 0) + 2.3, 17);
    camera.lookAt(lookTarget);
    camera.rotation.z += clamp(-bankAt(d) * 0.5, -0.07, 0.07);
    if (st.shake > 0) {
      st.shake = Math.max(0, st.shake - dt * 1.7);
      const k = st.shake * 0.55;
      camera.position.x += rnd(-k, k);
      camera.position.y += rnd(-k, k);
    }
    sky.position.set(camera.position.x, 0, camera.position.z);
  }

  /* ---------- 尺寸自适应 ---------- */
  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    camera.fov = aspect < 1 ? 76 : aspect < 1.4 ? 68 : 62;
    camera.updateProjectionMatrix();
  }

  /* ---------- 主循环 ---------- */
  let raf = 0;
  let last = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const t = now / 1000;
    const dt = last ? Math.min(0.05, t - last) : 0.016;
    last = t;

    if (state.status !== "paused") {
      step(dt);
      for (const r of ribbons) updateRibbon(r, state.dist);
      layout(dt);
      updatePlayer(dt);
      updateCamera(dt);
    }
    renderer.render(scene, camera);
    emitState(false);
  }

  /* ---------- 对外 API ---------- */
  const api = {
    start(diffKey) {
      audio.unlock();
      reset(diffKey || state.diff);
      state.status = "playing";
      emitState(true);
      fire("start", { diff: state.diff });
    },
    pause() {
      if (state.status === "playing") {
        state.status = "paused";
        emitState(true);
      }
    },
    resume() {
      if (state.status === "paused") {
        state.status = "playing";
        last = 0;
        emitState(true);
      }
    },
    togglePause() {
      if (state.status === "playing") api.pause();
      else if (state.status === "paused") api.resume();
    },
    toMenu() {
      reset(state.diff);
      state.status = "menu";
      emitState(true);
    },
    setSteer(v) {
      state.steer = clamp(v, -1, 1);
    },
    jump() {
      if (state.status !== "playing" || !state.grounded) return;
      state.grounded = false;
      state.vy = JUMP_V;
      audio.jump();
      fire("jump");
    },
    setMuted(v) {
      audio.setMuted(v);
    },
    resize,
    getState() {
      return { ...state };
    },
    dispose() {
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const list = Array.isArray(o.material) ? o.material : [o.material];
          list.forEach((m) => {
            if (m.map && m.map.dispose) m.map.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
    },
  };

  /* ---------- 初始化 ---------- */
  resize();
  reset("normal");
  sceneryPool.forEach((s) => placeScenery(s, rnd(-30, SPAWN_AHEAD)));
  for (const r of ribbons) updateRibbon(r, 0);
  layout(0.016);
  updatePlayer(0.016);
  state.status = "menu";
  raf = requestAnimationFrame(loop);

  return api;
}
