import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Phone,
  Mail,
  IdCard,
} from "lucide-react";

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);

  // Queries
  const { data: vendors, isLoading, refetch } = trpc.vendors.list.useQuery({
    search: searchTerm || undefined,
  });

  // Mutations
  const createVendor = trpc.vendors.create.useMutation({
    onSuccess: () => {
      toast.success("Vendedor cadastrado com sucesso!");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar vendedor");
    },
  });

  const updateVendor = trpc.vendors.update.useMutation({
    onSuccess: () => {
      toast.success("Vendedor atualizado com sucesso!");
      setEditingVendor(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar vendedor");
    },
  });

  const deleteVendor = trpc.vendors.delete.useMutation({
    onSuccess: () => {
      toast.success("Vendedor desativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desativar vendedor");
    },
  });

  // Handlers
  const handleCreateVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createVendor.mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      cpf: formData.get("cpf") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      commissionPercentage: Number(formData.get("commissionPercentage")) * 100, // Converter % para centésimos
      commissionType: formData.get("commissionType") as "percentual" | "fixo" | "misto",
      fixedCommissionAmount: Number(formData.get("fixedCommissionAmount")) * 100, // Converter R$ para centavos
    });
  };

  const handleUpdateVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateVendor.mutate({
      id: editingVendor.id,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      cpf: formData.get("cpf") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      commissionPercentage: Number(formData.get("commissionPercentage")) * 100,
      commissionType: formData.get("commissionType") as "percentual" | "fixo" | "misto",
      fixedCommissionAmount: Number(formData.get("fixedCommissionAmount")) * 100,
    });
  };

  const handleDeleteVendor = (id: number, name: string) => {
    if (confirm(`Deseja realmente desativar o vendedor "${name}"?`)) {
      deleteVendor.mutate({ id });
    }
  };

  // Format helpers
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatPercentage = (centesimal: number) => {
    return `${(centesimal / 100).toFixed(2)}%`;
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendedores</h1>
          <p className="text-muted-foreground">
            Gerencie vendedores e comissões
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Vendedor</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo vendedor
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="João da Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="joao@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionType">Tipo de Comissão</Label>
                  <Select name="commissionType" defaultValue="percentual">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual</SelectItem>
                      <SelectItem value="fixo">Valor Fixo</SelectItem>
                      <SelectItem value="misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionPercentage">Comissão (%)</Label>
                  <Input
                    id="commissionPercentage"
                    name="commissionPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue="5.00"
                    placeholder="5.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fixedCommissionAmount">Valor Fixo (R$)</Label>
                  <Input
                    id="fixedCommissionAmount"
                    name="fixedCommissionAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createVendor.isPending}>
                  {createVendor.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendedores</CardTitle>
          <CardDescription>
            {vendors?.length || 0} vendedor(es) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : vendors && vendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {vendor.email}
                        </div>
                        {vendor.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {vendor.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {vendor.cpf ? (
                        <div className="flex items-center gap-1 text-sm">
                          <IdCard className="w-3 h-3" />
                          {formatCPF(vendor.cpf)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-3 h-3" />
                        {vendor.commissionType === "percentual" && (
                          <span>{formatPercentage(vendor.commissionPercentage || 0)}</span>
                        )}
                        {vendor.commissionType === "fixo" && (
                          <span>{formatCurrency(vendor.fixedCommissionAmount || 0)}</span>
                        )}
                        {vendor.commissionType === "misto" && (
                          <span>
                            {formatPercentage(vendor.commissionPercentage || 0)} + {formatCurrency(vendor.fixedCommissionAmount || 0)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.active ? "default" : "secondary"}>
                        {vendor.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingVendor(vendor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum vendedor encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingVendor && (
        <Dialog open={!!editingVendor} onOpenChange={() => setEditingVendor(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Vendedor</DialogTitle>
              <DialogDescription>
                Atualize os dados do vendedor
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingVendor.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingVendor.email}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cpf">CPF</Label>
                  <Input
                    id="edit-cpf"
                    name="cpf"
                    defaultValue={editingVendor.cpf || ""}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    defaultValue={editingVendor.phone || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-commissionType">Tipo de Comissão</Label>
                  <Select name="commissionType" defaultValue={editingVendor.commissionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual</SelectItem>
                      <SelectItem value="fixo">Valor Fixo</SelectItem>
                      <SelectItem value="misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-commissionPercentage">Comissão (%)</Label>
                  <Input
                    id="edit-commissionPercentage"
                    name="commissionPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={((editingVendor.commissionPercentage || 0) / 100).toFixed(2)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-fixedCommissionAmount">Valor Fixo (R$)</Label>
                  <Input
                    id="edit-fixedCommissionAmount"
                    name="fixedCommissionAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={((editingVendor.fixedCommissionAmount || 0) / 100).toFixed(2)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingVendor(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateVendor.isPending}>
                  {updateVendor.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
