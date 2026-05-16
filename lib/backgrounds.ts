// ============================================================
// Doova — アニメーション背景 定義 (backgrounds.ts)
// Canvasに描画するロジックを全種まとめています
// ============================================================

export type BackgroundId =
  | "stars"
  | "neon_rain"
  | "sakura"
  | "thunder"
  | "matrix"
  | "aurora"
  | "sand"
  | "meteor";

export interface DoovaBackground {
  id: BackgroundId;
  name: string;
  emoji: string;
  isPro: boolean;
  isNew: boolean;
  isAnimated: true;
  /** Canvas描画関数。返り値のstop()で停止する */
  render: (canvas: HTMLCanvasElement, options?: MountBackgroundOptions) => { stop: () => void };
}

export type MountBackgroundOptions = {
  preview?: boolean;
};

/* ============================================================
   共通ユーティリティ
============================================================ */
function resize(canvas: HTMLCanvasElement) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

function previewCount(count: number, options?: MountBackgroundOptions) {
  return options?.preview ? Math.max(4, Math.floor(count * 0.28)) : count;
}

function previewSize(size: number, options?: MountBackgroundOptions) {
  return options?.preview ? size * 0.65 : size;
}

function previewSpeed(speed: number, options?: MountBackgroundOptions) {
  return options?.preview ? speed * 0.7 : speed;
}

function previewBlur(blur: number, options?: MountBackgroundOptions) {
  return options?.preview ? blur * 0.5 : blur;
}

