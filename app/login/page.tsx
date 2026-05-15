"use client";

import { useSearchParams } from "next/navigation";
import { Outfit } from "next/font/google";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase";
import styles from "./login.module.css";

const outfit = Outfit({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-outfit",
});

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 0.001) * 43758.5453;
  return x - Math.floor(x);
}

function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const r1 = pseudoRandom(i + 1);
      const r2 = pseudoRandom(i + 50);
      const r3 = pseudoRandom(i + 99);
      const r4 = pseudoRandom(i + 150);
      const r5 = pseudoRandom(i + 200);
      const r6 = pseudoRandom(i + 250);
      const size = r1 * 2 + 1;
      const d = (r2 * 4 + 2).toFixed(1);
      const delay = (-(r3 * 6)).toFixed(1);
      const op = (r4 * 0.5 + 0.2).toFixed(2);
      return {
        key: i,
        size,
        top: r5 * 100,
        left: r6 * 100,
        d,
        delay,
        op,
      };
    });
  }, []);

  return (
    <div className={styles.stars} aria-hidden>
      {stars.map((s) => (
        <span
          key={s.key}
          className={styles.star}
          style={
            {
              width: s.size,
              height: s.size,
              top: `${s.top}%`,
              left: `${s.left}%`,
              "--d": `${s.d}s`,
              "--delay": `${s.delay}s`,
              "--op": s.op,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="17" cy="17" r="12" stroke="white" strokeWidth="2.2" fill="none" />
      <polyline
        points="11,17 15.5,21.5 24,12"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.4a4.6 4.6 0 01-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.31z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H1.07v2.58A10 10 0 0010 20z"
        fill="#34A853"
      />
      <path
        d="M4.41 11.92A5.97 5.97 0 014.1 10c0-.67.12-1.32.31-1.92V5.5H1.07A10 10 0 000 10c0 1.61.38 3.13 1.07 4.5l3.34-2.58z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.95.99 12.7 0 10 0A10 10 0 001.07 5.5l3.34 2.58C5.2 5.71 7.4 3.96 10 3.96z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
    <div
      className={`${styles.shell} ${outfit.variable}`}
      data-login-page
    >
      <StarField />
      <div className={`${styles.glowOrb} ${styles.glowA}`} aria-hidden />
      <div className={`${styles.glowOrb} ${styles.glowB}`} aria-hidden />
      <div className={`${styles.glowOrb} ${styles.glowC}`} aria-hidden />
      <div className={styles.gridLines} aria-hidden />

      <main className={styles.pageMain}>
        <div className={styles.card}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}>
              <LogoMark />
            </div>
            <div className={styles.logoWordmark}>
              Doo<span className={styles.gradText}>va</span>
            </div>
            <p className={styles.tagline}>Do something. Reach nova.</p>
          </div>

          <div className={styles.divider} aria-hidden />

          <p className={styles.sub}>
            Googleアカウントでログインして、
            <br />
            あなたの「やること」を星にしよう。
          </p>

          {err ? (
            <p className={styles.err}>
              認証に失敗しました。Supabase の Google プロバイダ設定とリダイレクト
              URL を確認してください。
            </p>
          ) : null}

          <button
            type="button"
            className={styles.btnGoogle}
            disabled={loading}
            onClick={() => void signInGoogle()}
          >
            <GoogleGlyph className={styles.gIcon} />
            <span className={styles.btnlabel}>
              {loading ? "リダイレクト中…" : "Googleでログイン"}
            </span>
          </button>

          <div className={styles.footer}>
            ログインすることで<a href="#">利用規約</a>および<a href="#">プライバシーポリシー</a>
            に同意したことになります
          </div>
        </div>
      </main>
    </div>
  );
}
