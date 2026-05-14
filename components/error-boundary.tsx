'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Erro desconhecido'
      return this.props.fallback || (
        <div className="min-h-dvh bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-destructive font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Algo deu errado</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-destructive mb-4 p-2 bg-destructive/10 rounded break-all">
                {errorMessage}
              </p>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm active:scale-95 transition-all"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
