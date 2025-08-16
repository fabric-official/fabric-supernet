import React from "react";
type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(p: Props){ super(p); this.state = { hasError: false }; }
  static getDerivedStateFromError(e: any){ return { hasError: true, error: e }; }
  componentDidCatch(error: any, info: any){ console.error("UI crashed:", error, info); }
  render(){
      if(this.state.hasError){
        return (
          <div className="p-6 space-y-2">
            <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
            <pre className="text-sm text-muted-foreground overflow-auto">{String(this.state.error)}</pre>
          </div>
        );
      }
      return this.props.children;
  }
}
