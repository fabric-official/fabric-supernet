import QRCode from "qrcode";
export default function Onboard({ host }: any) {
  let container: HTMLDivElement | null = null;
  async function createNet() {
    const net = await host.runtime.invoke("network.create");
    const pkg = await host.runtime.invoke("agent.pkg", { platform: "windows" });
    const payload = pkg.qrPayload || net.qrPayload;
    const dataUrl = await QRCode.toDataURL(payload);
    if (container) {
      container.innerHTML = "";
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "Scan to join";
      img.style.maxWidth = "260px";
      img.style.imageRendering = "pixelated";
      container.appendChild(img);

      const pre = document.createElement("pre");
      pre.textContent = payload;
      container.appendChild(pre);

      const a = document.createElement("a");
      a.textContent = "Download agent bootstrap";
      a.href = "file://" + (pkg.download || "");
      container.appendChild(a);
    }
  }
  return {
    type: "div",
    props: {
      children: [
        { type: "button", props: { onClick: createNet, children: "Create Network + QR" } },
        { type: "div", props: { ref: (el:any)=>{container = el;}, style: "margin-top:12px;" } }
      ]
    }
  };
}
