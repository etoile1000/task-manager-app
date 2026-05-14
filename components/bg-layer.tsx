"use client";

import { useEffect, useRef } from "react";

const GRAD_BGs: { id: string; grad: string }[] = [
  { id: "sunset", grad: "linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)" },
  { id: "ocean", grad: "linear-gradient(135deg,#0ea5e9,#06b6d4,#10b981)" },
  { id: "aurora", grad: "linear-gradient(135deg,#4f46e5,#7c3aed,#059669)" },
  { id: "midnight", grad: "linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)" },
  { id: "rose", grad: "linear-gradient(135deg,#fda4af,#f9a8d4,#c4b5fd)" },
  { id: "forest", grad: "linear-gradient(135deg,#14532d,#166534,#065f46)" },
  { id: "gold", grad: "linear-gradient(135deg,#92400e,#d97706,#fbbf24)" },
  { id: "peach", grad: "linear-gradient(135deg,#fed7aa,#fca5a5,#f9a8d4)" },
];

export const ANIM_PREVIEW: Record<string, string> = {
  stars: "#0f0e17",
  neon: "#0f0e17",
  sakura: "#fde8f3",
  bubbles: "#e0f2fe",
};

const GRAD_LABELS: Record<string, string> = {
  sunset: "サンセット",
  ocean: "オーシャン",
  aurora: "オーロラ",
  midnight: "ミッドナイト",
  rose: "ローズ",
  forest: "フォレスト",
  gold: "ゴールド",
  peach: "ピーチ",
};

type BgLayerProps = {
  currentBg: string;
  photoSrc: string | null;
};

export function BgLayer({ currentBg, photoSrc }: BgLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    const imgEl = imgRef.current;
    if (!layer || !canvas || !imgEl) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    canvas.style.display = "none";
    imgEl.style.display = "none";
    layer.style.background = "";

    const grad = GRAD_BGs.find((b) => b.id === currentBg);
    if (grad) {
      layer.style.background = grad.grad;
      return;
    }

    if (currentBg === "photo" && photoSrc) {
      imgEl.src = photoSrc;
      imgEl.style.display = "block";
      return;
    }

    const animId = ["stars", "neon", "sakura", "bubbles"].includes(currentBg)
      ? currentBg
      : null;
    if (animId) {
      canvas.style.display = "block";
      layer.style.background = ANIM_PREVIEW[animId] ?? "";
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      const onResize = () => resize();
      window.addEventListener("resize", onResize);

      const W = () => canvas.width;
      const H = () => canvas.height;

      if (animId === "stars") {
        const stars = Array.from({ length: 180 }, () => ({
          x: Math.random(),
          y: Math.random(),
          r: Math.random() * 1.5 + 0.3,
          sp: Math.random() * 0.3 + 0.05,
          tail: 0,
        }));
        const draw = () => {
          ctx.clearRect(0, 0, W(), H());
          ctx.fillStyle = "rgba(15,14,23,0.04)";
          ctx.fillRect(0, 0, W(), H());
          stars.forEach((s) => {
            ctx.beginPath();
            ctx.arc(s.x * W(), s.y * H(), s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.random() * 0.6})`;
            ctx.fill();
            if (Math.random() < 0.003) s.tail = 1;
            if (s.tail > 0) {
              ctx.beginPath();
              ctx.moveTo(s.x * W(), s.y * H());
              ctx.lineTo(s.x * W() - 20, s.y * H() + 8);
              ctx.strokeStyle = "rgba(255,255,255,0.6)";
              ctx.lineWidth = 1;
              ctx.stroke();
              s.tail++;
              if (s.tail > 8) s.tail = 0;
            }
          });
          animFrameRef.current = requestAnimationFrame(draw);
        };
        draw();
      } else if (animId === "neon") {
        const drops = Array.from({ length: 80 }, () => ({
          x: Math.random() * 1000,
          y: Math.random() * 800,
          sp: Math.random() * 8 + 4,
          len: Math.random() * 30 + 10,
          color: ["#00ffff", "#ff00ff", "#00ff88", "#ffff00"][
            Math.floor(Math.random() * 4)
          ]!,
        }));
        const draw = () => {
          ctx.fillStyle = "rgba(15,14,23,0.15)";
          ctx.fillRect(0, 0, W(), H());
          drops.forEach((d) => {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x, d.y + d.len);
            ctx.strokeStyle = d.color;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = d.color;
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
            d.y += d.sp;
            if (d.y > H() + 50) {
              d.y = -50;
              d.x = Math.random() * W();
            }
          });
          animFrameRef.current = requestAnimationFrame(draw);
        };
        draw();
      } else if (animId === "sakura") {
        const petals = Array.from({ length: 60 }, () => ({
          x: Math.random(),
          y: Math.random(),
          r: Math.random() * 6 + 4,
          sp: Math.random() * 1.5 + 0.5,
          sw: Math.random() * 2 - 1,
          rot: Math.random() * 360,
          rsp: Math.random() * 2 - 1,
        }));
        const draw = () => {
          ctx.clearRect(0, 0, W(), H());
          ctx.fillStyle = "rgba(253,232,243,0.15)";
          ctx.fillRect(0, 0, W(), H());
          petals.forEach((p) => {
            ctx.save();
            ctx.translate(p.x * W(), p.y * H());
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(249,168,212,0.8)";
            ctx.fill();
            ctx.restore();
            p.y += (p.sp / H()) * 2;
            p.x += (p.sw / W()) * 0.5;
            p.rot += p.rsp;
            if (p.y > 1.1) {
              p.y = -0.05;
              p.x = Math.random();
            }
          });
          animFrameRef.current = requestAnimationFrame(draw);
        };
        draw();
      } else if (animId === "bubbles") {
        const bubs = Array.from({ length: 40 }, () => ({
          x: Math.random(),
          y: Math.random() + 1,
          r: Math.random() * 20 + 8,
          sp: Math.random() * 0.8 + 0.3,
        }));
        const draw = () => {
          ctx.clearRect(0, 0, W(), H());
          ctx.fillStyle = "rgba(224,242,254,0.2)";
          ctx.fillRect(0, 0, W(), H());
          bubs.forEach((b) => {
            ctx.beginPath();
            ctx.arc(b.x * W(), b.y * H(), b.r, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(14,165,233,0.5)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = "rgba(14,165,233,0.08)";
            ctx.fill();
            b.y -= b.sp / H();
            if (b.y < -0.1) {
              b.y = 1.1;
              b.x = Math.random();
            }
          });
          animFrameRef.current = requestAnimationFrame(draw);
        };
        draw();
      }

      return () => {
        window.removeEventListener("resize", onResize);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      };
    }

    return undefined;
  }, [currentBg, photoSrc]);

  return (
    <div id="bg-layer" ref={layerRef}>
      <canvas
        id="bg-canvas"
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data URL from user */}
      <img
        id="bg-image"
        ref={imgRef}
        alt=""
        className="absolute inset-0 hidden h-full w-full object-cover"
      />
    </div>
  );
}

export const GRAD_BG_META = GRAD_BGs.map((b) => ({
  id: b.id,
  label: GRAD_LABELS[b.id] ?? b.id,
  grad: b.grad,
}));

export const ANIM_BG_META = [
  { id: "stars", label: "星空" },
  { id: "neon", label: "ネオン雨" },
  { id: "sakura", label: "桜吹雪" },
  { id: "bubbles", label: "バブル" },
];
