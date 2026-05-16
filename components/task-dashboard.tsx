"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKGROUND_LIST, mountBackground } from "@/lib/backgrounds";
import { EFFECT_META, triggerEffect, type EffectId } from "@/lib/effects";
import { createClient } from "@/lib/supabase";
import { applyTheme, THEME_LIST, type ThemeId } from "@/lib/themes";
import {
  daysUntil,
  dueLabel,
  dueLabelPrint,
  PRIORITY_LABEL,
  scoreTask,
  normalizeCategories,
} from "@/lib/task-utils";
import type { Priority, ProfileRow, TaskRow } from "@/lib/types";

const DEFAULT_CATS = ["仕事", "etoile", "個人"];

const THEME_STORAGE_KEY = "doova-theme";
const EFFECT_STORAGE_KEY = "doova-effect";

const GRADIENT_BACKGROUNDS = [
  { id: "sunset", label: "サンセット", grad: "linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)" },
  { id: "ocean", label: "オーシャン", grad: "linear-gradient(135deg,#0ea5e9,#06b6d4,#10b981)" },
  { id: "aurora_grad", label: "オーロラ", grad: "linear-gradient(135deg,#4f46e5,#7c3aed,#059669)" },
  { id: "midnight", label: "ミッドナイト", grad: "linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)" },
  { id: "rose", label: "ローズ", grad: "linear-gradient(135deg,#fda4af,#f9a8d4,#c4b5fd)" },
  { id: "forest", label: "フォレスト", grad: "linear-gradient(135deg,#14532d,#166534,#065f46)" },
  { id: "gold", label: "ゴールド", grad: "linear-gradient(135deg,#92400e,#d97706,#fbbf24)" },
  { id: "peach", label: "ピーチ", grad: "linear-gradient(135deg,#fed7aa,#fca5a5,#f9a8d4)" },
] as const;

function normalizeEffect(raw: string | null | undefined): EffectId {
  const v = String(raw ?? "ko").trim().toLowerCase();
  if (EFFECT_META.some((e) => e.id === v)) return v as EffectId;
  return "ko";
}

function normalizeTheme(raw: string | null | undefined): ThemeId {
  const v = String(raw ?? "minimal").trim().toLowerCase();
  if (THEME_LIST.some((t) => t.id === v)) return v as ThemeId;
  return "minimal";
}

function normalizeBackground(raw: string | null | undefined): string {
  const v = String(raw ?? "none").trim().toLowerCase();
  if (v === "neon") return "neon_rain";
  if (v === "none" || v === "photo") return v;
  if (GRADIENT_BACKGROUNDS.some((b) => b.id === v)) return v;
  if (BACKGROUND_LIST.some((b) => b.id === v)) return v;
  return "none";
}

