import type { FabricPluginHost } from "./types";
import agents_agent_example from './routes/agents-agent-example.tsx';
import agents_agent_example_devices from './routes/agents-agent-example-devices.tsx';
import agents_agent_example_logs from './routes/agents-agent-example-logs.tsx';
import agents_agent_example_compliance from './routes/agents-agent-example-compliance.tsx';
import agents_agent_example_licenses from './routes/agents-agent-example-licenses.tsx';
export default function register(){
  const host = (window as any).FabricPluginHost as FabricPluginHost;
  host.registerRoutes([
    { path: "/agents/agent-example", title: "agent-example", element: agents_agent_example({ host }) },
    { path: "/agents/agent-example/devices", title: "devices", element: agents_agent_example_devices({ host }) },
    { path: "/agents/agent-example/logs", title: "logs", element: agents_agent_example_logs({ host }) },
    { path: "/agents/agent-example/compliance", title: "compliance", element: agents_agent_example_compliance({ host }) },
    { path: "/agents/agent-example/licenses", title: "licenses", element: agents_agent_example_licenses({ host }) }
  ]);
}