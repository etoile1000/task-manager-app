export type Priority = "urgent" | "high" | "mid" | "low";

export type ThemeId = "minimal" | "cyber" | "pastel";

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
  created_at: string;
};
