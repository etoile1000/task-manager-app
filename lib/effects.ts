// ============================================================
// Doova — 完了エフェクト定義 (effects.ts)
// タスク完了時に呼び出すエフェクト関数をまとめています
//
// 使用例:
//   import { triggerEffect } from "@/lib/effects";
//   triggerEffect("ko");          // K.O!
//   triggerEffect("pen");         // ペン線
//   triggerEffect("beam");        // ビーム
//   triggerEffect("firework");    // 花火
//   triggerEffect("confetti");    // コンフェッティ
// ============================================================

export type EffectId = "none" | "ko" | "combo" | "sakura" | "beam" | "confetti";

/* ============================================================
   内部：Canvas + Overlay の生成・破棄
============================================================ */
let _canvas: HTMLCanvasElement | null = null;
let _overlay: HTMLDivElement | null = null;
let _raf: number | null = null;
let _timeouts: ReturnType<typeof setTimeout>[] = [];

function getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!_canvas) {
    _canvas = document.createElement("canvas");
    _canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998;";
    document.body.appendChild(_canvas);
  }
  _canvas.width = window.innerWidth;
  _canvas.height = window.innerHeight;
  _canvas.style.display = "block";
  return { canvas: _canvas, ctx: _canvas.getContext("2d")! };
}

function getOverlay(): HTMLDivElement {
  if (!_overlay) {
    _overlay = document.createElement("div");
    _overlay.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;";
    document.body.appendChild(_overlay);
  }
  _overlay.innerHTML = "";
  return _overlay;
}

function clearEffect() {
  if (_raf !== null) { cancelAnimationFrame(_raf); _raf = null; }
  _timeouts.forEach(clearTimeout);
  _timeouts = [];
  if (_canvas) _canvas.style.display = "none";
  if (_overlay) _overlay.innerHTML = "";
}

function scheduleTimeout(fn: () => void, ms: number) {
  _timeouts.push(setTimeout(fn, ms));
}

/* ============================================================
   共通スタイル注入（一度だけ）
============================================================ */
function ensureStyles() {
  if (document.getElementById("doova-effect-styles")) return;
  const st = document.createElement("style");
  st.id = "doova-effect-styles";
  st.textContent = `
    @keyframes dv-koRing {
      to { width: min(110vw,110vh); height: min(110vw,110vh); opacity: 0; border-width: 0.5px; }
    }
    @keyframes dv-koText {
      0%   { opacity:0; transform: translate(-50%,-50%) scale(0.2) rotate(-8deg); }
      60%  { opacity:1; transform: translate(-50%,-50%) scale(1.12) rotate(2deg); }
      80%  { transform: translate(-50%,-50%) scale(0.96) rotate(-1deg); }
      100% { opacity:1; transform: translate(-50%,-50%) scale(1) rotate(0deg); }
    }
    @keyframes dv-koFlash {
      0%   { opacity: 0.55; }
      100% { opacity: 0; }
    }
    @keyframes dv-koFadeOut {
      0%   { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes dv-sakuraFall {
      0%   { opacity: 0; transform: translate3d(0,-20px,0) rotate(0deg); }
      12%  { opacity: 1; }
      100% { opacity: 0; transform: translate3d(var(--dx),110vh,0) rotate(720deg); }
    }
  `;
  document.head.appendChild(st);
}

/* ============================================================
   1. K.O! — 衝撃波 + 白フラッシュ + 巨大グラデーション文字
============================================================ */
function effectKO() {
  ensureStyles();
  clearEffect();
  const overlay = getOverlay();

  // 白フラッシュ
  const flash = document.createElement("div");
  flash.style.cssText =
    "position:fixed;inset:0;background:#fff;pointer-events:none;z-index:9997;" +
    "animation:dv-koFlash 0.22s ease-out forwards;";
  overlay.appendChild(flash);

  // 衝撃波リング × 3
  const ringColors = ["#f97316", "#ec4899", "#8b5cf6"];
  ringColors.forEach((color, i) => {
    const ring = document.createElement("div");
    ring.style.cssText = `
      position:fixed;left:50%;top:50%;
      transform:translate(-50%,-50%);
      width:24px;height:24px;border-radius:50%;
      border:3px solid ${color};pointer-events:none;
      animation:dv-koRing 0.65s ${i * 0.09}s cubic-bezier(0.2,0,0.8,1) forwards;
    `;
    overlay.appendChild(ring);
  });

  // K.O! テキスト
  const txt = document.createElement("div");
  txt.textContent = "K.O!";
  txt.style.cssText = `
    position:fixed;left:50%;top:50%;
    transform:translate(-50%,-50%) scale(0) rotate(-8deg);
    font-family:'Outfit','DM Serif Display',sans-serif;
    font-size:clamp(72px,14vw,150px);font-weight:700;letter-spacing:-0.05em;
    background:linear-gradient(135deg,#f97316,#ec4899,#8b5cf6);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    filter:drop-shadow(0 0 24px rgba(249,115,22,0.7));
    pointer-events:none;
    animation:dv-koText 0.55s 0.08s cubic-bezier(0.34,1.56,0.64,1) forwards;
  `;
  overlay.appendChild(txt);

  // フェードアウト
  scheduleTimeout(() => {
    txt.style.animation = "dv-koFadeOut 0.4s ease-out forwards";
  }, 900);
  scheduleTimeout(clearEffect, 1400);
}

