import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Settings, Building2, FileText, Save } from "lucide-react";

export default function FiscalSettings() {
  const { user } = useAuth();
  
  // Queries
  const tenantQuery = trpc.tenants.getById.useQuery(user?.tenantId, {
    enabled: !!user?.tenantId,
  });
  
  const fiscalSettingsQuery = trpc.fiscal.getSettings.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutations
  const updateTenantMutation = trpc.tenants.update.useMutation({
    onSuccess: () => {
      toast.success("Dados da empresa atualizados com sucesso!");
      tenantQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar empresa: ${error.message}`);
    },
  });

  const updateFiscalSettingsMutation = trpc.fiscal.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações fiscais atualizadas com sucesso!");
      fiscalSettingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar configurações: ${error.message}`);
    },
  });

  // Estados locais para formulários
  const [tenantData, setTenantData] = useState({
    name: "",
    cnpj: "",
    address: "",
    phone: "",
  });

  const [fiscalData, setFiscalData] = useState({
    environment: "homologacao",
    nfeSeries: 1,
    nextNfeNumber: 1,
    nfceSeries: 1,
    nextNfceNumber: 1,
    cscToken: "",
    cscId: "",
  });

  // Carregar dados quando disponíveis
  useEffect(() => {
    if (tenantQuery.data) {
      setTenantData({
        name: tenantQuery.data.name || "",
        cnpj: tenantQuery.data.cnpj || "",
        address: tenantQuery.data.address || "",
        phone: tenantQuery.data.phone || "",
      });
    }
  }, [tenantQuery.data]);

  useEffect(() => {
    if (fiscalSettingsQuery.data) {
      setFiscalData({
        environment: fiscalSettingsQuery.data.environment || "homologacao",
        nfeSeries: fiscalSettingsQuery.data.nfeSeries || 1,
        nextNfeNumber: fiscalSettingsQuery.data.nextNfeNumber || 1,
        nfceSeries: fiscalSettingsQuery.data.nfceSeries || 1,
        nextNfceNumber: fiscalSettingsQuery.data.nextNfceNumber || 1,
        cscToken: fiscalSettingsQuery.data.cscToken || "",
        cscId: fiscalSettingsQuery.data.cscId || "",
      });
    }
  }, [fiscalSettingsQuery.data]);

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate(tenantData);
  };

  const handleFiscalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFiscalSettingsMutation.mutate({
      ...fiscalData,
      nfeSeries: Number(fiscalData.nfeSeries),
      nextNfeNumber: Number(fiscalData.nextNfeNumber),
      nfceSeries: Number(fiscalData.nfceSeries),
      nextNfceNumber: Number(fiscalData.nextNfceNumber),
      environment: fiscalData.environment as "homologacao" | "producao",
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações Fiscais"
        description="Gerencie os dados da sua empresa e parâmetros de emissão fiscal."
        icon={Settings}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Dados da Empresa</CardTitle>
            </div>
            <CardDescription>
              Informações que aparecerão no cabeçalho das notas e cupons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTenantSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social / Nome Fantasia</Label>
                <Input
                  id="name"
                  value={tenantData.name}
                  onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                  placeholder="Minha Loja LTDA"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={tenantData.cnpj}
                  onChange={(e) => setTenantData({ ...tenantData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={tenantData.phone}
                  onChange={(e) => setTenantData({ ...tenantData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  value={tenantData.address}
                  onChange={(e) => setTenantData({ ...tenantData, address: e.target.value })}
                  placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
                />
              </div>

              <Button type="submit" disabled={updateTenantMutation.isPending}>
                {updateTenantMutation.isPending ? "Salvando..." : "Salvar Dados da Empresa"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Parâmetros Fiscais */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Parâmetros de Emissão</CardTitle>
            </div>
            <CardDescription>
              Configure a numeração e ambiente de emissão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFiscalSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <Select 
                  value={fiscalData.environment} 
                  onValueChange={(value) => setFiscalData({ ...fiscalData, environment: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ambiente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homologacao">Homologação (Teste)</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nfceSeries">Série NFC-e</Label>
                  <Input
                    id="nfceSeries"
                    type="number"
                    value={fiscalData.nfceSeries}
                    onChange={(e) => setFiscalData({ ...fiscalData, nfceSeries: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextNfceNumber">Próx. Número NFC-e</Label>
                  <Input
                    id="nextNfceNumber"
                    type="number"
                    value={fiscalData.nextNfceNumber}
                    onChange={(e) => setFiscalData({ ...fiscalData, nextNfceNumber: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nfeSeries">Série NF-e</Label>
                  <Input
                    id="nfeSeries"
                    type="number"
                    value={fiscalData.nfeSeries}
                    onChange={(e) => setFiscalData({ ...fiscalData, nfeSeries: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextNfeNumber">Próx. Número NF-e</Label>
                  <Input
                    id="nextNfeNumber"
                    type="number"
                    value={fiscalData.nextNfeNumber}
                    onChange={(e) => setFiscalData({ ...fiscalData, nextNfeNumber: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cscId">ID do CSC (Token)</Label>
                <Input
                  id="cscId"
                  value={fiscalData.cscId}
                  onChange={(e) => setFiscalData({ ...fiscalData, cscId: e.target.value })}
                  placeholder="Ex: 000001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cscToken">Código CSC</Label>
                <Input
                  id="cscToken"
                  value={fiscalData.cscToken}
                  onChange={(e) => setFiscalData({ ...fiscalData, cscToken: e.target.value })}
                  placeholder="Código alfanumérico do CSC"
                  type="password"
                />
              </div>

              <Button type="submit" disabled={updateFiscalSettingsMutation.isPending}>
                {updateFiscalSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