/* ============================================================
   1. 星空（enhanced）
   - 星の色を多様化・点滅速度をランダム化
   - 流れ星を定期的にスポーン
============================================================ */
const stars: DoovaBackground = {
  id: "stars", name: "星空", emoji: "✨", isPro: true, isNew: false, isAnimated: true,
  render(canvas, options) {
    resize(canvas);
    const ctx = canvas.getContext("2d")!;
    type Star = { x: number; y: number; r: number; phase: number; speed: number; color: string };
    const COLORS = ["#ffffff", "#e8e0ff", "#fcd34d", "#86efac", "#bfdbfe"];
    const pool: Star[] = Array.from({ length: previewCount(140, options) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: previewSize(Math.random() * 1.6 + 0.2, options),
      phase: Math.random() * Math.PI * 2,
      speed: previewSpeed(Math.random() * 0.025 + 0.005, options),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let shoot = { x: 0, y: 0, t: 0, active: false };
    let nextShoot = 120;
    let raf: number;

    function spawnShoot() {
      shoot = { x: Math.random() * canvas.width * 0.5, y: Math.random() * canvas.height * 0.3, t: 0, active: true };
    }

    function draw() {
      ctx.fillStyle = "#03040f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      pool.forEach((s) => {
        s.phase += s.speed;
        const op = 0.25 + Math.sin(s.phase) * 0.3 + 0.3;
        ctx.globalAlpha = Math.max(0, Math.min(1, op));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      });

      if (shoot.active) {
        shoot.t += previewSpeed(5, options);
        const g = ctx.createLinearGradient(shoot.x + shoot.t - 80, 0, shoot.x + shoot.t, 0);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(1, "rgba(255,255,255,0.9)");
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(shoot.x + shoot.t - 80, shoot.y + shoot.t * 0.28);
        ctx.lineTo(shoot.x + shoot.t, shoot.y + shoot.t * 0.3);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (shoot.t > canvas.width) shoot.active = false;
      }
      nextShoot--;
      if (nextShoot <= 0) { spawnShoot(); nextShoot = Math.floor(Math.random() * 180) + 90; }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

/* ============================================================
   2. ネオン雨（enhanced）
   - 5色・グロー強化・雨粒に太さ変化
============================================================ */
const neon_rain: DoovaBackground = {
  id: "neon_rain", name: "ネオン雨", emoji: "🌧", isPro: true, isNew: false, isAnimated: true,
  render(canvas, options) {
    resize(canvas);
    const ctx = canvas.getContext("2d")!;
    const COLORS = ["#00ffff", "#ff00ff", "#f97316", "#00ff88", "#8b5cf6", "#ec4899"];
    type Drop = { x: number; y: number; sp: number; len: number; color: string; w: number; op: number };
    const drops: Drop[] = Array.from({ length: previewCount(50, options) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      sp: previewSpeed(Math.random() * 6 + 3, options),
      len: previewSize(Math.random() * 35 + 12, options),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: previewSize(Math.random() * 1.5 + 0.5, options),
      op: Math.random() * 0.5 + 0.35,
    }));
    let raf: number;
    function draw() {
      ctx.fillStyle = "rgba(4,4,16,0.22)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drops.forEach((d) => {
        ctx.save();
        ctx.shadowColor = d.color;
        ctx.shadowBlur = previewBlur(8, options);
        const g = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.len);
        g.addColorStop(0, "transparent");
        g.addColorStop(0.6, d.color);
        g.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.08, d.y + d.len);
        ctx.strokeStyle = g;
        ctx.lineWidth = d.w;
        ctx.globalAlpha = d.op;
        ctx.stroke();
        ctx.restore();
        d.y += d.sp;
        if (d.y > canvas.height + 50) { d.y = -50; d.x = Math.random() * canvas.width; }
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

/* ============================================================
   3. 桜吹雪（enhanced）
   - 花びら形状をベジェ曲線で描画
   - 揺らぎ・重力演算
============================================================ */
const sakura: DoovaBackground = {
  id: "sakura", name: "桜吹雪", emoji: "🌸", isPro: true, isNew: false, isAnimated: true,
  render(canvas, options) {
    resize(canvas);
    const ctx = canvas.getContext("2d")!;
    const COLORS = ["#fda4af", "#f9a8d4", "#fbcfe8", "#f0abfc", "#fef3c7", "#fed7aa"];
    type Petal = { x: number; y: number; r: number; rot: number; rsp: number; vx: number; vy: number; color: string; op: number; wob: number; ws: number };
    const petals: Petal[] = Array.from({ length: previewCount(45, options) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: previewSize(Math.random() * 6 + 3, options),
      rot: Math.random() * 360,
      rsp: previewSpeed(Math.random() * 2.5 - 1.2, options),
      vx: previewSpeed(Math.random() * 0.6 - 0.3, options),
      vy: previewSpeed(Math.random() * 1.2 + 0.4, options),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      op: Math.random() * 0.45 + 0.45,
      wob: Math.random() * Math.PI * 2,
      ws: previewSpeed(Math.random() * 0.035 + 0.01, options),
    }));

    function drawPetal(r: number) {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 1.5, -r * 1.2, r * 1.5, r * 1.2, 0, r);
      ctx.bezierCurveTo(-r * 1.5, r * 1.2, -r * 1.5, -r * 1.2, 0, -r);
      ctx.closePath();
    }

    let raf: number;
    function draw() {
      ctx.fillStyle = "rgba(253,236,250,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // soft pink bg gradient on first frame is handled by CSS background
      petals.forEach((p) => {
        p.wob += p.ws;
        p.rot += p.rsp;
        p.x += p.vx + Math.sin(p.wob) * 0.45;
        p.y += p.vy;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        drawPetal(p.r);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.op;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

/* ============================================================
   4. 雷・稲妻 (NEW)
   - ランダムな稲妻とフラッシュ
   - 枝分かれロジック付き
============================================================ */
const thunder: DoovaBackground = {
  id: "thunder", name: "雷・稲妻", emoji: "⚡", isPro: true, isNew: true, isAnimated: true,
  render(canvas, options) {
    resize(canvas);
    const ctx = canvas.getContext("2d")!;

    type Seg = { x: number; y: number };
    type Bolt = { segs: Seg[]; life: number; maxLife: number; branches: [Seg, Seg][] };

    let flash = 0;
    const bolts: Bolt[] = [];
    let nextBolt = 80;
    let raf: number;

    function makeBolt(): Bolt {
      const x = Math.random() * canvas.width;
      const segs: Seg[] = [{ x, y: 0 }];
      let cx = x, cy = 0;
      while (cy < canvas.height * 0.85) {
        cy += previewSize(Math.random() * 28 + 12, options);
        cx += previewSize(Math.random() * 56 - 28, options);
        segs.push({ x: cx, y: cy });
      }
      // branches
      const branches: [Seg, Seg][] = [];
      const bi = Math.floor(segs.length * (Math.random() * 0.3 + 0.3));
      if (Math.random() > 0.3) {
        branches.push([
          segs[bi],
          { x: segs[bi].x + Math.random() * 90 - 45, y: segs[bi].y + Math.random() * 70 + 30 },
        ]);
      }
      return { segs, life: 20, maxLife: 20, branches };
    }

    function draw() {
      ctx.fillStyle = `rgba(4,7,18,${flash > 0 ? 0.35 : 0.14})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ambient stars
      if (Math.random() > 0.96) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 0.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,215,255,0.55)";
        ctx.fill();
      }

      if (flash > 0) {
        ctx.fillStyle = `rgba(200,215,255,${flash * 0.025})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flash--;
      }

      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.life--;
        if (b.life <= 0) { bolts.splice(i, 1); continue; }
        const p = b.life / b.maxLife;

        ctx.save();
        ctx.shadowColor = "#9ab4ff";
        ctx.shadowBlur = previewBlur(18 * p, options);
        ctx.strokeStyle = `rgba(190,210,255,${p * 0.9})`;
        ctx.lineWidth = 1.6 * p + 0.4;
        ctx.beginPath();
        ctx.moveTo(b.segs[0].x, b.segs[0].y);
        b.segs.forEach((s) => ctx.lineTo(s.x, s.y));
        ctx.stroke();

        // branches
        b.branches.forEach(([from, to]) => {
          ctx.strokeStyle = `rgba(150,180,255,${p * 0.5})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        });
        ctx.restore();
      }

      nextBolt--;
      if (nextBolt <= 0) {
        bolts.push(makeBolt());
        flash = 10;
        nextBolt = Math.floor((Math.random() * 100 + 40) / previewSpeed(1, options));
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

/* ============================================================
   5. マトリックス (NEW)
   - カタカナ＋英数字の縦スクロール
   - ヘッド（明）＋トレイル（暗）
============================================================ */
const matrix: DoovaBackground = {
  id: "matrix", name: "マトリックス", emoji: "💻", isPro: true, isNew: true, isAnimated: true,
  render(canvas, options) {
    resize(canvas);
    const ctx = canvas.getContext("2d")!;
    const COL_W = options?.preview ? 20 : 14;
    const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホABCDEFGHIJKLMN0123456789@#$%".split("");
    const cols = Math.floor(canvas.width / COL_W);
    type Col = { y: number; speed: number; trail: number };
    const drops: Col[] = Array.from({ length: cols }, () => ({
      y: Math.random() * (canvas.height / COL_W),
      speed: previewSpeed(Math.random() * 0.5 + 0.25, options),
      trail: Math.floor(previewSize(Math.random() * 6 + 4, options)),
    }));
    let raf: number;

    function draw() {
      ctx.fillStyle = "rgba(0,8,4,0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drops.forEach((d, i) => {
        const x = i * COL_W;
        const hy = Math.floor(d.y) * COL_W;

        // head
        ctx.fillStyle = "#ccffcc";
        ctx.font = `bold 12px monospace`;
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, hy);

        // trail
        for (let k = 1; k < d.trail; k++) {
          const ty = hy - k * COL_W;
          if (ty < 0) continue;
          const fade = 1 - k / d.trail;
          ctx.globalAlpha = fade * 0.8;
          ctx.fillStyle = `rgba(0,${Math.floor(180 * fade + 60)},${Math.floor(80 * fade)},1)`;
          ctx.font = `${k === 1 ? "bold " : ""}11px monospace`;
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, ty);
        }
        ctx.globalAlpha = 1;

        d.y += d.speed;
        if (d.y * COL_W > canvas.height + 60) d.y = 0;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

/* ============================================================
   6. オーロラ (NEW)
   - sin波の帯を4層重ねてゆらゆら
   - blur フィルターで発光感
============================================================ */
const aurora: DoovaBackground = {
  id: "aurora", name: "オーロラ", emoji: "🌌", isPro: true, isNew: true, isAnimated: true,
  render(canvas, options) {
    resize(canvas);
    const ctx = canvas.getContext("2d")!;
    type Band = { color: string; freq: number; phase: number; amp: number; yRatio: number; alpha: number };
    const bands: Band[] = [
      { color: "#00ffc8", freq: 0.003, phase: 0.0, amp: 0.18, yRatio: 0.42, alpha: 0.55 },
      { color: "#7c3aed", freq: 0.005, phase: 1.2, amp: 0.12, yRatio: 0.55, alpha: 0.45 },
      { color: "#06b6d4", freq: 0.004, phase: 2.4, amp: 0.16, yRatio: 0.36, alpha: 0.4  },
      { color: "#10b981", freq: 0.006, phase: 0.8, amp: 0.1,  yRatio: 0.50, alpha: 0.35 },
    ];
    let t = 0;
    let raf: number;

    function draw() {
      ctx.fillStyle = "#020915";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // faint stars
      if (t % 4 === 0) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height * 0.5, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,230,255,0.5)";
        ctx.fill();
      }

      bands.forEach((b) => {
        const H = canvas.height;
        const W = canvas.width;
        const baseY = H * b.yRatio;

        // build wavy path
        ctx.save();
        ctx.filter = `blur(${previewBlur(14, options)}px)`;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 3) {
          const wave = Math.sin(x * b.freq + t * previewSpeed(0.018, options) + b.phase) * previewSize(b.amp * H, options);
          ctx.lineTo(x, baseY + wave);
        }
        ctx.lineTo(W, H);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseY - b.amp * H, 0, baseY + b.amp * H + 60);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.4, b.color + "80");
        grad.addColorStop(0.6, b.color + "40");
        grad.addColorStop(1, "transparent");

        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      });

      ctx.globalAlpha = 1;
      t++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

/* ============================================================
   7. 砂嵐 (NEW)
   - 発光する砂粒パーティクルが横風に流れる
   - ブランドカラーのダスト
============================================================ */
const sand: DoovaBackground = {
  id: "sand", name: "砂嵐", emoji: "🏜", isPro: true, isNew: true, isAnimated: true,
  render(canvas, options) {
    resize(canvas);
    const ctx = canvas.getContext("2d")!;
    const COLORS = ["#f97316", "#ec4899", "#fcd34d", "#fb923c", "#fbbf24"];
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; color: string; op: number; life: number; maxLife: number };

    const particles: Particle[] = Array.from({ length: previewCount(320, options) }, () => {
      const ml = Math.random() * 120 + 60;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: previewSpeed(Math.random() * 2.5 + 0.5, options),
        vy: previewSpeed(Math.random() * 0.6 - 0.3, options),
        r: previewSize(Math.random() * 1.5 + 0.25, options),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        op: Math.random() * 0.45 + 0.2,
        life: Math.random() * ml,
        maxLife: ml,
      };
    });

    let raf: number;
    function draw() {
      ctx.fillStyle = "rgba(16,8,4,0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // vignette
      const vg = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 0, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.65);
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(8,4,2,0.4)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.life--;
        if (p.life <= 0) {
          p.life = p.maxLife;
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > canvas.width + 10) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
        }

        const fade = Math.sin((p.life / p.maxLife) * Math.PI);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.op * fade;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

/* ============================================================
   8. 流星群 (NEW)
   - 定期的に流星をスポーン
   - 尾の長さ・色・速度をランダム化
   - 星雲エフェクト付き
============================================================ */
const meteor: DoovaBackground = {
  id: "meteor", name: "流星群", emoji: "🌠", isPro: true, isNew: true, isAnimated: true,
  render(canvas, options) {
    resize(canvas);
    const ctx = canvas.getContext("2d")!;
    const STAR_COLORS = ["#fff", "#e8e0ff", "#fcd34d", "#86efac", "#bfdbfe"];

    // static stars
    const stars = Array.from({ length: previewCount(90, options) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: previewSize(Math.random() * 0.9 + 0.15, options),
      phase: Math.random() * Math.PI * 2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));

    type Meteor = { x: number; y: number; vx: number; vy: number; len: number; color: string; life: number; maxLife: number };
    const meteors: Meteor[] = [];
    let raf: number;
    let spawnTimer: ReturnType<typeof setTimeout>;

    function spawnMeteor() {
      const COLS = ["#fff", "#e8e0ff", "#fcd34d", "#86efac"];
      meteors.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.4,
        vx: previewSpeed(Math.random() * 7 + 4, options),
        vy: previewSpeed(Math.random() * 4 + 2, options),
        len: previewSize(Math.random() * 90 + 40, options),
        color: COLS[Math.floor(Math.random() * COLS.length)],
        life: 55,
        maxLife: 55,
      });
      spawnTimer = setTimeout(spawnMeteor, Math.random() * 1800 + 900);
    }
    spawnMeteor();

    function draw() {
      ctx.fillStyle = "rgba(2,3,14,0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // nebula glow
      const neb = ctx.createRadialGradient(canvas.width * 0.72, canvas.height * 0.3, 0, canvas.width * 0.72, canvas.height * 0.3, canvas.width * 0.45);
      neb.addColorStop(0, "rgba(139,92,246,0.04)");
      neb.addColorStop(1, "transparent");
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // stars
      stars.forEach((s) => {
        s.phase += previewSpeed(0.01, options);
        ctx.globalAlpha = 0.2 + Math.sin(s.phase) * 0.25 + 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      });

      // meteors
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life--;
        if (m.life <= 0) { meteors.splice(i, 1); continue; }
        m.x += m.vx;
        m.y += m.vy;
        const p = m.life / m.maxLife;

        const trailLen = m.len * p;
        const tx = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * trailLen;
        const ty = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * trailLen;
        const trail = ctx.createLinearGradient(tx, ty, m.x, m.y);
        trail.addColorStop(0, "transparent");
        trail.addColorStop(1, m.color);

        ctx.globalAlpha = p;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.8 * p;
        ctx.stroke();

        // tip glow
        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.2 * p, 0, Math.PI * 2);
        ctx.fillStyle = m.color;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return {
      stop: () => {
        cancelAnimationFrame(raf);
        clearTimeout(spawnTimer);
      },
    };
  },
};

/* ============================================================
   エクスポート
============================================================ */
export const BACKGROUNDS: Record<BackgroundId, DoovaBackground> = {
  stars, neon_rain, sakura, thunder, matrix, aurora, sand, meteor,
};

export const BACKGROUND_LIST = Object.values(BACKGROUNDS);

/* ============================================================
   Reactコンポーネント用フック — useBackground
   使用例:
     const canvasRef = useRef<HTMLCanvasElement>(null);
     useBackground(canvasRef, "aurora");
============================================================ */
export function mountBackground(
  canvas: HTMLCanvasElement,
  id: BackgroundId,
  options?: MountBackgroundOptions,
): () => void {
  const bg = BACKGROUNDS[id];
  if (!bg) return () => {};
  const { stop } = bg.render(canvas, options);
  return stop;
}
