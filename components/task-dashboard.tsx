"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ANIM_BG_META,
  ANIM_PREVIEW,
  BgLayer,
  GRAD_BG_META,
} from "@/components/bg-layer";
import { createClient } from "@/lib/supabase";
import {
  daysUntil,
  dueLabel,
  dueLabelPrint,
  PRIORITY_LABEL,
  scoreTask,
  normalizeCategories,
} from "@/lib/task-utils";
import type { Priority, ProfileRow, TaskRow, ThemeId } from "@/lib/types";

const DEFAULT_CATS = ["仕事", "etoile", "個人"];

type EffectId = "none" | "ko" | "combo" | "sakura";

function normalizeEffect(raw: string | null | undefined): EffectId {
  const v = String(raw ?? "ko").trim().toLowerCase();
  if (v === "none" || v === "ko" || v === "combo" || v === "sakura") return v;
  return "ko";
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

export default function TaskDashboard({
  userId,
  userEmail,
  initialProfile,
  initialTasks,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [theme, setTheme] = useState<ThemeId>(
    (initialProfile.theme as ThemeId) || "minimal",
  );
  const [bg, setBg] = useState(initialProfile.bg || "none");
  const [effect, setEffect] = useState<EffectId>(() =>
    normalizeEffect(initialProfile.effect),
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
  const [tab, setTab] = useState<"theme" | "bg" | "effect">("theme");
  const [catEditIdx, setCatEditIdx] = useState<number | null>(null);
  const [catEditVal, setCatEditVal] = useState("");
  const [catAddVal, setCatAddVal] = useState("");

  const [shareCats, setShareCats] = useState<string[]>([]);
  const [shareScope, setShareScope] = useState<"active" | "all">("active");

  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const photoKey = `taskman_photo_${userId}`;

  const effectOverlayRef = useRef<HTMLDivElement>(null);
  const comboCountRef = useRef(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem(photoKey);
      if (p) setPhotoSrc(p);
    } catch {
      /* ignore */
    }
  }, [photoKey]);

  useEffect(() => {
    document.body.setAttribute(
      "data-theme",
      theme === "minimal" ? "" : theme,
    );
  }, [theme]);

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
    void persistProfile({ theme, bg, effect });
  }, [theme, bg, effect, persistProfile]);

  const playEffect = useCallback(
    (preview = false, effectOverride?: EffectId) => {
      const id = effectOverride ?? effect;
      if (!preview && id === "none") return;
      const overlay = effectOverlayRef.current;
      if (!overlay) return;
      overlay.innerHTML = "";

      if (id === "ko") {
        const el = document.createElement("div");
        el.className = "effect-ko";
        el.textContent = "K.O!";
        overlay.appendChild(el);
        setTimeout(() => {
          overlay.innerHTML = "";
        }, 1300);
      } else if (id === "combo") {
        if (!preview) {
          comboCountRef.current += 1;
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
          comboTimerRef.current = setTimeout(() => {
            comboCountRef.current = 0;
          }, 3000);
        }
        const n = preview ? 1 : comboCountRef.current;
        const el = document.createElement("div");
        el.className = "effect-combo";
        el.innerHTML = `<div class="effect-combo-num">${n}</div><div class="effect-combo-label">COMBO!</div>`;
        overlay.appendChild(el);
        setTimeout(() => {
          overlay.innerHTML = "";
        }, 1500);
      } else if (id === "sakura") {
        const colors = ["#f9a8d4", "#fda4af", "#c4b5fd", "#fbcfe8", "#fecdd3"];
        for (let i = 0; i < 30; i++) {
          setTimeout(() => {
            const p = document.createElement("div");
            p.className = "effect-petal";
            p.style.left = `${Math.random() * 100}vw`;
            p.style.background =
              colors[Math.floor(Math.random() * colors.length)] ?? "#f9a8d4";
            p.style.width = `${Math.random() * 8 + 6}px`;
            p.style.height = `${Math.random() * 5 + 4}px`;
            p.style.animationDuration = `${Math.random() * 2 + 1.5}s`;
            overlay.appendChild(p);
            setTimeout(() => p.remove(), 3500);
          }, i * 60);
        }
      }
    },
    [effect],
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
      setBg("photo");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <BgLayer currentBg={bg} photoSrc={photoSrc} />
      <div id="effect-overlay" ref={effectOverlayRef} />

      <div className="container">
        <div className="header">
          <div className="header-left">
            <div className="header-title">
              <i className="ti ti-layout-list" /> タスク管理
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
              {(
                [
                  { id: "minimal" as const, prev: "prev-minimal", label: "ミニマル" },
                  { id: "cyber" as const, prev: "prev-cyber", label: "サイバー" },
                  { id: "pastel" as const, prev: "prev-pastel", label: "パステル" },
                ] as const
              ).map((tm) => (
                <button
                  key={tm.id}
                  type="button"
                  className={`theme-card${theme === tm.id ? " selected" : ""}`}
                  onClick={() => setTheme(tm.id)}
                >
                  <div className={`theme-preview ${tm.prev}`}>
                    <div className="tp-bar" />
                    <div className="tp-card">
                      <div className="tp-dot" />
                      <div className="tp-line" />
                      <div className="tp-badge" />
                    </div>
                    <div className="tp-card">
                      <div className="tp-dot" />
                      <div className="tp-line" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <div className={`theme-name ${tm.prev}`}>{tm.label}</div>
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
                onClick={() => setBg("none")}
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
              {GRAD_BG_META.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`bg-card${bg === b.id ? " selected" : ""}`}
                  onClick={() => setBg(b.id)}
                >
                  <div className="bg-preview" style={{ background: b.grad }} />
                  <div className="bg-label">{b.label}</div>
                  <div className="selected-check">✓</div>
                </button>
              ))}
            </div>
            <div className="section-title">アニメーション</div>
            <div className="bg-grid">
              {ANIM_BG_META.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`bg-card${bg === b.id ? " selected" : ""}`}
                  onClick={() => setBg(b.id)}
                >
                  <div
                    className="bg-preview"
                    style={{ background: ANIM_PREVIEW[b.id] ?? "#eee" }}
                  />
                  <div className="bg-label">{b.label}</div>
                  <div className="selected-check">✓</div>
                </button>
              ))}
            </div>
            <div className="section-title">マイ写真</div>
            <label className="upload-zone">
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
                    onClick={() => setBg("photo")}
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
              背景はアカウントに紐づいて保存されます（写真はこのブラウザの localStorage にも保存されます）。
            </div>
          </div>

          <div className={`tab-content${tab === "effect" ? " active" : ""}`}>
            <p className="mb-4 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              タスク完了時に演出を表示します。
            </p>
            <div className="flex flex-col gap-2.5">
              {(
                [
                  { id: "none" as const, icon: "🚫", t: "なし", d: "エフェクトなし" },
                  { id: "ko" as const, icon: "👊", t: "K.O!", d: "格闘ゲーム風・完了した瞬間ドンと出る" },
                  { id: "combo" as const, icon: "🔥", t: "コンボ！", d: "連続完了でカウントが上がる" },
                  { id: "sakura" as const, icon: "🌸", t: "桜吹雪", d: "ふわっと花びらが舞う" },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`effect-opt-btn${effect === o.id ? " active" : ""}`}
                  onClick={() => {
                    setEffect(o.id);
                    playEffect(true, o.id);
                  }}
                >
                  <span className="text-lg">{o.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{o.t}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{o.d}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
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
