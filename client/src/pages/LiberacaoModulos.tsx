import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LiberacaoModulos() {
  const { user } = useAuth();

  if (user?.role !== "master_admin") {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-slate-600">
              Apenas administradores master podem acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Liberação de Módulos"
        description="Gerencie permissões e acesso aos módulos do sistema"
      />

      <Card>
        <CardContent className="p-12 text-center">
          <Lock className="h-16 w-16 text-violet-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
          <p className="text-slate-600 mb-6">
            Em breve você poderá gerenciar permissões e liberar módulos por tenant.
          </p>
          <Button
            variant="outline"
            onClick={() => toast.info("Esta funcionalidade estará disponível em breve")}
          >
            Configurar Permissões
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
