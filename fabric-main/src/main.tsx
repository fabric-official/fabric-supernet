import './index.css';
import './App.css';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
createRoot(document.getElementById("root")!).render(<ErrorBoundary><App /></ErrorBoundary>);


