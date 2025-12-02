import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import OrdemServico from "./pages/OrdemServico";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import HistoricoVendas from "./pages/HistoricoVendas";
import Movimentacoes from "./pages/Movimentacoes";
import Comissoes from "@/pages/Comissoes";
import NotasFiscais from "@/pages/NotasFiscais";
import EmitirNFe from "@/pages/EmitirNFe";
import Configuracoes from "./pages/Configuracoes";
import Notificacoes from "./pages/Notificacoes";
import RelatorioAvancadoEstoque from "./pages/RelatorioAvancadoEstoque";
import ImportarProdutos from "./pages/ImportarProdutos";
import GerarEtiquetas from "./pages/GerarEtiquetas";
import ImportarXML from "./pages/ImportarXML";
import ImportarPlanilha from "./pages/ImportarPlanilha";
import Planos from "./pages/Planos";
import AdminMaster from "./pages/AdminMaster";
import GerenciarBackups from "./pages/GerenciarBackups";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./hooks/useAuth";

// Componente para proteger rotas autenticadas
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/cadastro" component={Cadastro} />
      <Route path="/planos" component={Planos} />
      
      {/* Rota Admin Master - Apenas para master_admin */}
      <Route path="/admin-master">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <AdminMaster />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      
      {/* Rota de Gerenciamento de Backups - Apenas para master_admin */}
      <Route path="/gerenciar-backups">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <GerenciarBackups />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      
      {/* Rotas protegidas com DashboardLayout */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/vendas">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Vendas />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/estoque">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Estoque />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/importar-produtos">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <ImportarProdutos />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/gerar-etiquetas">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <GerarEtiquetas />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/importar-xml">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <ImportarXML />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/importar-planilha">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <ImportarPlanilha />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/clientes">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Clientes />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/os">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <OrdemServico />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/financeiro">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Financeiro />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/relatorios">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Relatorios />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/historico-vendas">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <HistoricoVendas />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/movimentacoes">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Movimentacoes />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/comissoes">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Comissoes />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/configuracoes">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Configuracoes />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/notas-fiscais">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <NotasFiscais />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/emitir-nfe">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <EmitirNFe />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/notificacoes">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Notificacoes />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/relatorio-avancado-estoque">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <RelatorioAvancadoEstoque />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
