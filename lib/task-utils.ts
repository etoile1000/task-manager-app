import type { Priority } from "./types";

export const PRIORITY_SCORE: Record<Priority, number> = {
  urgent: 1000,
  high: 100,
  mid: 10,
  low: 1,
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "緊急",
  high: "高",
  mid: "中",
  low: "低",
};

/** Same weighting as `public/index.html` */
export function scoreTask(priority: Priority, due: string | null): number {
  let s = PRIORITY_SCORE[priority] ?? 10;
  if (due) {
    const d = Math.ceil(
      (new Date(due).getTime() - Date.now()) / 86400000,
    );
    if (d < 0) s += 800;
    else if (d === 0) s += 600;
    else if (d <= 2) s += 400;
    else if (d <= 7) s += 200;
    else if (d <= 14) s += 80;
    else if (d <= 30) s += 20;
  }
  return s;
}

export function daysUntil(due: string | null): number | null {
  if (!due) return null;
  return Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
}

export function dueLabel(due: string | null): {
  text: string;
  cls: string;
} | null {
  if (!due) return null;
  const d = daysUntil(due);
  if (d === null) return null;
  if (d < 0) return { text: `${Math.abs(d)}日超過`, cls: "overdue-text" };
  if (d === 0) return { text: "今日", cls: "soon-text" };
  if (d === 1) return { text: "明日", cls: "soon-text" };
  if (d <= 7) return { text: `${d}日後`, cls: "soon-text" };
  const dt = new Date(due);
  return { text: `${dt.getMonth() + 1}/${dt.getDate()}`, cls: "" };
}

export function dueLabelPrint(due: string | null): string {
  if (!due) return "—";
  const d = daysUntil(due);
  const dt = new Date(due);
  const base = `${dt.getMonth() + 1}/${dt.getDate()}`;
  if (d === null) return base;
  if (d < 0) return `${base}（${Math.abs(d)}日超過）`;
  if (d === 0) return `${base}（今日）`;
  if (d === 1) return `${base}（明日）`;
  return base;
}

export function normalizeCategories(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw) as unknown;
      if (Array.isArray(j))
        return j.filter((x): x is string => typeof x === "string");
    } catch {
      return [];
    }
  }
  return [];
}
