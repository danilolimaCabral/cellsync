import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { 
  ShieldCheck, 
  ShoppingCart, 
  Package, 
  Users, 
  Wrench, 
  FileText, 
  BarChart3, 
  Settings,
  Database,
  Truck,
  MessageSquare
} from "lucide-react";

const MODULES = [
  { id: "pos", label: "PDV (Vendas)", icon: ShoppingCart, description: "Frente de caixa e emissão de cupons" },
  { id: "stock", label: "Controle de Estoque", icon: Package, description: "Gestão de produtos e inventário" },
  { id: "customers", label: "Gestão de Clientes", icon: Users, description: "CRM e histórico de clientes" },
  { id: "service_orders", label: "Ordens de Serviço", icon: Wrench, description: "Gestão de reparos e serviços" },
  { id: "financial", label: "Financeiro", icon: FileText, description: "Contas a pagar, receber e fluxo de caixa" },
  { id: "reports", label: "Relatórios Avançados", icon: BarChart3, description: "BI e análises detalhadas" },
  { id: "nfe", label: "Emissão Fiscal (NF-e/NFC-e)", icon: FileText, description: "Emissão de notas fiscais" },
  { id: "whatsapp", label: "Integração WhatsApp", icon: MessageSquare, description: "Notificações automáticas" },
  { id: "multi_stock", label: "Multi-Estoque", icon: Database, description: "Múltiplos locais de estoque" },
  { id: "suppliers", label: "Gestão de Fornecedores", icon: Truck, description: "Compras e fornecedores" },
];

export default function LiberacaoModulos() {
  const { user } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  
  // Queries
  const { data: tenants } = trpc.tenants.list.useQuery();
  const { data: permissions, refetch } = trpc.tenants.getPermissions.useQuery(
    { tenantId: Number(selectedTenant) },
    { enabled: !!selectedTenant }
  );

  // Mutation
  const updatePermissionMutation = trpc.tenants.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success("Permissões atualizadas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    if (!selectedTenant) return;

    await updatePermissionMutation.mutateAsync({
      tenantId: Number(selectedTenant),
      moduleId,
      enabled
    });
  };

  if (user?.role !== "master_admin") {
    return (
      <div className="p-4 md:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-700">Acesso Restrito</h3>
            <p className="text-red-600">
              Esta área é exclusiva para administradores do sistema.
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
        description="Gerencie quais funcionalidades cada empresa pode acessar"
      />

      <div className="grid gap-6">
        {/* Seleção de Tenant */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione a Empresa</CardTitle>
            <CardDescription>Escolha qual cliente deseja configurar</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Selecione uma empresa..." />
              </SelectTrigger>
              <SelectContent>
                {tenants?.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={String(tenant.id)}>
                    {tenant.name} (ID: {tenant.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista de Módulos */}
        {selectedTenant && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((module) => {
              const isEnabled = permissions?.includes(module.id) || false;
              const Icon = module.icon;

              return (
                <Card key={module.id} className={`transition-all duration-200 ${isEnabled ? 'border-green-200 bg-green-50/30' : 'opacity-80'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{module.label}</h4>
                          <p className="text-xs text-slate-500 mt-1">{module.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggleModule(module.id, checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!selectedTenant && (
          <div className="text-center py-12 text-slate-400">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Selecione uma empresa acima para visualizar os módulos disponíveis</p>
          </div>
        )}
      </div>
    </div>
  );
}
