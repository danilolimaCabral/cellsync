import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Plus,
  UserCog,
  Mail,
  Phone,
  TrendingUp,
  DollarSign,
  Award,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function Vendedores() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("5");
  const [active, setActive] = useState("true");

  // Queries
  const { data: vendedores, isLoading, refetch } = trpc.users.listByRole.useQuery(
    { role: "vendedor" }
  );

  // Mutations
  const createVendedorMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Vendedor cadastrado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar vendedor", {
        description: error.message,
      });
    },
  });

  const updateVendedorMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Vendedor atualizado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar vendedor", {
        description: error.message,
      });
    },
  });

  const deleteVendedorMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Vendedor removido com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover vendedor", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCommissionRate("5");
    setActive("true");
    setEditingId(null);
  };

  const handleEdit = (vendedor: any) => {
    setEditingId(vendedor.id);
    setName(vendedor.name);
    setEmail(vendedor.email);
    setPhone(vendedor.phone || "");
    setCommissionRate(vendedor.commissionRate?.toString() || "5");
    setActive(vendedor.active ? "true" : "false");
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name || !email) {
      toast.error("Campos obrigatórios", {
        description: "Preencha nome e email.",
      });
      return;
    }

    const data = {
      name,
      email,
      phone,
      role: "vendedor" as const,
      commissionRate: parseFloat(commissionRate),
      active: active === "true",
    };

    if (editingId) {
      updateVendedorMutation.mutate({ id: editingId, ...data });
    } else {
      createVendedorMutation.mutate({ ...data, password: "123456" });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este vendedor?")) {
      deleteVendedorMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Gestão de Vendedores"
          description="Gerencie sua equipe de vendas"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Vendedor" : "Cadastrar Vendedor"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do vendedor
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Taxa de Comissão (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <Select value={active} onValueChange={setActive}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!editingId && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Senha padrão:</strong> 123456 (o vendedor poderá alterá-la após o primeiro login)
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createVendedorMutation.isPending || updateVendedorMutation.isPending}
              >
                {editingId ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Vendedores */}
      {!vendedores || vendedores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCog className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              Nenhum vendedor cadastrado. Adicione o primeiro vendedor agora.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendedores.map((vendedor: any, index: number) => (
            <motion.div
              key={vendedor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                        {vendedor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{vendedor.name}</CardTitle>
                        <Badge variant={vendedor.active ? "default" : "secondary"} className="mt-1">
                          {vendedor.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {vendedor.email}
                  </div>
                  {vendedor.phone && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {vendedor.phone}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-slate-600">
                    <Award className="h-4 w-4 mr-2" />
                    Comissão: {vendedor.commissionRate || 5}%
                  </div>

                  <div className="pt-3 border-t flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(vendedor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(vendedor.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
