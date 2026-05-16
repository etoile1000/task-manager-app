// ============================================================
// Doova — カラーテーマ定義 (themes.ts)
// task-dashboard.tsx から import して使用してください
// ============================================================

export type ThemeId =
  | "minimal"
  | "cyber"
  | "pastel"
  | "glass"
  | "neon"
  | "mono";

export interface DoovaTheme {
  id: ThemeId;
  name: string;
  nameEn: string;
  isPro: boolean;
  isNew: boolean;
  /** CSS Variables としてルートに注入する値 */
  vars: {
    // 背景
    "--bg-primary": string;
    "--bg-secondary": string;
    "--bg-card": string;
    "--bg-card-hover": string;
    // ボーダー
    "--border-color": string;
    "--border-accent": string;
    // テキスト
    "--text-primary": string;
    "--text-secondary": string;
    "--text-muted": string;
    // アクセント
    "--accent-primary": string;
    "--accent-glow": string;
    // バッジ
    "--badge-urgent-bg": string;
    "--badge-urgent-text": string;
    "--badge-high-bg": string;
    "--badge-high-text": string;
    "--badge-mid-bg": string;
    "--badge-mid-text": string;
    // タスクカード左ボーダー
    "--card-left-accent": string;
    // フォントファミリー
    "--font-task": string;
    // チェックボックス
    "--checkbox-border": string;
    "--checkbox-done-bg": string;
    // スクロールバー
    "--scrollbar-bg": string;
    "--scrollbar-thumb": string;
    // 追加エフェクト
    "--card-shadow": string;
    "--card-blur": string;
    "--card-border-radius": string;
  };
  /** body / wrapper に付与するクラス名 (任意) */
  bodyClass?: string;
}

