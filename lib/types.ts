export type Priority = "urgent" | "high" | "mid" | "low";

export type ThemeId = "minimal" | "cyber" | "pastel" | "glass" | "neon" | "mono";

export type TaskRow = {
  id: string;
  user_id: string;
  name: string;
  priority: Priority;
  due: string | null;
  cat: string;
  note: string | null;
  done: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  theme: string;
  bg: string;
  effect: string;
  categories: unknown;
  /** Set true via Stripe webhook after paid checkout */
  is_pro: boolean;
  created_at: string;
};
