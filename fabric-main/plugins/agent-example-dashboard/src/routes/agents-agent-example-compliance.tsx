export default function View({ host }: any){
  return {
    type: "div",
    props: {
      className: "p-4 grid gap-4",
      children: [
        { type: "div", props: { className: "rounded-2xl shadow p-4", children: "Route: /agents/agent-example/compliance (Example Agent)" } },
        { type: "div", props: { className: "rounded-2xl shadow p-4 text-sm text-muted-foreground", children: "Agent: agent-example" } }
      ]
    }
  }
}