type Props = {
  userId: string;
  userEmail: string;
  initialProfile: ProfileRow;
  initialTasks: TaskRow[];
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priorityBadgeClass(p: Priority) {
  return (
    {
      urgent: "badge-urgent",
      high: "badge-high",
      mid: "badge-mid",
      low: "badge-low",
    } as const
  )[p] ?? "badge-mid";
}

function printBadgeClass(p: Priority) {
  return (
    {
      urgent: "p-urgent",
      high: "p-high",
      mid: "p-mid",
      low: "p-low",
    } as const
  )[p] ?? "p-mid";
}

function EffectOptionPreview({ id }: { id: EffectId }) {
  return (
    <div className="effect-opt-preview" aria-hidden>
      {id === "none" ? <i className="ti ti-minus effect-preview-none" /> : null}
      {id === "ko" ? (
        <svg width="100%" height="100%" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="40" fill="#08060f" />
          <circle cx="32" cy="20" r="18" fill="none" stroke="#f97316" strokeWidth="0.6" opacity="0.5" />
          <circle cx="32" cy="20" r="12" fill="none" stroke="#ec4899" strokeWidth="0.6" opacity="0.6" />
          <circle cx="32" cy="20" r="6" fill="none" stroke="#8b5cf6" strokeWidth="0.6" opacity="0.7" />
          <line x1="14" y1="20" x2="4" y2="20" stroke="#f97316" strokeWidth="0.8" opacity="0.6" />
          <line x1="50" y1="20" x2="60" y2="20" stroke="#f97316" strokeWidth="0.8" opacity="0.6" />
          <line x1="32" y1="2" x2="32" y2="0" stroke="#ec4899" strokeWidth="0.8" opacity="0.6" />
          <line x1="32" y1="38" x2="32" y2="40" stroke="#ec4899" strokeWidth="0.8" opacity="0.6" />
          <line x1="19" y1="7" x2="14" y2="2" stroke="#8b5cf6" strokeWidth="0.8" opacity="0.5" />
          <line x1="45" y1="7" x2="50" y2="2" stroke="#8b5cf6" strokeWidth="0.8" opacity="0.5" />
          <line x1="19" y1="33" x2="14" y2="38" stroke="#8b5cf6" strokeWidth="0.8" opacity="0.5" />
          <line x1="45" y1="33" x2="50" y2="38" stroke="#8b5cf6" strokeWidth="0.8" opacity="0.5" />
          <defs>
            <linearGradient id="ef-kg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <text x="32" y="25" textAnchor="middle" fontFamily="'Outfit',sans-serif" fontSize="13" fontWeight="700" letterSpacing="-0.5" fill="url(#ef-kg)">K.O!</text>
        </svg>
      ) : null}
      {id === "pen" ? (
        <svg width="100%" height="100%" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="40" fill="#0e0a06" />
          <defs>
            <linearGradient id="ef-slg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="75%" stopColor="#f97316" stopOpacity="1" />
              <stop offset="100%" stopColor="#fcd34d" stopOpacity="1" />
            </linearGradient>
          </defs>
          <line x1="6" y1="20" x2="58" y2="20" stroke="url(#ef-slg)" strokeWidth="6" strokeLinecap="round" opacity="0.12" />
          <line x1="6" y1="20" x2="58" y2="20" stroke="url(#ef-slg)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="58" cy="20" r="6" fill="#f97316" opacity="0.15" />
          <circle cx="58" cy="20" r="3" fill="#fcd34d" opacity="0.9" />
        </svg>
      ) : null}
      {id === "beam" ? (
        <svg width="100%" height="100%" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="40" fill="#06040f" />
          <defs>
            <linearGradient id="ef-b1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
              <stop offset="30%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ef-b2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
              <stop offset="20%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ef-b3" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="40%" stopColor="#8b5cf6" stopOpacity="0.7" />
              <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="19" x2="64" y2="19" stroke="url(#ef-b1)" strokeWidth="8" opacity="0.15" />
          <line x1="0" y1="19" x2="64" y2="19" stroke="url(#ef-b1)" strokeWidth="3" />
          <line x1="0" y1="25" x2="64" y2="25" stroke="url(#ef-b2)" strokeWidth="5" opacity="0.12" />
          <line x1="0" y1="25" x2="64" y2="25" stroke="url(#ef-b2)" strokeWidth="1.8" />
          <line x1="0" y1="14" x2="64" y2="14" stroke="url(#ef-b3)" strokeWidth="4" opacity="0.1" />
          <line x1="0" y1="14" x2="64" y2="14" stroke="url(#ef-b3)" strokeWidth="1.4" />
        </svg>
      ) : null}
      {id === "firework" ? (
        <svg width="100%" height="100%" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="40" fill="#070510" />
          <defs>
            <radialGradient id="fw-glow" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
              <stop offset="55%" stopColor="#ec4899" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="64" height="40" fill="url(#fw-glow)" />
          {[[31, 18, "#f97316"], [18, 26, "#ec4899"], [45, 25, "#8b5cf6"]].map(([cx, cy, color], idx) => (
            <g key={idx} opacity="0.85">
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (Math.PI * 2 * i) / 8;
                const x2 = Number(cx) + Math.cos(angle) * (idx === 0 ? 10 : 6);
                const y2 = Number(cy) + Math.sin(angle) * (idx === 0 ? 10 : 6);
                return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={String(color)} strokeWidth="0.8" strokeLinecap="round" />;
              })}
              <circle cx={cx} cy={cy} r="1.5" fill={String(color)} />
            </g>
          ))}
        </svg>
      ) : null}
      {id === "confetti" ? (
        <svg width="100%" height="100%" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="40" fill="#08060f" />
          <defs>
            <linearGradient id="cf-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect width="64" height="40" fill="url(#cf-bg)" />
          {[[10, 8, "#f97316"], [22, 14, "#ec4899"], [36, 7, "#8b5cf6"], [50, 13, "#fcd34d"], [15, 27, "#38bdf8"], [30, 30, "#34d399"], [45, 25, "#fb923c"], [55, 31, "#f472b6"], [7, 20, "#a78bfa"]].map(([x, y, color], i) => (
            <rect key={i} x={x} y={y} width="5" height="2.5" rx="0.8" fill={String(color)} transform={`rotate(${i * 23} ${x} ${y})`} />
          ))}
        </svg>
      ) : null}
    </div>
  );
}

function BackgroundPreviewCanvas({ id }: { id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const background = BACKGROUND_LIST.find((item) => item.id === id);
    if (!background) return;

    let stop: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const resize = () => {
      canvas.width = canvas.offsetWidth || 160;
      canvas.height = canvas.offsetHeight || 100;
    };

    const start = () => {
      if (!mounted || stop) return;
      resize();
      stop = mountBackground(canvas, background.id, { preview: true });
    };

    const observer = new ResizeObserver(() => {
      resize();
      start();
    });

    observer.observe(canvas);
    timer = setTimeout(start, 0);

    return () => {
      mounted = false;
      observer.disconnect();
      if (timer) clearTimeout(timer);
      stop?.();
    };
  }, [id]);

  return <canvas className="bg-preview" ref={canvasRef} aria-hidden />;
}

