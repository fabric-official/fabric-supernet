import React from "react";
import { BrowserRouter, Routes, Route, useParams, Navigate } from "react-router-dom";
import { listPlugins, loadPlugin } from "./services/PluginManager";

function PluginHost() {
  const { id } = useParams<{ id: string }>();
  const [Cmp, setCmp] = React.useState<React.ComponentType<any> | null>(null);
  const [err, setErr] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      try {
        const caps = ["plugins:read"]; // caller’s capabilities (expand when you add auth)
        const cmp = id ? await loadPlugin(id, caps) : null;
        setCmp(cmp);
      } catch (e: any) {
        setErr(e?.message || "Load error");
      }
    })();
  }, [id]);

  if (err) return <div className="p-4 text-red-500">Error: {err}</div>;
  if (!Cmp) return <div className="p-4">Loading plugin…</div>;
  return <Cmp />;
}

function Index() {
  const [items, setItems] = React.useState<Array<{id:string; title:string}>>([]);
  React.useEffect(() => { (async () => { setItems(await listPlugins()); })(); }, []);
  return (
    <div className="p-6">
      <h1>Fabric Dashboard Host</h1>
      <ul>
        {items.map(p => (
          <li key={p.id}><a href={`#/plugins/${p.id}`}>{p.title}</a></li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index/>} />
        <Route path="/plugins/:id" element={<PluginHost/>} />
        <Route path="*" element={<Navigate to="/"/>} />
      </Routes>
    </BrowserRouter>
  );
}
