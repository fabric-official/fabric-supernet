// src/core/layout/Overview.tsx
import React, { FC, ReactNode, useMemo } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import { plugins } from "../../../plugin.config";
import { useCtx } from "@/core/utils/ctx";

function isFC(x: unknown): x is FC {
  return typeof x === "function";
}

type Renderable = { key: string; render: () => JSX.Element };

export default function Overview() {
  // keep ctx wired so RBAC/theme/etc are initialized by the provider
  const _ctx = useCtx();

  // Normalize all plugin widgets to renderable functions
  const widgets = useMemo<Renderable[]>(() => {
    const out: Renderable[] = [];
    for (const plugin of plugins) {
      const list = (plugin as any).widgets as Array<FC | ReactNode> | undefined;
      if (!list) continue;

      list.forEach((w, i) => {
        const key = `${plugin.id}-${i}`;
        if (isFC(w)) {
          const W = w; // preserve component identity
          out.push({ key, render: () => <W /> });
        } else {
          const node = w as ReactNode;
          out.push({ key, render: () => <>{node}</> });
        }
      });
    }
    return out;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Monitor your Fabric Supernet infrastructure"
      />

      {widgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map(({ key, render }) => (
            <div key={key} className="rounded-2xl border p-4 shadow-sm">
              {render()}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No overview widgets available. Plugins can provide widgets to display here.
          </p>
        </div>
      )}
    </div>
  );
}