export const THEMES: Record<ThemeId, DoovaTheme> = {

  /* ────────────────────────────────────────────────
     1. ミニマル — ペーパーホワイト、余白優先
  ──────────────────────────────────────────────── */
  minimal: {
    id: "minimal",
    name: "ミニマル",
    nameEn: "Minimal",
    isPro: false,
    isNew: false,
    vars: {
      "--bg-primary":        "#fafaf9",
      "--bg-secondary":      "#f5f5f0",
      "--bg-card":           "#ffffff",
      "--bg-card-hover":     "#fafaf9",
      "--border-color":      "rgba(14,13,12,0.08)",
      "--border-accent":     "rgba(232,71,10,0.3)",
      "--text-primary":      "#1a1a18",
      "--text-secondary":    "#4a4a46",
      "--text-muted":        "#8a857c",
      "--accent-primary":    "#e8470a",
      "--accent-glow":       "transparent",
      "--badge-urgent-bg":   "#fee2e2",
      "--badge-urgent-text": "#991b1b",
      "--badge-high-bg":     "#fef9c3",
      "--badge-high-text":   "#92400e",
      "--badge-mid-bg":      "#dbeafe",
      "--badge-mid-text":    "#1e40af",
      "--card-left-accent":  "transparent",
      "--font-task":         "'Zen Kaku Gothic New', sans-serif",
      "--checkbox-border":   "#d0ccc5",
      "--checkbox-done-bg":  "#e8470a",
      "--scrollbar-bg":      "#f0ede8",
      "--scrollbar-thumb":   "#c8c4bc",
      "--card-shadow":       "0 1px 3px rgba(14,13,12,0.06)",
      "--card-blur":         "none",
      "--card-border-radius":"10px",
    },
  },

  /* ────────────────────────────────────────────────
     2. サイバー — ダーク + グリーン端末
  ──────────────────────────────────────────────── */
  cyber: {
    id: "cyber",
    name: "サイバー",
    nameEn: "Cyber",
    isPro: false,
    isNew: false,
    vars: {
      "--bg-primary":        "#080d18",
      "--bg-secondary":      "#0a1020",
      "--bg-card":           "rgba(0,255,200,0.04)",
      "--bg-card-hover":     "rgba(0,255,200,0.08)",
      "--border-color":      "rgba(0,255,200,0.15)",
      "--border-accent":     "#00ffc8",
      "--text-primary":      "#c8f8ec",
      "--text-secondary":    "#80cfc0",
      "--text-muted":        "#4a8878",
      "--accent-primary":    "#00ffc8",
      "--accent-glow":       "0 0 16px rgba(0,255,200,0.4)",
      "--badge-urgent-bg":   "rgba(255,0,50,0.15)",
      "--badge-urgent-text": "#ff4466",
      "--badge-high-bg":     "rgba(255,200,0,0.12)",
      "--badge-high-text":   "#ffc800",
      "--badge-mid-bg":      "rgba(0,255,200,0.08)",
      "--badge-mid-text":    "#00ffc8",
      "--card-left-accent":  "#00ffc8",
      "--font-task":         "'DM Mono', monospace",
      "--checkbox-border":   "rgba(0,255,200,0.5)",
      "--checkbox-done-bg":  "#00ffc8",
      "--scrollbar-bg":      "#080d18",
      "--scrollbar-thumb":   "rgba(0,255,200,0.3)",
      "--card-shadow":       "0 0 20px rgba(0,255,200,0.06)",
      "--card-blur":         "none",
      "--card-border-radius":"4px",
    },
    bodyClass: "theme-cyber",
  },

  /* ────────────────────────────────────────────────
     3. パステル — ソフト・ガーリー
  ──────────────────────────────────────────────── */
  pastel: {
    id: "pastel",
    name: "パステル",
    nameEn: "Pastel",
    isPro: false,
    isNew: false,
    vars: {
      "--bg-primary":        "linear-gradient(135deg,#fde8f6 0%,#e8effe 50%,#fef9e8 100%)",
      "--bg-secondary":      "rgba(255,255,255,0.6)",
      "--bg-card":           "rgba(255,255,255,0.82)",
      "--bg-card-hover":     "rgba(255,255,255,0.95)",
      "--border-color":      "rgba(196,181,253,0.3)",
      "--border-accent":     "#c4b5fd",
      "--text-primary":      "#3d2f5c",
      "--text-secondary":    "#6b5f80",
      "--text-muted":        "#9ca3af",
      "--accent-primary":    "#a855f7",
      "--accent-glow":       "transparent",
      "--badge-urgent-bg":   "#fecdd3",
      "--badge-urgent-text": "#be185d",
      "--badge-high-bg":     "#fde68a",
      "--badge-high-text":   "#92400e",
      "--badge-mid-bg":      "#ddd6fe",
      "--badge-mid-text":    "#7c3aed",
      "--card-left-accent":  "transparent",
      "--font-task":         "'Zen Kaku Gothic New', sans-serif",
      "--checkbox-border":   "#c4b5fd",
      "--checkbox-done-bg":  "linear-gradient(135deg,#f9a8d4,#c4b5fd)",
      "--scrollbar-bg":      "rgba(244,231,255,0.5)",
      "--scrollbar-thumb":   "#c4b5fd",
      "--card-shadow":       "0 4px 16px rgba(168,85,247,0.08)",
      "--card-blur":         "blur(8px)",
      "--card-border-radius":"14px",
    },
  },

  /* ────────────────────────────────────────────────
     4. グラス — ディープダーク + 半透明
  ──────────────────────────────────────────────── */
  glass: {
    id: "glass",
    name: "グラス",
    nameEn: "Glass",
    isPro: true,
    isNew: true,
    vars: {
      "--bg-primary":        "linear-gradient(135deg,#1a0533 0%,#0d1a3a 50%,#001a2e 100%)",
      "--bg-secondary":      "rgba(255,255,255,0.04)",
      "--bg-card":           "rgba(255,255,255,0.08)",
      "--bg-card-hover":     "rgba(255,255,255,0.13)",
      "--border-color":      "rgba(255,255,255,0.12)",
      "--border-accent":     "rgba(249,115,22,0.5)",
      "--text-primary":      "rgba(255,255,255,0.92)",
      "--text-secondary":    "rgba(255,255,255,0.6)",
      "--text-muted":        "rgba(255,255,255,0.35)",
      "--accent-primary":    "#f97316",
      "--accent-glow":       "0 0 20px rgba(249,115,22,0.35)",
      "--badge-urgent-bg":   "rgba(249,115,22,0.18)",
      "--badge-urgent-text": "#fb923c",
      "--badge-high-bg":     "rgba(236,72,153,0.15)",
      "--badge-high-text":   "#f472b6",
      "--badge-mid-bg":      "rgba(139,92,246,0.15)",
      "--badge-mid-text":    "#a78bfa",
      "--card-left-accent":  "transparent",
      "--font-task":         "'Outfit', sans-serif",
      "--checkbox-border":   "rgba(255,255,255,0.35)",
      "--checkbox-done-bg":  "rgba(249,115,22,0.8)",
      "--scrollbar-bg":      "rgba(255,255,255,0.04)",
      "--scrollbar-thumb":   "rgba(255,255,255,0.15)",
      "--card-shadow":       "inset 0 0 0 0.5px rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.3)",
      "--card-blur":         "blur(20px)",
      "--card-border-radius":"14px",
    },
  },

  /* ────────────────────────────────────────────────
     5. ネオン — 黒地 + Ember Arc グロー
  ──────────────────────────────────────────────── */
  neon: {
    id: "neon",
    name: "ネオン",
    nameEn: "Neon",
    isPro: true,
    isNew: true,
    vars: {
      "--bg-primary":        "#050508",
      "--bg-secondary":      "#080810",
      "--bg-card":           "#0c0c18",
      "--bg-card-hover":     "#10101e",
      "--border-color":      "rgba(249,115,22,0.2)",
      "--border-accent":     "#f97316",
      "--text-primary":      "rgba(255,220,190,0.95)",
      "--text-secondary":    "rgba(255,180,140,0.7)",
      "--text-muted":        "rgba(200,150,110,0.45)",
      "--accent-primary":    "#f97316",
      "--accent-glow":       "0 0 20px rgba(249,115,22,0.5), 0 0 40px rgba(249,115,22,0.2)",
      "--badge-urgent-bg":   "rgba(236,72,153,0.12)",
      "--badge-urgent-text": "#ec4899",
      "--badge-high-bg":     "rgba(249,115,22,0.12)",
      "--badge-high-text":   "#f97316",
      "--badge-mid-bg":      "rgba(139,92,246,0.12)",
      "--badge-mid-text":    "#8b5cf6",
      "--card-left-accent":  "transparent",
      "--font-task":         "'DM Mono', monospace",
      "--checkbox-border":   "rgba(249,115,22,0.5)",
      "--checkbox-done-bg":  "#f97316",
      "--scrollbar-bg":      "#050508",
      "--scrollbar-thumb":   "rgba(249,115,22,0.3)",
      "--card-shadow":       "0 0 0 0.5px rgba(249,115,22,0.15), 0 4px 20px rgba(249,115,22,0.08)",
      "--card-blur":         "none",
      "--card-border-radius":"6px",
    },
    bodyClass: "theme-neon",
  },

  /* ────────────────────────────────────────────────
     6. モノクローム — 白黒、バウハウス
  ──────────────────────────────────────────────── */
  mono: {
    id: "mono",
    name: "モノクローム",
    nameEn: "Mono",
    isPro: true,
    isNew: true,
    vars: {
      "--bg-primary":        "#f5f5f5",
      "--bg-secondary":      "#ebebeb",
      "--bg-card":           "#ffffff",
      "--bg-card-hover":     "#f8f8f8",
      "--border-color":      "#e0e0e0",
      "--border-accent":     "#111111",
      "--text-primary":      "#111111",
      "--text-secondary":    "#444444",
      "--text-muted":        "#888888",
      "--accent-primary":    "#111111",
      "--accent-glow":       "transparent",
      "--badge-urgent-bg":   "#111111",
      "--badge-urgent-text": "#ffffff",
      "--badge-high-bg":     "#555555",
      "--badge-high-text":   "#ffffff",
      "--badge-mid-bg":      "#e8e8e8",
      "--badge-mid-text":    "#444444",
      "--card-left-accent":  "#111111",
      "--font-task":         "'DM Mono', monospace",
      "--checkbox-border":   "#333333",
      "--checkbox-done-bg":  "#111111",
      "--scrollbar-bg":      "#ebebeb",
      "--scrollbar-thumb":   "#999999",
      "--card-shadow":       "none",
      "--card-blur":         "none",
      "--card-border-radius":"0px",
    },
  },
};

