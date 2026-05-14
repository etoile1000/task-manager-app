"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const err = useMemo(() => searchParams.get("error"), [searchParams]);
  const [loading, setLoading] = useState(false);

  const signInGoogle = async () => {
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      alert(error.message);
    }
  };

  return (
    <div className="relative z-[1] flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          タスク管理
        </div>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Google アカウントでログインして、タスクをクラウドに保存します。
        </p>
        {err ? (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            認証に失敗しました。Supabase の Google プロバイダ設定とリダイレクト URL
            を確認してください。
          </p>
        ) : null}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          disabled={loading}
          onClick={() => void signInGoogle()}
        >
          {loading ? "リダイレクト中…" : "Google でログイン"}
        </button>
      </div>
    </div>
  );
}
