import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Verifica se é o erro específico de removeChild (comum com tradutores)
      const isDomError = this.state.error?.message?.includes("removeChild") || 
                         this.state.error?.message?.includes("insertBefore") ||
                         this.state.error?.message?.includes("NotFoundError");

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ops! Algo deu errado.
            </h2>
            
            <div className="mb-6 text-gray-600">
              {isDomError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Conflito detectado!</p>
                  <p>Parece que uma extensão ou tradutor automático modificou a página.</p>
                  <p className="mt-2">Por favor, <strong>desative a tradução automática</strong> para este site e recarregue.</p>
                </div>
              ) : (
                <p>Ocorreu um erro inesperado na aplicação.</p>
              )}
            </div>

            {/* Detalhes técnicos apenas se não for erro de DOM conhecido */}
            {!isDomError && process.env.NODE_ENV !== 'production' && (
              <div className="mb-6 p-3 bg-gray-100 rounded text-left overflow-auto max-h-32 text-xs font-mono text-gray-700">
                {this.state.error?.message}
              </div>
            )}

            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Recarregar Página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