function ProUpgradePanel() {
  return (
    <div className="pro-upgrade-panel">
      <span className="pro-upgrade-ribbon">PRO</span>
      <h3 className="pro-upgrade-title">Proプランへのアップグレード</h3>
      <p className="pro-upgrade-text">
        グラデーション・アニメーション背景、マイ写真、完了時のエフェクトなど、これらの Pro
        限定機能をご利用いただけます。
      </p>
      <a href="/api/checkout" className="pro-upgrade-cta">
        <i className="ti ti-sparkles" /> アップグレードする
      </a>
    </div>
  );
}

export default function TaskDashboard({
  userId,
  userEmail,
  initialProfile,
  initialTasks,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isPro = initialProfile.is_pro === true;
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgStopRef = useRef<(() => void) | null>(null);

  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [theme, setTheme] = useState<ThemeId>(
    normalizeTheme(initialProfile.theme),
  );
  const [bg, setBg] = useState(() =>
    isPro ? normalizeBackground(initialProfile.bg) : "none",
  );
  const [effect, setEffect] = useState<EffectId>(() =>
    isPro ? normalizeEffect(initialProfile.effect) : "none",
  );
  const [categories, setCategories] = useState<string[]>(() => {
    const n = normalizeCategories(initialProfile.categories);
    return n.length ? n : [...DEFAULT_CATS];
  });
  const [filter, setFilter] = useState<string>("all");
  const [showDone, setShowDone] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fPriority, setFPriority] = useState<Priority>("mid");
  const [fDue, setFDue] = useState("");
  const [fCat, setFCat] = useState(categories[0] ?? "");
  const [fNote, setFNote] = useState("");

  const [themeOpen, setThemeOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [proPromptOpen, setProPromptOpen] = useState(false);
  const [tab, setTab] = useState<"theme" | "bg" | "effect">("theme");
  const [catEditIdx, setCatEditIdx] = useState<number | null>(null);
  const [catEditVal, setCatEditVal] = useState("");
  const [catAddVal, setCatAddVal] = useState("");

  const [shareCats, setShareCats] = useState<string[]>([]);
  const [shareScope, setShareScope] = useState<"active" | "all">("active");

  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const photoKey = `taskman_photo_${userId}`;

  useEffect(() => {
    if (!isPro) {
      setPhotoSrc(null);
      return;
    }
    try {
      const p = localStorage.getItem(photoKey);
      if (p) setPhotoSrc(p);
    } catch {
      /* ignore */
    }
  }, [isPro, photoKey]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) setTheme(normalizeTheme(savedTheme));
      const savedEffect = localStorage.getItem(EFFECT_STORAGE_KEY);
      if (isPro && savedEffect) setEffect(normalizeEffect(savedEffect));
    } catch {
      /* ignore */
    }
  }, [isPro]);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme === "minimal" ? "" : theme);
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(EFFECT_STORAGE_KEY, effect);
    } catch {
      /* ignore */
    }
  }, [effect]);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;

    bgStopRef.current?.();
    bgStopRef.current = null;
    canvas.style.display = "none";

    const selectedBg = isPro ? bg : "none";
    const animatedBg = BACKGROUND_LIST.find((item) => item.id === selectedBg);
    if (!animatedBg) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    canvas.style.display = "block";
    bgStopRef.current = mountBackground(canvas, animatedBg.id);

    return () => {
      window.removeEventListener("resize", resize);
      bgStopRef.current?.();
      bgStopRef.current = null;
    };
  }, [bg, isPro]);

  const persistProfile = useCallback(
    async (patch: Partial<Pick<ProfileRow, "theme" | "bg" | "effect">> & {
      categories?: string[];
    }) => {
      const row: Record<string, unknown> = { ...patch };
      if (patch.categories) row.categories = patch.categories;
      await supabase.from("profiles").update(row).eq("id", userId);
    },
    [supabase, userId],
  );

  useEffect(() => {
    if (isPro) {
      void persistProfile({ theme, bg, effect });
    } else {
      void persistProfile({ theme, bg: "none", effect: "none" });
    }
  }, [theme, bg, effect, isPro, persistProfile]);

  const playEffect = useCallback(
    (preview = false, effectOverride?: EffectId) => {
      if (!isPro && !preview) return;
      const id = effectOverride ?? effect;
      if (id === "none") return;
      triggerEffect(id);
    },
    [effect, isPro],
  );

  const promptUpgrade = useCallback(() => {
    setProPromptOpen(true);
  }, []);

  const selectBackground = useCallback(
    (nextBg: string) => {
      if (!isPro) {
        promptUpgrade();
        return;
      }
      setBg(nextBg);
    },
    [isPro, promptUpgrade],
  );

  const selectEffect = useCallback(
    (nextEffect: EffectId) => {
      if (!isPro) {
        playEffect(true, nextEffect);
        promptUpgrade();
        return;
      }
      setEffect(nextEffect);
      playEffect(true, nextEffect);
    },
    [isPro, playEffect, promptUpgrade],
  );

  const activeTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.done && (filter === "all" || t.cat === filter))
      .sort(
        (a, b) =>
          scoreTask(b.priority, b.due) - scoreTask(a.priority, a.due),
      );
  }, [tasks, filter]);

  const doneTasks = useMemo(() => {
    return tasks
      .filter((t) => t.done && (filter === "all" || t.cat === filter))
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
  }, [tasks, filter]);

  const filterCats = useMemo(() => {
    const fromTasks = Array.from(
      new Set(tasks.map((t) => t.cat).filter(Boolean) as string[]),
    );
    return ["all", ...fromTasks];
  }, [tasks]);

  const stats = useMemo(() => {
    const a = tasks.filter((t) => !t.done);
    return {
      active: a.length,
      urgent: a.filter((t) => t.priority === "urgent").length,
      overdue: a.filter((t) => t.due && (daysUntil(t.due) ?? 0) < 0).length,
      today: a.filter((t) => t.due && daysUntil(t.due) === 0).length,
    };
  }, [tasks]);

  const openFormNew = () => {
    setEditId(null);
    setFName("");
    setFPriority("mid");
    setFDue("");
    setFCat(categories[0] ?? "");
    setFNote("");
    setFormOpen(true);
  };

  const openFormEdit = (t: TaskRow) => {
    setEditId(t.id);
    setFName(t.name);
    setFPriority(t.priority);
    setFDue(t.due ?? "");
    setFCat(t.cat);
    setFNote(t.note ?? "");
    setFormOpen(true);
  };

  const saveTask = async () => {
    const name = fName.trim();
    if (!name) return;
    const now = new Date().toISOString();
    const row = {
      user_id: userId,
      name,
      priority: fPriority,
      due: fDue || null,
      cat: fCat,
      note: fNote.trim() || null,
    };

    if (editId) {
      const prev = tasks.find((t) => t.id === editId);
      const { data, error } = await supabase
        .from("tasks")
        .update({
          ...row,
          updated_at: now,
          done: prev?.done ?? false,
        })
        .eq("id", editId)
        .select()
        .single();
      if (!error && data)
        setTasks((prev) => prev.map((t) => (t.id === editId ? data : t)));
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...row, done: false })
        .select()
        .single();
      if (!error && data) setTasks((prev) => [data, ...prev]);
    }
    setFormOpen(false);
    setEditId(null);
  };

  const toggleTask = async (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const done = !t.done;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("tasks")
      .update({ done, updated_at: now })
      .eq("id", id)
      .select()
      .single();
    if (error) return;
    if (data) {
      setTasks((prev) => prev.map((x) => (x.id === id ? data : x)));
      if (done) playEffect(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("このタスクを削除しますか？")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const addCategory = async () => {
    const v = catAddVal.trim();
    if (!v) return;
    if (categories.includes(v)) {
      alert("同じ名前のカテゴリがあります");
      return;
    }
    const next = [...categories, v];
    setCategories(next);
    setCatAddVal("");
    await persistProfile({ categories: next });
  };

  const saveCatEdit = async (idx: number) => {
    const v = catEditVal.trim();
    if (!v) return;
    if (categories.includes(v) && categories[idx] !== v) {
      alert("同じ名前のカテゴリがあります");
      return;
    }
    const old = categories[idx]!;
    const nextCats = categories.map((c, i) => (i === idx ? v : c));
    setCategories(nextCats);
    setCatEditIdx(null);
    await supabase.from("tasks").update({ cat: v }).eq("user_id", userId).eq("cat", old);
    setTasks((prev) =>
      prev.map((t) => (t.cat === old ? { ...t, cat: v } : t)),
    );
    if (filter === old) setFilter(v);
    await persistProfile({ categories: nextCats });
  };

  const deleteCategory = async (idx: number) => {
    const name = categories[idx]!;
    const count = tasks.filter((t) => t.cat === name).length;
    if (
      !confirm(
        count > 0
          ? `「${name}」を削除します。タスク${count}件は「未分類」になります。`
          : `「${name}」を削除しますか？`,
      )
    )
      return;
    const nextCats = categories.filter((_, i) => i !== idx);
    let cats = nextCats;
    await supabase.from("tasks").update({ cat: "未分類" }).eq("user_id", userId).eq("cat", name);
    setTasks((prev) =>
      prev.map((t) => (t.cat === name ? { ...t, cat: "未分類" } : t)),
    );
    if (!cats.includes("未分類") && tasks.some((t) => t.cat === "未分類"))
      cats = [...cats, "未分類"];
    setCategories(cats.length ? cats : ["未分類"]);
    if (filter === name) setFilter("all");
    await persistProfile({ categories: cats.length ? cats : ["未分類"] });
  };

  const openShare = () => {
    setShareCats([...categories]);
    setShareOpen(true);
  };

  const printPreviewHtml = useMemo(() => {
    const now = new Date();
    const ds = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    let pool = tasks.filter((t) => shareCats.includes(t.cat));
    if (shareScope === "active") pool = pool.filter((t) => !t.done);
    pool = [...pool].sort(
      (a, b) =>
        scoreTask(b.priority, b.due) - scoreTask(a.priority, a.due),
    );
    const cats = Array.from(new Set(pool.map((t) => t.cat)));
    const pb = (p: Priority) =>
      `<span class="p-badge ${printBadgeClass(p)}">${esc(PRIORITY_LABEL[p] ?? p)}</span>`;

    let html = `<div class="print-header"><div class="print-title">現在の担当タスク一覧</div><div class="print-meta">${ds} 時点　${shareScope === "active" ? "未完了タスクのみ" : "全タスク"}　カテゴリ：${esc(shareCats.join("・") || "なし")}</div></div>`;
    if (!pool.length)
      html += `<div class="print-preview-empty" style="text-align:center;padding:1.5rem;font-size:13px;">対象タスクなし</div>`;
    else {
      cats.forEach((cat) => {
        const ct = pool.filter((t) => t.cat === cat);
        html += `<div class="print-cat-section"><div class="print-cat-title">${esc(cat)}（${ct.length}件）</div><table class="print-table"><thead><tr><th style="width:38%">タスク名</th><th style="width:14%">優先度</th><th style="width:20%">期限</th><th style="width:12%">状態</th><th>メモ</th></tr></thead><tbody>`;
        html += ct
          .map((t) => {
            const isOv =
              !t.done && t.due && (daysUntil(t.due) ?? 0) < 0;
            return `<tr><td class="${t.done ? "print-td-done" : ""}">${esc(t.name)}</td><td>${pb(t.priority)}</td><td class="${isOv ? "p-overdue" : ""}">${esc(dueLabelPrint(t.due))}</td><td>${t.done ? "✓ 完了" : "進行中"}</td><td class="print-td-note">${esc(t.note || "")}</td></tr>`;
          })
          .join("");
        html += `</tbody></table></div>`;
      });
    }
    return html;
  }, [tasks, shareCats, shareScope]);

  const handlePhoto = (file: File | null) => {
    if (!isPro) {
      promptUpgrade();
      return;
    }
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || "");
      setPhotoSrc(src);
      try {
        localStorage.setItem(photoKey, src);
      } catch {
        /* ignore */
      }
      selectBackground("photo");
    };
    reader.readAsDataURL(file);
  };

  const activeBg = isPro ? bg : "none";
  const gradientBg = GRADIENT_BACKGROUNDS.find((item) => item.id === activeBg);
  const isAnimatedBg = BACKGROUND_LIST.some((item) => item.id === activeBg);

  return (
    <>
      <div
        id="bg-layer"
        style={{ background: gradientBg?.grad }}
      >
        <canvas
          id="bg-canvas"
          ref={bgCanvasRef}
          style={{ display: isAnimatedBg ? "block" : "none" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data URL from user */}
        <img
          id="bg-image"
          src={activeBg === "photo" && photoSrc ? photoSrc : undefined}
          alt=""
          style={{ display: activeBg === "photo" && photoSrc ? "block" : "none" }}
        />
      </div>

      <div className="container">
        <div className="header">
          <div className="header-left">
            <div className="header-title">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt=""
                className="header-app-icon"
                width={28}
                height={28}
              />
              Doova
            </div>
            <div className="header-sub">
              優先度 × 期限でスコアリング自動ソート · {userEmail}
            </div>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn-icon"
              title="カテゴリ管理"
              onClick={() => {
                setCatOpen(true);
                setCatEditIdx(null);
                setCatAddVal("");
              }}
            >
              <i className="ti ti-tag" />
            </button>
            <button
              type="button"
              className="btn-icon"
              title="テーマ・背景"
              onClick={() => {
                setThemeOpen(true);
                setTab("theme");
              }}
            >
              <i className="ti ti-palette" />
            </button>
            <button type="button" className="btn-base" onClick={openShare}>
              <i className="ti ti-share" /> 共有
            </button>
            <button type="button" className="btn-base" onClick={openFormNew}>
              <i className="ti ti-plus" /> タスク追加
            </button>
            <button type="button" className="btn-icon" title="ログアウト" onClick={() => void logout()}>
              <i className="ti ti-logout" />
            </button>
          </div>
        </div>

        <div className={`form-panel${formOpen ? " open" : ""}`}>
          <div className="form-title">
            {editId ? "タスクを編集" : "新しいタスク"}
          </div>
          <div className="form-grid">
            <div className="form-full">
              <label className="form-label">タスク名 *</label>
              <input
                className="form-input"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                placeholder="タスクを入力…"
              />
            </div>
            <div>
              <label className="form-label">優先度</label>
              <select
                className="form-select"
                value={fPriority}
                onChange={(e) => setFPriority(e.target.value as Priority)}
              >
                <option value="urgent">🔴 緊急</option>
                <option value="high">🟠 高</option>
                <option value="mid">🔵 中</option>
                <option value="low">⚪ 低</option>
              </select>
            </div>
            <div>
              <label className="form-label">期限</label>
              <input
                className="form-input"
                type="date"
                value={fDue}
                onChange={(e) => setFDue(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">カテゴリ</label>
              <select
                className="form-select"
                value={fCat}
                onChange={(e) => setFCat(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">メモ</label>
              <input
                className="form-input"
                value={fNote}
                onChange={(e) => setFNote(e.target.value)}
                placeholder="任意"
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setFormOpen(false);
                setEditId(null);
              }}
            >
              キャンセル
            </button>
            <button type="button" className="btn-save" onClick={() => void saveTask()}>
              保存
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-num">{stats.active}</div>
            <div className="stat-label">未完了</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: "#ef4444" }}>
              {stats.urgent}
            </div>
            <div className="stat-label">緊急</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: "#f87171" }}>
              {stats.overdue}
            </div>
            <div className="stat-label">期限超過</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: "#f59e0b" }}>
              {stats.today}
            </div>
            <div className="stat-label">今日期限</div>
          </div>
        </div>

        <div className="filters">
          <span className="filter-label">表示：</span>
          {filterCats.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-btn${filter === c ? " active" : ""}`}
              onClick={() => setFilter(c)}
            >
              {c === "all" ? "すべて" : c}
            </button>
          ))}
        </div>

        <div id="listEl">
          {!activeTasks.length ? (
            <div className="empty">
              <i className="ti ti-circle-check" />
              タスクなし。上のボタンから追加しよう。
            </div>
          ) : (
            <div className="task-list">
              {activeTasks.map((t) => {
                const dl = dueLabel(t.due);
                const isOv = Boolean(t.due && !t.done && (daysUntil(t.due) ?? 0) < 0);
                return (
                  <div
                    key={t.id}
                    className={`task-card${t.done ? " done" : ""}${isOv ? " overdue" : ""}`}
                  >
                    <div>
                      <button
                        type="button"
                        className={`checkbox${t.done ? " checked" : ""}`}
                        onClick={() => void toggleTask(t.id)}
                      />
                    </div>
                    <div>
                      <div className={`task-name${t.done ? " done-text" : ""}`}>{t.name}</div>
                      <div className="task-meta">
                        <span className={`badge ${priorityBadgeClass(t.priority)}`}>
                          {PRIORITY_LABEL[t.priority] ?? t.priority}
                        </span>
                        <span className="badge badge-cat">{t.cat}</span>
                        {dl ? (
                          <span className={`due-tag ${dl.cls}`}>
                            <i className="ti ti-calendar text-[12px]" />
                            {dl.text}
                          </span>
                        ) : null}
                        {t.note ? (
                          <span className="due-tag">— {t.note}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="task-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="編集"
                        onClick={() => openFormEdit(t)}
                      >
                        <i className="ti ti-edit" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn del"
                        aria-label="削除"
                        onClick={() => void deleteTask(t.id)}
                      >
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {doneTasks.length > 0 ? (
            <>
              <hr className="section-sep" />
              <button
                type="button"
                className="toggle-done-btn"
                onClick={() => setShowDone((v) => !v)}
              >
                <i className={`ti ti-chevron-${showDone ? "up" : "down"}`} />
                完了済み ({doneTasks.length})
              </button>
              {showDone ? (
                <div className="task-list">
                  {doneTasks.map((t) => {
                    const dl = dueLabel(t.due);
                    return (
                      <div key={t.id} className="task-card done">
                        <div>
                          <button
                            type="button"
                            className="checkbox checked"
                            onClick={() => void toggleTask(t.id)}
                          />
                        </div>
                        <div>
                          <div className="task-name done-text">{t.name}</div>
                          <div className="task-meta">
                            <span className={`badge ${priorityBadgeClass(t.priority)}`}>
                              {PRIORITY_LABEL[t.priority]}
                            </span>
                            <span className="badge badge-cat">{t.cat}</span>
                            {dl ? (
                              <span className={`due-tag ${dl.cls}`}>
                                <i className="ti ti-calendar text-[12px]" />
                                {dl.text}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="task-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => openFormEdit(t)}
                          >
                            <i className="ti ti-edit" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn del"
                            onClick={() => void deleteTask(t.id)}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/* Theme modal */}
      <div
        className={`modal-overlay${themeOpen ? " open" : ""}`}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) setThemeOpen(false);
        }}
      >
        <div className="modal theme-modal">
          <div className="modal-header">
            <div className="modal-title">
              <i className="ti ti-palette mr-1.5 inline" />
              テーマ・背景
            </div>
            <button type="button" className="modal-close" onClick={() => setThemeOpen(false)}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="tab-row">
            <button
              type="button"
              className={`tab-btn${tab === "theme" ? " active" : ""}`}
              onClick={() => setTab("theme")}
            >
              🎨 カラーテーマ
            </button>
            <button
              type="button"
              className={`tab-btn${tab === "bg" ? " active" : ""}`}
              onClick={() => setTab("bg")}
            >
              🖼️ 背景 <span className="pro-badge">PRO</span>
            </button>
            <button
              type="button"
              className={`tab-btn${tab === "effect" ? " active" : ""}`}
              onClick={() => setTab("effect")}
            >
              ⚡ 完了エフェクト <span className="pro-badge">PRO</span>
            </button>
          </div>

          <div className={`tab-content${tab === "theme" ? " active" : ""}`}>
            <div className="theme-grid">
              {THEME_LIST.map((tm) => (
                <button
                  key={tm.id}
                  type="button"
                  className={`theme-card${theme === tm.id ? " selected" : ""}`}
                  onClick={() => setTheme(tm.id)}
                >
                  <div
                    className="theme-preview"
                    style={{ background: tm.vars["--bg-primary"] }}
                  >
                    <div
                      className="tp-bar"
                      style={{ background: tm.vars["--bg-secondary"] }}
                    />
                    <div
                      className="tp-card"
                      style={{
                        background: tm.vars["--bg-card"],
                        border: `0.5px solid ${tm.vars["--border-color"]}`,
                        borderRadius: tm.vars["--card-border-radius"],
                      }}
                    >
                      <div
                        className="tp-dot"
                        style={{
                          background: tm.vars["--checkbox-done-bg"],
                          borderRadius: tm.id === "mono" ? 0 : undefined,
                        }}
                      />
                      <div
                        className="tp-line"
                        style={{ background: tm.vars["--text-muted"] }}
                      />
                      <div
                        className="tp-badge"
                        style={{ background: tm.vars["--badge-urgent-bg"] }}
                      />
                    </div>
                    <div
                      className="tp-card"
                      style={{
                        background: tm.vars["--bg-card-hover"],
                        border: `0.5px solid ${tm.vars["--border-color"]}`,
                        borderRadius: tm.vars["--card-border-radius"],
                      }}
                    >
                      <div
                        className="tp-dot"
                        style={{
                          border: `1px solid ${tm.vars["--checkbox-border"]}`,
                          background: "transparent",
                          borderRadius: tm.id === "mono" ? 0 : undefined,
                        }}
                      />
                      <div
                        className="tp-line"
                        style={{
                          width: "60%",
                          background: tm.vars["--text-muted"],
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="theme-name"
                    style={{
                      background: tm.vars["--bg-secondary"],
                      color: tm.vars["--text-primary"],
                    }}
                  >
                    {tm.name}
                    {tm.isNew ? <span className="pro-badge">NEW</span> : null}
                  </div>
                  <div className="selected-check">✓</div>
                </button>
              ))}
            </div>
          </div>

          <div className={`tab-content${tab === "bg" ? " active" : ""}`}>
            <div className="section-title">表示</div>
            <div className="bg-grid">
              <button
                type="button"
                className={`bg-card${bg === "none" ? " selected" : ""}`}
                onClick={() => selectBackground("none")}
              >
                <div
                  className="bg-preview"
                  style={{ background: "var(--bg-tertiary)" }}
                />
                <div className="bg-label">デフォルト</div>
                <div className="selected-check">✓</div>
              </button>
            </div>
            <div className="section-title">グラデーション</div>
            <div className="bg-grid">
              {GRADIENT_BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`bg-card${bg === b.id ? " selected" : ""}`}
                  onClick={() => selectBackground(b.id)}
                >
                  <div className="bg-preview" style={{ background: b.grad }} />
                  <div className="bg-label">{b.label}</div>
                  <div className="selected-check">✓</div>
                </button>
              ))}
            </div>
            <div className="section-title">アニメーション</div>
            <div className="bg-grid">
              {BACKGROUND_LIST.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`bg-card${bg === b.id ? " selected" : ""}`}
                  onClick={() => selectBackground(b.id)}
                >
                  <BackgroundPreviewCanvas id={b.id} />
                  <div className="bg-label">
                    {b.emoji} {b.name}
                    {b.isNew ? <span className="pro-badge">NEW</span> : null}
                  </div>
                  <div className="selected-check">✓</div>
                </button>
              ))}
            </div>
            <div className="section-title">マイ写真</div>
            <label
              className="upload-zone"
              onClick={(e) => {
                if (!isPro) {
                  e.preventDefault();
                  promptUpgrade();
                }
              }}
            >
              <i className="ti ti-photo-up" />
              <p>クリックして写真を選択</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            {photoSrc ? (
              <div className="mt-2">
                <div className="bg-grid">
                  <button
                    type="button"
                    className={`bg-card${bg === "photo" ? " selected" : ""}`}
                    onClick={() => selectBackground("photo")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoSrc} alt="" className="h-full w-full object-cover" />
                    <div className="bg-label">マイ写真</div>
                    <div className="selected-check">✓</div>
                  </button>
                </div>
              </div>
            ) : null}
            <div
              className="mt-3 rounded-[var(--radius-md)] p-3 text-xs text-[var(--text-secondary)]"
              style={{ background: "var(--bg-secondary)" }}
            >
              <i className="ti ti-info-circle mr-1" />
              背景はアカウントに紐づいて保存されます（写真はこのブラウザの localStorage
              にも保存されます）。
            </div>
            {!isPro ? <ProUpgradePanel /> : null}
          </div>

          <div className={`tab-content${tab === "effect" ? " active" : ""}`}>
            <p className="mb-4 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              タスク完了時に演出を表示します。
            </p>
            <div className="effect-grid">
              {EFFECT_META.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`effect-card${effect === o.id ? " selected" : ""}`}
                  onClick={() => selectEffect(o.id)}
                >
                  <EffectOptionPreview id={o.id} />
                  <div className="effect-card-label">
                    {o.emoji} {o.name}
                  </div>
                  <div className="selected-check">✓</div>
                </button>
              ))}
            </div>
            {!isPro ? <ProUpgradePanel /> : null}
          </div>
        </div>
      </div>

      {/* Pro upgrade prompt */}
      <div
        className={`modal-overlay${proPromptOpen ? " open" : ""}`}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) setProPromptOpen(false);
        }}
      >
        <div className="modal pro-upgrade-modal">
          <div className="modal-header">
            <div className="modal-title">
              <i className="ti ti-sparkles mr-1.5 inline" />
              Pro限定機能
            </div>
            <button
              type="button"
              className="modal-close"
              onClick={() => setProPromptOpen(false)}
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <ProUpgradePanel />
        </div>
      </div>

      {/* Category modal */}
      <div
        className={`modal-overlay${catOpen ? " open" : ""}`}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) setCatOpen(false);
        }}
      >
        <div className="modal cat-modal">
          <div className="modal-header">
            <div className="modal-title">
              <i className="ti ti-tag mr-1.5 inline" />
              カテゴリ管理
            </div>
            <button type="button" className="modal-close" onClick={() => setCatOpen(false)}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="cat-list">
            {!categories.length ? (
              <div className="cat-empty">カテゴリがありません</div>
            ) : (
              categories.map((c, i) =>
                catEditIdx === i ? (
                  <div key={c} className="cat-item">
                    <input
                      className="cat-edit-input"
                      value={catEditVal}
                      onChange={(e) => setCatEditVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveCatEdit(i);
                        if (e.key === "Escape") setCatEditIdx(null);
                      }}
                    />
                    <button type="button" className="cat-icon-btn" onClick={() => void saveCatEdit(i)}>
                      <i className="ti ti-check" />
                    </button>
                    <button type="button" className="cat-icon-btn" onClick={() => setCatEditIdx(null)}>
                      <i className="ti ti-x" />
                    </button>
                  </div>
                ) : (
                  <div key={`${c}-${i}`} className="cat-item">
                    <span className="cat-item-name">{c}</span>
                    <span className="cat-item-count">
                      {tasks.filter((t) => t.cat === c).length}件
                    </span>
                    <button
                      type="button"
                      className="cat-icon-btn"
                      onClick={() => {
                        setCatEditIdx(i);
                        setCatEditVal(c);
                      }}
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button type="button" className="cat-icon-btn del" onClick={() => void deleteCategory(i)}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                ),
              )
            )}
          </div>
          <div className="cat-add-row">
            <input
              className="cat-add-input"
              value={catAddVal}
              onChange={(e) => setCatAddVal(e.target.value)}
              placeholder="新しいカテゴリ名…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void addCategory();
              }}
            />
            <button type="button" className="cat-add-btn" onClick={() => void addCategory()}>
              <i className="ti ti-plus" /> 追加
            </button>
          </div>
        </div>
      </div>

      {/* Share modal */}
      <div
        className={`modal-overlay${shareOpen ? " open" : ""}`}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShareOpen(false);
        }}
      >
        <div className="modal share-modal">
          <div className="modal-header">
            <div className="modal-title">共有用に書き出す</div>
            <button type="button" className="modal-close" onClick={() => setShareOpen(false)}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="share-row">
            <div className="share-row-label">カテゴリを選択（複数可）</div>
            <div className="share-cat-filters">
              {categories.length ? (
                categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`share-cat-btn${shareCats.includes(c) ? " active" : ""}`}
                    onClick={() =>
                      setShareCats((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                      )
                    }
                  >
                    {c}
                  </button>
                ))
              ) : (
                <span className="text-xs text-[var(--text-tertiary)]">カテゴリなし</span>
              )}
            </div>
          </div>
          <div className="share-row">
            <div className="share-row-label">対象タスク</div>
            <div className="share-scope-btns">
              <button
                type="button"
                className={`share-opt-btn${shareScope === "active" ? " active" : ""}`}
                onClick={() => setShareScope("active")}
              >
                未完了のみ
              </button>
              <button
                type="button"
                className={`share-opt-btn${shareScope === "all" ? " active" : ""}`}
                onClick={() => setShareScope("all")}
              >
                完了含む
              </button>
            </div>
          </div>
          <div
            className="print-preview"
            dangerouslySetInnerHTML={{ __html: printPreviewHtml }}
          />
          <div className="modal-actions">
            <button type="button" className="btn-print" onClick={() => window.print()}>
              <i className="ti ti-printer" /> 印刷 / PDF保存
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
