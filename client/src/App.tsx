import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import OrdemServico from "./pages/OrdemServico";
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

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
