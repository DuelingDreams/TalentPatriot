import React from "react";

export class ErrorBoundary extends React.Component<{children: React.ReactNode},{error?: Error}> {
  constructor(props:any){ super(props); this.state = { error: undefined }; }
  static getDerivedStateFromError(error: Error){ return { error }; }
  componentDidCatch(error: Error, info: any){ console.error("UI Crash:", error, info); }
  render(){
    if (this.state.error){
      return (
        <div className="p-6 max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="mb-4">Please try reloading the page.</p>
          <pre className="text-left text-xs overflow-auto max-h-40 bg-gray-100 p-3 rounded">{this.state.error.message}</pre>
          <button onClick={()=>location.reload()} className="px-4 py-2 rounded bg-blue-600 text-white">Reload</button>
        </div>
      );
    }
    return this.props.children as any;
  }
}