/* ============================================================
   2. ペン線 — オレンジの線がスーッと引かれてフェードアウト
   アニメーション: 線描 → ドリップ → フェード
============================================================ */
function effectPen() {
  clearEffect();
  const { canvas, ctx } = getCanvas();
  const W = canvas.width, H = canvas.height;
  const cy = H * 0.5;
  const halfLen = Math.min(W * 0.42, 320);
  const x0 = W * 0.5 - halfLen;
  const x1 = W * 0.5 + halfLen;

  let progress = 0; // 0→1: 線を引く
  let fadeAlpha = 1; // 1→0: フェード

  const ORANGE = "#f97316";

  function drawLine(toX: number, alpha: number) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = ORANGE;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(x0, cy);
    ctx.lineTo(toX, cy);
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();

    // ink tip dot
    ctx.beginPath();
    ctx.arc(toX, cy, 5 * Math.min(1, progress * 5), 0, Math.PI * 2);
    ctx.fillStyle = ORANGE;
    ctx.fill();
    ctx.restore();
  }

  function phase1() {
    progress = Math.min(1, progress + 0.055);
    drawLine(x0 + (x1 - x0) * progress, 1);
    if (progress < 1) { _raf = requestAnimationFrame(phase1); }
    else { _raf = requestAnimationFrame(phase2); }
  }
  function phase2() {
    fadeAlpha = Math.max(0, fadeAlpha - 0.045);
    drawLine(x1, fadeAlpha);
    if (fadeAlpha > 0) { _raf = requestAnimationFrame(phase2); }
    else clearEffect();
  }
  _raf = requestAnimationFrame(phase1);
}

/* ============================================================
   3. ビーム — 3色ビームが時間差で画面を横断
============================================================ */
function effectBeam() {
  clearEffect();
  const { canvas, ctx } = getCanvas();
  const W = canvas.width, H = canvas.height;
  const cy = H * 0.5;

  type Beam = { color: string; yOff: number; w: number; blur: number; delay: number };
  const beams: Beam[] = [
    { color: "#f97316", yOff: 0,   w: 8, blur: 28, delay: 0   },
    { color: "#ec4899", yOff: 28,  w: 4, blur: 18, delay: 0.18 },
    { color: "#8b5cf6", yOff: -22, w: 3, blur: 14, delay: 0.34 },
  ];

  let phase = 0;
  const SPEED = 0.055;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    beams.forEach((b) => {
      const t = phase - b.delay;
      if (t < 0 || t > 2.4) return;
      // leading edge position: 0→W*1.5
      const head = Math.min(W * 1.5, t * W * 0.9);
      const tail = Math.max(-W * 0.1, head - W * 0.55);

      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = b.blur;

      const g = ctx.createLinearGradient(tail, 0, head, 0);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.55, b.color + "ee");
      g.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.moveTo(tail, cy + b.yOff);
      ctx.lineTo(head, cy + b.yOff);
      ctx.strokeStyle = g;
      ctx.lineWidth = b.w;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    });

    // white flash early
    if (phase < 0.2) {
      ctx.fillStyle = `rgba(255,255,255,${(0.2 - phase) * 0.3})`;
      ctx.fillRect(0, 0, W, H);
    }

    phase += SPEED;
    if (phase < 3) { _raf = requestAnimationFrame(draw); }
    else clearEffect();
  }
  _raf = requestAnimationFrame(draw);
}

/* ============================================================
   4. 桜吹雪 — 既存エフェクト互換
============================================================ */
function effectSakura() {
  ensureStyles();
  clearEffect();
  const overlay = getOverlay();
  const colors = ["#f9a8d4", "#fda4af", "#c4b5fd", "#fbcfe8", "#fecdd3"];

  for (let i = 0; i < 36; i++) {
    scheduleTimeout(() => {
      const petal = document.createElement("div");
      petal.style.cssText = `
        position:absolute;top:-24px;left:${Math.random() * 100}vw;
        width:${Math.random() * 8 + 6}px;height:${Math.random() * 5 + 4}px;
        border-radius:50%;background:${colors[Math.floor(Math.random() * colors.length)]};
        --dx:${Math.random() * 80 - 40}px;
        animation:dv-sakuraFall ${Math.random() * 1.8 + 2.2}s linear forwards;
      `;
      overlay.appendChild(petal);
      scheduleTimeout(() => petal.remove(), 4300);
    }, i * 55);
  }

  scheduleTimeout(clearEffect, 4800);
}

