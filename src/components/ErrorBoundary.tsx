import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl">
            <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">System Error</h1>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              The application encountered a runtime exception. This usually happens due to corrupted local data or missing configuration.
            </p>
            <div className="bg-black/50 p-4 rounded-xl border border-white/5 mb-8 overflow-auto max-h-40">
              <code className="text-[10px] text-red-400 font-mono">
                {this.state.error?.toString()}
              </code>
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-200 transition-all"
            >
              Reset System Data
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
