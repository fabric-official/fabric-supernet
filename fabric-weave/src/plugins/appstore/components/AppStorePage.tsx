import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RegistryPlugin = {
  id: string; name: string; version: string;
  description?: string; categories?: string[];
  artifact?: { path: string; sha256?: string };
};
type RegistryIndex = { version: string; updated_at: string; plugins: RegistryPlugin[] };

const DEFAULT_INDEX =
  (import.meta as any).env?.VITE_APPSTORE_INDEX ??
  "https://raw.githubusercontent.com/fabric-official/app-store/main/registry/index.json";

function useRegistry() {
  const [data, setData] = React.useState<RegistryIndex | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch(String(DEFAULT_INDEX), { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((j: RegistryIndex) => { setData(j); setErr(null); })
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);
  return { data, err, loading, indexUrl: String(DEFAULT_INDEX) };
}

function artifactUrl(indexUrl: string, p: RegistryPlugin) {
  if (!p.artifact?.path) return null;
  if (/^https?:\/\//.test(p.artifact.path)) return p.artifact.path;
  const base = indexUrl.replace(/\/registry\/index\.json$/, "/").replace(/\/index\.json$/, "/");
  return base + p.artifact.path.replace(/^\.?\//, "");
}

export function AppStorePage() {
  const { data, err, loading, indexUrl } = useRegistry();

  const onInstall = (p: RegistryPlugin) => {
    const url = artifactUrl(indexUrl, p);
    if (!url) return alert("No artifact URL for this plugin.");
    fetch("/api/plugins/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, artifact: url, sha256: p.artifact?.sha256 ?? null }),
    })
      .then(res => { if (res.ok) alert(`Install requested for ${p.name}`); else window.open(url, "_blank", "noopener"); })
      .catch(() => window.open(url, "_blank", "noopener"));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Fabric App Store</div>
          <div className="text-xs text-muted-foreground">Source: {indexUrl}</div>
        </div>
      </div>

      {loading && <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <CardTitle className="h-5 bg-muted rounded w-40" />
              <CardDescription className="h-4 bg-muted rounded w-24 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </CardContent>
            <CardFooter>
              <div className="h-9 bg-muted rounded w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>}

      {err && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(data?.plugins ?? []).map((p) => (
            <Card key={p.id} className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">{p.version}</span>
                </div>
                {p.description && <CardDescription>{p.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                {p.categories?.length ? (
                  <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    {p.categories.map(c => <span key={c} className="px-2 py-0.5 bg-muted rounded-full">{c}</span>)}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex items-center gap-2">
                <Button size="sm" onClick={() => onInstall(p)}>Install</Button>
                {artifactUrl(indexUrl, p) && (
                  <a href={artifactUrl(indexUrl, p)!} target="_blank" rel="noreferrer" className="text-xs underline">
                    artifact
                  </a>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && !err && !data?.plugins?.length && (
        <div className="text-sm text-muted-foreground">No plugins found in registry.</div>
      )}
    </div>
  );
}

