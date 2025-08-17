
// Minimal example plugin ESM (no secrets).
export default function init({ mountEl, route }) {
  mountEl.innerHTML = `
    <div style="padding:16px;font-family:system-ui">
      <h3>Hello from Plugin</h3>
      <p>Route: <code>${route || '/'}</code></p>
    </div>
  `;
}
