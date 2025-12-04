import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Trash2, UserCog } from "lucide-react";

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserManagementDialog({ open, onOpenChange }: UserManagementDialogProps) {
  const utils = trpc.useContext();
  const { data: users, isLoading } = trpc.system.getAllUsers.useQuery(undefined, {
    enabled: open,
  });

  const updateUserRole = trpc.system.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Função do usuário atualizada com sucesso");
      utils.system.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar função: ${error.message}`);
    },
  });

  const deleteUser = trpc.system.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido com sucesso");
      utils.system.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao remover usuário: ${error.message}`);
    },
  });

  const handleRoleChange = (userId: number, newRole: "master_admin" | "admin" | "vendedor") => {
    updateUserRole.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (confirm(`Tem certeza que deseja remover o usuário ${userName}? Esta ação não pode ser desfeita.`)) {
      deleteUser.mutate({ userId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gerenciar Usuários
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie todos os usuários do sistema, suas funções e permissões.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">#{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        {user.tenantName ? (
                          <Badge variant="outline">{user.tenantName}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem Tenant</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => 
                            handleRoleChange(user.id, value as "master_admin" | "admin" | "vendedor")
                          }
                          disabled={updateUserRole.isLoading}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="master_admin">Master Admin</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="vendedor">Vendedor</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user.id, user.name || "Usuário")}
                          disabled={deleteUser.isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
