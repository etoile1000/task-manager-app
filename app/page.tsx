import { redirect } from "next/navigation";
import TaskDashboard from "@/components/task-dashboard";
import { normalizeCategories } from "@/lib/task-utils";
import { createClient } from "@/lib/supabase-server";
import type { ProfileRow } from "@/lib/types";

const DEFAULT_CATS = ["仕事", "etoile", "個人"];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const row = {
      id: user.id,
      theme: "minimal",
      bg: "none",
      effect: "ko",
      categories: DEFAULT_CATS,
      is_pro: false,
    };
    await supabase.from("profiles").insert(row);
    profile = row as ProfileRow;
  } else if (normalizeCategories(profile.categories).length === 0) {
    await supabase
      .from("profiles")
      .update({ categories: DEFAULT_CATS })
      .eq("id", user.id);
    profile = { ...profile, categories: DEFAULT_CATS };
  }

  const safeProfile: ProfileRow = {
    ...(profile as ProfileRow),
    is_pro: (profile as ProfileRow).is_pro === true,
  };

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id);

  return (
    <TaskDashboard
      userId={user.id}
      userEmail={user.email ?? ""}
      initialProfile={safeProfile}
      initialTasks={tasks ?? []}
    />
  );
}
