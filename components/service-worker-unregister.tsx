"use client";

import { useEffect } from "react";

const SW_CLEARED_KEY = "__taskman_sw_cleared_v1";

/**
 * 旧スタンドアロン版の `public/sw.js` が cache-first で `/` をキャッシュしていたため、
 * Next の初期画面のまま表示されることがあった。登録を解除し、初回のみリロードする。
 */
export function ServiceWorkerUnregister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then(async (regs) => {
      if (regs.length === 0) return;
      await Promise.all(regs.map((r) => r.unregister()));
      if (!sessionStorage.getItem(SW_CLEARED_KEY)) {
        sessionStorage.setItem(SW_CLEARED_KEY, "1");
        window.location.reload();
      }
    });
  }, []);
  return null;
}
