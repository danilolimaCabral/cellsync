import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit,
  Star,
} from "lucide-react";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });

  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();

  const createCustomerMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      setShowAddCustomer(false);
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        notes: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar cliente");
    },
  });

  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCustomer.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    createCustomerMutation.mutate({
      name: newCustomer.name,
      email: newCustomer.email || undefined,
      phone: newCustomer.phone || undefined,
      cpf: newCustomer.cpf || undefined,
      address: newCustomer.address || undefined,
      city: newCustomer.city || undefined,
      state: newCustomer.state || undefined,
      zipCode: newCustomer.zipCode || undefined,
      notes: newCustomer.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Clientes" 
          description="Gestão de relacionamento com clientes (CRM)"
          backTo="/dashboard"
        />
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    required
                  />
                </div>

                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="joao@email.com"
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                  />
                </div>

                <div className="col-span-2">
                  <Label>CPF</Label>
                  <Input
                    value={newCustomer.cpf}
                    onChange={(e) => setNewCustomer({ ...newCustomer, cpf: e.target.value })}
                    placeholder="123.456.789-00"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="Rua das Flores, 123"
                  />
                </div>

                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <Label>Estado</Label>
                  <Input
                    value={newCustomer.state}
                    onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>

                <div className="col-span-2">
                  <Label>CEP</Label>
                  <Input
                    value={newCustomer.zipCode}
                    onChange={(e) => setNewCustomer({ ...newCustomer, zipCode: e.target.value })}
                    placeholder="01234-567"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Observações</Label>
                  <textarea
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    placeholder="Informações adicionais sobre o cliente..."
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCustomer(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending ? "Salvando..." : "Cadastrar Cliente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers?.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Com compras recentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Clientes VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Alto valor de compra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Novos Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {customers?.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Cadastrados recentemente</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Pontos</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers?.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{customer.name}</div>
                      {customer.segment && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {customer.segment}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{customer.cpf || "-"}</TableCell>
                  <TableCell>
                    {customer.city && customer.state ? (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {customer.city}, {customer.state}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ativo
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {customer.loyaltyPoints || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
