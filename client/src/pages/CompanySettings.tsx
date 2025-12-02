import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CompanySettings() {
  const [cnpj, setCnpj] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  
  const utils = trpc.useUtils();
  
  // Mutation para consultar CNPJ
  const lookupCNPJ = trpc.cnpj.lookup.useMutation({
    onSuccess: (result) => {
      setIsSearching(false);
      if (result.success) {
        setCompanyData(result.data);
        toast.success("Dados da empresa encontrados!");
      } else {
        toast.error(result.error || "CNPJ não encontrado");
        setCompanyData(null);
      }
    },
    onError: (error) => {
      setIsSearching(false);
      toast.error("Erro ao consultar CNPJ: " + error.message);
    },
  });
  
  // Mutation para salvar dados da empresa
  const updateTenantData = trpc.tenantManagement.updateCompanyData.useMutation({
    onSuccess: () => {
      toast.success("Dados da empresa salvos com sucesso!");
      utils.tenantManagement.getCurrentTenant.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao salvar dados: " + error.message);
    },
  });
  
  const handleSearch = () => {
    if (!cnpj || cnpj.length < 14) {
      toast.error("Digite um CNPJ válido");
      return;
    }
    
    setIsSearching(true);
    lookupCNPJ.mutate({ cnpj });
  };
  
  const handleSave = () => {
    if (!companyData) {
      toast.error("Consulte um CNPJ primeiro");
      return;
    }
    
    updateTenantData.mutate({
      cnpj: companyData.cnpj,
      razaoSocial: companyData.razaoSocial,
      nomeFantasia: companyData.nomeFantasia,
      endereco: companyData.enderecoCompleto,
      cidade: companyData.cidade,
      estado: companyData.estado,
      cep: companyData.cep,
      telefone: companyData.telefone,
      email: companyData.email,
    });
  };
  
  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 14) {
      return cleaned.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }
    return value;
  };
  
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setCnpj(value);
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuração da Empresa</h1>
          <p className="text-muted-foreground">
            Configure os dados da sua empresa para cupom fiscal, NF-e e cotações
          </p>
        </div>
      </div>
      
      {/* Card de consulta CNPJ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Consulta Automática de CNPJ</CardTitle>
          <CardDescription>
            Digite o CNPJ da sua empresa para buscar os dados automaticamente na Receita Federal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formatCNPJ(cnpj)}
                onChange={handleCNPJChange}
                maxLength={18}
                disabled={isSearching}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={isSearching || cnpj.length < 14}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Consultar
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A consulta é feita diretamente na base de dados da Receita Federal através da BrasilAPI (gratuita).
              Os dados são atualizados automaticamente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      {/* Card com dados encontrados */}
      {companyData && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>Dados Encontrados</CardTitle>
            </div>
            <CardDescription>
              Revise os dados abaixo antes de salvar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CNPJ</Label>
                <Input value={companyData.cnpjFormatted} disabled />
              </div>
              <div>
                <Label>Situação</Label>
                <Input value={companyData.situacao} disabled />
              </div>
            </div>
            
            <div>
              <Label>Razão Social</Label>
              <Input value={companyData.razaoSocial} disabled />
            </div>
            
            <div>
              <Label>Nome Fantasia</Label>
              <Input value={companyData.nomeFantasia} disabled />
            </div>
            
            <div>
              <Label>Endereço Completo</Label>
              <Input value={companyData.enderecoCompleto} disabled />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input value={companyData.cidade} disabled />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={companyData.estado} disabled />
              </div>
              <div>
                <Label>CEP</Label>
                <Input value={companyData.cep} disabled />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={companyData.telefone || "Não informado"} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={companyData.email || "Não informado"} disabled />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCompanyData(null);
                  setCnpj("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateTenantData.isPending}
              >
                {updateTenantData.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Salvar Dados
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Onde os dados serão utilizados?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Cupom Fiscal:</strong> Cabeçalho com nome, CNPJ e endereço da empresa</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>NF-e (Nota Fiscal Eletrônica):</strong> Dados do emitente</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Cotações:</strong> Identificação da empresa em propostas comerciais</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Relatórios:</strong> Cabeçalho padronizado em todos os documentos</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