/* ============================================================
   CSS Variables を DOM に注入するユーティリティ
   使用例:
     import { applyTheme } from "@/lib/themes";
     applyTheme("cyber");
============================================================ */
export function applyTheme(themeId: ThemeId): void {
  const theme = THEMES[themeId];
  if (!theme) return;
  const root = document.documentElement;
  const body = document.body;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
    body.style.setProperty(key, value);
  });
  // 既存CSSが参照する変数へブリッジする
  const bridgedVars = {
    "--bg": theme.vars["--bg-primary"],
    "--bg-secondary": theme.vars["--bg-secondary"],
    "--bg-tertiary": theme.vars["--bg-primary"],
    "--text": theme.vars["--text-primary"],
    "--text-secondary": theme.vars["--text-secondary"],
    "--text-tertiary": theme.vars["--text-muted"],
    "--border": theme.vars["--border-color"],
    "--border-secondary": theme.vars["--border-accent"],
    "--accent": theme.vars["--accent-primary"],
    "--card-bg": theme.vars["--bg-card"],
    "--card-border": theme.vars["--border-color"],
    "--card-shadow": theme.vars["--card-shadow"],
    "--font": theme.vars["--font-task"],
    "--radius-md": theme.vars["--card-border-radius"],
    "--radius-lg": theme.vars["--card-border-radius"],
  };
  Object.entries(bridgedVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
    body.style.setProperty(key, value);
  });
  // body クラスの付け替え
  document.body.className = document.body.className
    .split(" ")
    .filter((c) => !c.startsWith("theme-"))
    .join(" ");
  if (theme.bodyClass) {
    document.body.classList.add(theme.bodyClass);
  }
}

/* ============================================================
   テーマセレクター用メタデータ配列
============================================================ */
export const THEME_LIST = Object.values(THEMES);
