/**
 * AppStore .tgz click/DOM interceptor  safe & opt-in.
 * Does NOT force any global API base.
 * Enable via: VITE_ENABLE_APPSTORE_INTERCEPTOR=true
 */

const ENABLED =
  ((import.meta as any).env?.VITE_ENABLE_APPSTORE_INTERCEPTOR ?? "false") === "true";
const API_BASE =
  ((import.meta as any).env?.VITE_API_BASE ?? "").replace(/\/$/, "");

async function downloadToArrayBuffer(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.arrayBuffer();
}

async function installFromUrl(url: string, idGuess?: string, versionGuess?: string) {
  const file = url.split("/").pop() || "plugin.tgz";
  const m = file.replace(/\.tgz$/i, "").match(/^(.+?)-(\d[\d\.]*.*)$/);
  const id = (m?.[1] || idGuess || "plugin").trim();
  const ver = (m?.[2] || versionGuess || "0.0.0").trim();

  // Preferred: API route if configured
  if (API_BASE) {
    const resp = await fetch(`${API_BASE}/api/plugins/install`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url, id, version: ver }),
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    return true;
  }

  // Fallback: Electron bridge
  const inst = (typeof window !== "undefined" && (window as any).FabricInstaller) || null;
  if (inst) {
    const buf = await downloadToArrayBuffer(url);
    const saved = await inst.saveBinaryToDisk(buf, file);
    await inst.install(saved);
    return true;
  }

  throw new Error("No VITE_API_BASE and no Electron bridge; cannot install.");
}

function maybeHandle(event: Event, el: HTMLAnchorElement | HTMLElement | null) {
  if (!el) return false;

  // Button path (data attributes)
  if (el instanceof HTMLElement && el.hasAttribute("data-appstore-install")) {
    const url = el.getAttribute("data-url") || "";
    const id  = el.getAttribute("data-id") || undefined;
    const ver = el.getAttribute("data-version") || undefined;
    if (url.toLowerCase().endsWith(".tgz")) {
      event.preventDefault();
      installFromUrl(url, id, ver)
        .then(() => location.reload())
        .catch(err => {
          console.error("[AppStore] install failed:", err);
          alert("Install failed: " + (err?.message || err));
        });
      return true;
    }
  }

  // Anchor path
  const a = (el instanceof HTMLAnchorElement) ? el : el.closest?.("a");
  if (a && a.href && a.href.toLowerCase().endsWith(".tgz")) {
    event.preventDefault();
    // store url in data attribute; avoid javascript: hrefs
    a.setAttribute("data-install-url", a.href);
    a.removeAttribute("download");
    installFromUrl(a.getAttribute("data-install-url") || "")
      .then(() => location.reload())
      .catch(err => {
        console.error("[AppStore] install failed:", err);
        alert("Install failed: " + (err?.message || err));
      });
    return true;
  }

  return false;
}

function globalInterceptSetup() {
  if (!ENABLED) {
    return; // opt-in only
  }

  // Capture-phase handlers trump default download behavior
  ["click","auxclick","contextmenu"].forEach(type => {
    document.addEventListener(
      type,
      (e: any) => {
        const t = e.target as HTMLElement | null;
        if (maybeHandle(e, t)) return;
      },
      { capture: true }
    );
  });

  // Rewrite any .tgz anchors that appear later
  const rew = (root: ParentNode | Document) => {
    root.querySelectorAll?.('a[href$=".tgz"], a[href$=".TGZ"]').forEach((a: Element) => {
      const an = a as HTMLAnchorElement;
      if (an.getAttribute("data-install-url")) return; // already processed
      an.setAttribute("data-install-url", an.href);
      an.removeAttribute("download");
      an.addEventListener("click", (e) => { maybeHandle(e, an); }, { capture: true });
    });
  };

  rew(document);
  const o = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((n) => {
        if (n instanceof HTMLElement) {
          rew(n);
        }
      });
    }
  });
  o.observe(document.documentElement, { childList: true, subtree: true });

  console.log("[AppStore] interceptor ready. API_BASE =", API_BASE || "(none)");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", globalInterceptSetup, { once: true });
} else {
  globalInterceptSetup();
}
