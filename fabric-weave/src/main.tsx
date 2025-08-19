try { delete (window as any).__API_BASE__; } catch {}
import "./infra/forceInstallInterceptor";
import "./infra/appstoreAutoInstaller";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);




if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}