/* ============================================================
   5. 花火 — 多発打ち上げ、重力演算付きパーティクル
============================================================ */
function effectFirework() {
  clearEffect();
  const { canvas, ctx } = getCanvas();
  const W = canvas.width, H = canvas.height;

  const COLORS = ["#f97316", "#ec4899", "#8b5cf6", "#fcd34d", "#00ffc8", "#86efac", "#fb923c", "#a78bfa"];

  type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number; color: string };
  const particles: Particle[] = [];

  function burst(bx: number, by: number, count = 64) {
    const color1 = COLORS[Math.floor(Math.random() * COLORS.length)];
    const color2 = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const speed = Math.random() * 7 + 2.5;
      const life = Math.floor(Math.random() * 30 + 40);
      particles.push({
        x: bx, y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life, maxLife: life,
        r: Math.random() * 2.2 + 0.8,
        color: Math.random() > 0.5 ? color1 : color2,
      });
    }
  }

  // launch sequence
  burst(W * 0.5, H * 0.45, 70);
  scheduleTimeout(() => burst(W * 0.3, H * 0.35, 55), 180);
  scheduleTimeout(() => burst(W * 0.72, H * 0.38, 55), 320);
  scheduleTimeout(() => burst(W * 0.2, H * 0.6, 40), 500);
  scheduleTimeout(() => burst(W * 0.8, H * 0.58, 40), 680);

  function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 0, W, H);

    let alive = false;
    particles.forEach((p) => {
      if (p.life <= 0) return;
      p.life--;
      p.vy += 0.09; // gravity
      p.vx *= 0.985; // drag
      p.x += p.vx; p.y += p.vy;
      alive = true;

      const op = (p.life / p.maxLife);
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + op * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = op;
      ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    if (alive) { _raf = requestAnimationFrame(draw); }
    else { scheduleTimeout(clearEffect, 200); }
  }
  _raf = requestAnimationFrame(draw);
}

/* ============================================================
   5. コンフェッティ — 物理ベースの紙吹雪 150枚
   ・矩形・円・三角の3形状
   ・風揺れ・回転・重力
============================================================ */
function effectConfetti() {
  clearEffect();
  const { canvas, ctx } = getCanvas();
  const W = canvas.width, H = canvas.height;

  const COLORS = [
    "#f97316", "#ec4899", "#8b5cf6", "#fcd34d",
    "#00ffc8", "#fb923c", "#a78bfa", "#34d399",
    "#f472b6", "#38bdf8", "#facc15",
  ];
  type Piece = {
    x: number; y: number; vx: number; vy: number;
    rot: number; rsp: number;
    color: string; shape: "rect" | "circle" | "tri";
    w: number; h: number; op: number;
    wob: number; ws: number;
  };

  const pieces: Piece[] = Array.from({ length: 155 }, () => {
    const shapes: Piece["shape"][] = ["rect", "circle", "tri"];
    return {
      x: Math.random() * W,
      y: -30 - Math.random() * 220,
      vx: Math.random() * 3.5 - 1.75,
      vy: Math.random() * 3.2 + 1.8,
      rot: Math.random() * 360,
      rsp: Math.random() * 9 - 4.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
      op: Math.random() * 0.3 + 0.7,
      wob: Math.random() * Math.PI * 2,
      ws: Math.random() * 0.06 + 0.02,
    };
  });

  function drawShape(p: Piece) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.op;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 3;

    if (p.shape === "rect") {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -p.h);
      ctx.lineTo(p.w / 2, p.h / 2);
      ctx.lineTo(-p.w / 2, p.h / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    pieces.forEach((p) => {
      if (p.y > H + 30) return;
      alive = true;
      p.wob += p.ws;
      p.x += p.vx + Math.sin(p.wob) * 0.6;
      p.y += p.vy;
      p.vy = Math.min(p.vy + 0.04, 6); // gravity cap
      p.rot += p.rsp;
      drawShape(p);
    });
    ctx.globalAlpha = 1;
    if (alive) { _raf = requestAnimationFrame(draw); }
    else clearEffect();
  }
  _raf = requestAnimationFrame(draw);
}

/* ============================================================
   エクスポート
============================================================ */
export const EFFECTS: Record<EffectId, () => void> = {
  none:      clearEffect,
  ko:        effectKO,
  combo:     effectFirework,
  sakura:    effectSakura,
  beam:      effectBeam,
  confetti:  effectConfetti,
};

/** タスク完了時にこれを呼ぶだけ */
export function triggerEffect(id: EffectId): void {
  clearEffect(); // 前のエフェクトを確実にクリア
  const fn = EFFECTS[id];
  if (fn && id !== "none") fn();
}

/** 設定画面用メタデータ */
export const EFFECT_META: { id: EffectId; name: string; emoji: string; desc: string }[] = [
  { id: "none",     name: "なし",       emoji: "🚫", desc: "エフェクトなし" },
  { id: "ko",       name: "K.O!",       emoji: "💥", desc: "衝撃波＋巨大文字が炸裂" },
  { id: "combo",    name: "コンボ！",   emoji: "🔥", desc: "連続達成を花火で祝う" },
  { id: "sakura",   name: "桜吹雪",     emoji: "🌸", desc: "ふわっと花びらが舞う" },
  { id: "beam",     name: "ビーム",     emoji: "🔦", desc: "3色の光線が画面を横断" },
  { id: "confetti", name: "コンフェッティ", emoji: "🎊", desc: "物理演算で降り注ぐ紙吹雪" },
];
