import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * AdminErrorBoundary
 * Catches any render errors occurring inside the admin portal and displays a recovery UI
 * without blanking the rest of the application.
 */
export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AdminErrorBoundary caught error]:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env?.DEV

      return (
        <div className="min-h-[60vh] bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">
            Something went wrong in the admin panel
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            An error occurred while rendering the admin console. You can retry loading the interface or return to the main console.
          </p>

          {isDev && this.state.error && (
            <div className="mb-6 max-w-xl w-full p-4 rounded-xl bg-zinc-900 border border-red-500/40 text-left overflow-x-auto">
              <p className="text-[11px] font-mono font-bold text-red-400 mb-1">
                Development Error Trace:
              </p>
              <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap break-all">
                {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/admin'
              }}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reload Admin
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
