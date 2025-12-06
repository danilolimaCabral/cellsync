import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FolderTree, Search } from "lucide-react";

export default function ChartOfAccounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "asset",
    is_analytical: true,
    description: "",
  });

  const utils = trpc.useContext();
  const { data: accounts = [], isLoading } = trpc.accounting.getChartOfAccounts.useQuery();

  const createMutation = trpc.accounting.createAccount.useMutation({
    onSuccess: () => {
      toast.success("Conta criada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.accounting.getChartOfAccounts.invalidate();
    },
    onError: (error) => toast.error(`Erro ao criar conta: ${error.message}`),
  });

  const updateMutation = trpc.accounting.updateAccount.useMutation({
    onSuccess: () => {
      toast.success("Conta atualizada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.accounting.getChartOfAccounts.invalidate();
    },
    onError: (error) => toast.error(`Erro ao atualizar conta: ${error.message}`),
  });

  const deleteMutation = trpc.accounting.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Conta removida com sucesso!");
      utils.accounting.getChartOfAccounts.invalidate();
    },
    onError: (error) => toast.error(`Erro ao remover conta: ${error.message}`),
  });

  const resetForm = () => {
    setFormData({
      account_code: "",
      account_name: "",
      account_type: "asset",
      is_analytical: true,
      description: "",
    });
    setEditingAccount(null);
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      is_analytical: account.is_analytical,
      description: account.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta conta?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateMutation.mutate({
        id: editingAccount.id,
        ...formData,
        account_type: formData.account_type as any,
      });
    } else {
      createMutation.mutate({
        ...formData,
        account_type: formData.account_type as any,
      });
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.account_code.includes(searchTerm)
  );

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      asset: "Ativo",
      liability: "Passivo",
      equity: "Patrimônio Líquido",
      revenue: "Receita",
      expense: "Despesa"
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano de Contas"
        description="Gerencie a estrutura de contas contábeis da sua empresa."
        icon={FolderTree}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAccount ? "Editar Conta" : "Nova Conta Contábil"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={formData.account_code}
                      onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                      placeholder="Ex: 1.1.01"
                      disabled={!!editingAccount} // Código não editável
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asset">Ativo</SelectItem>
                        <SelectItem value="liability">Passivo</SelectItem>
                        <SelectItem value="equity">Patrimônio Líquido</SelectItem>
                        <SelectItem value="revenue">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Conta</Label>
                  <Input
                    id="name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    placeholder="Ex: Caixa Geral"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="analytical"
                    checked={formData.is_analytical}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_analytical: checked })}
                  />
                  <Label htmlFor="analytical">Conta Analítica (aceita lançamentos)</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAccount ? "Salvar Alterações" : "Criar Conta"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Estrutura de Contas</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conta..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Código</TableHead>
                <TableHead>Nome da Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma conta encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">{account.account_code}</TableCell>
                    <TableCell>
                      <span style={{ paddingLeft: `${(account.account_code.split('.').length - 1) * 12}px` }}>
                        {account.account_name}
                      </span>
                    </TableCell>
                    <TableCell>{getTypeLabel(account.account_type)}</TableCell>
                    <TableCell>
                      {account.is_analytical ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Analítica
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Sintética
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
