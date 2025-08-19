async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.arrayBuffer();
}
function findAnchor(el: EventTarget | null): HTMLAnchorElement | null {
  let n = el as HTMLElement | null;
  while (n && n !== document.body) {
    if (n.tagName === "A") return n as HTMLAnchorElement;
    n = n.parentElement;
  }
  return null;
}
async function handleTgzInstall(e: Event, url: string, suggestedName?: string) {
  e.preventDefault();
  if (!("FabricInstaller" in window)) {
    console.warn("[AppStore] Electron bridge missing; cannot install.");
    alert("Installer bridge missing. Start the Electron app, not just the Vite dev server.");
    return;
  }
  try {
    const buf = await fetchArrayBuffer(url);
    const filename = suggestedName || url.split("/").pop() || "plugin.tgz";
    const saved = await window.FabricInstaller.saveBinaryToDisk(buf, filename);
    await window.FabricInstaller.install(saved);
    // Force reload so Sidebar reads updated plugin.config.ts
    location.reload();
  } catch (err) {
    const msg = (err instanceof Error) ? err.message : String(err);
    console.error("Install failed:", err);
    alert("Plugin install failed: " + msg);
  }
}
// capture-phase listener so we win before default download handlers
document.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;

  // Button path
  const btn = target.closest("[data-appstore-install]") as HTMLElement | null;
  if (btn) {
    const url = btn.getAttribute("data-url") || "";
    const id  = btn.getAttribute("data-id") || "plugin";
    const ver = btn.getAttribute("data-version") || "0.0.0";
    if (url && url.endsWith(".tgz")) {
      await handleTgzInstall(e, url, `${id}-${ver}.tgz`);
      return;
    }
  }
  // Anchor path
  const a = findAnchor(e.target);
  if (a) {
    const href = a.href || "";
    if (href.endsWith(".tgz") || a.hasAttribute("download")) {
      await handleTgzInstall(e, href);
      return;
    }
  }
}, { capture: true });
