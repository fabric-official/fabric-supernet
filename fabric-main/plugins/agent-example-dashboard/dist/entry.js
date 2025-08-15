// plugins/agent-example-dashboard/src/routes/agents-agent-example.tsx
function View({ host }) {
  return {
    type: "div",
    props: {
      className: "p-4 grid gap-4",
      children: [
        { type: "div", props: { className: "rounded-2xl shadow p-4", children: "Route: /agents/agent-example (Example Agent)" } },
        { type: "div", props: { className: "rounded-2xl shadow p-4 text-sm text-muted-foreground", children: "Agent: agent-example" } }
      ]
    }
  };
}

// plugins/agent-example-dashboard/src/routes/agents-agent-example-devices.tsx
function View2({ host }) {
  return {
    type: "div",
    props: {
      className: "p-4 grid gap-4",
      children: [
        { type: "div", props: { className: "rounded-2xl shadow p-4", children: "Route: /agents/agent-example/devices (Example Agent)" } },
        { type: "div", props: { className: "rounded-2xl shadow p-4 text-sm text-muted-foreground", children: "Agent: agent-example" } }
      ]
    }
  };
}

// plugins/agent-example-dashboard/src/routes/agents-agent-example-logs.tsx
function View3({ host }) {
  return {
    type: "div",
    props: {
      className: "p-4 grid gap-4",
      children: [
        { type: "div", props: { className: "rounded-2xl shadow p-4", children: "Route: /agents/agent-example/logs (Example Agent)" } },
        { type: "div", props: { className: "rounded-2xl shadow p-4 text-sm text-muted-foreground", children: "Agent: agent-example" } }
      ]
    }
  };
}

// plugins/agent-example-dashboard/src/routes/agents-agent-example-compliance.tsx
function View4({ host }) {
  return {
    type: "div",
    props: {
      className: "p-4 grid gap-4",
      children: [
        { type: "div", props: { className: "rounded-2xl shadow p-4", children: "Route: /agents/agent-example/compliance (Example Agent)" } },
        { type: "div", props: { className: "rounded-2xl shadow p-4 text-sm text-muted-foreground", children: "Agent: agent-example" } }
      ]
    }
  };
}

// plugins/agent-example-dashboard/src/routes/agents-agent-example-licenses.tsx
function View5({ host }) {
  return {
    type: "div",
    props: {
      className: "p-4 grid gap-4",
      children: [
        { type: "div", props: { className: "rounded-2xl shadow p-4", children: "Route: /agents/agent-example/licenses (Example Agent)" } },
        { type: "div", props: { className: "rounded-2xl shadow p-4 text-sm text-muted-foreground", children: "Agent: agent-example" } }
      ]
    }
  };
}

// plugins/agent-example-dashboard/src/entry.ts
function register() {
  const host = window.FabricPluginHost;
  host.registerRoutes([
    { path: "/agents/agent-example", title: "agent-example", element: View({ host }) },
    { path: "/agents/agent-example/devices", title: "devices", element: View2({ host }) },
    { path: "/agents/agent-example/logs", title: "logs", element: View3({ host }) },
    { path: "/agents/agent-example/compliance", title: "compliance", element: View4({ host }) },
    { path: "/agents/agent-example/licenses", title: "licenses", element: View5({ host }) }
  ]);
}
export {
  register as default
};
