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
import { toast } from "sonner";
import { Plus, FileText, Calendar, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";

export default function JournalEntries() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  
  // Estado para linhas do lançamento
  const [lines, setLines] = useState<Array<{
    account_id: string; // string para select, converter para number depois
    debit: string;
    credit: string;
    desc: string;
  }>>([
    { account_id: "", debit: "0", credit: "0", desc: "" },
    { account_id: "", debit: "0", credit: "0", desc: "" }
  ]);

  const utils = trpc.useContext();
  
  // Queries
  const { data: postings = [], isLoading } = trpc.accounting.getPostings.useQuery({
    limit: 50
  });
  
  const { data: accounts = [] } = trpc.accounting.getChartOfAccounts.useQuery();

  const suggestMutation = trpc.accounting.suggestEntry.useMutation({
    onSuccess: (data) => {
      if (data.confidence === "low") {
        toast.warning("IA com baixa confiança. Verifique os dados.");
      } else {
        toast.success("Sugestão aplicada!");
      }
      
      // Encontrar IDs das contas baseados nos códigos sugeridos
      // A IA retorna códigos (ex: 1.1.01), precisamos achar o ID interno
      const debitAccount = accounts.find(a => a.account_code === data.debit_account_code);
      const creditAccount = accounts.find(a => a.account_code === data.credit_account_code);

      setLines([
        { 
          account_id: debitAccount ? String(debitAccount.id) : "", 
          debit: "0", 
          credit: "0", 
          desc: data.description 
        },
        { 
          account_id: creditAccount ? String(creditAccount.id) : "", 
          debit: "0", 
          credit: "0", 
          desc: data.description 
        }
      ]);
      
      toast.info(`Raciocínio: ${data.reasoning}`);
    },
    onError: (error) => toast.error(`Erro na IA: ${error.message}`)
  });

  // Mutation
  const createPostingMutation = trpc.accounting.createPosting.useMutation({
    onSuccess: () => {
      toast.success("Lançamento realizado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.accounting.getPostings.invalidate();
    },
    onError: (error) => toast.error(`Erro ao lançar: ${error.message}`),
  });

  const resetForm = () => {
    setPostingDate(new Date().toISOString().split('T')[0]);
    setDescription("");
    setLines([
      { account_id: "", debit: "0", credit: "0", desc: "" },
      { account_id: "", debit: "0", credit: "0", desc: "" }
    ]);
  };

  const addLine = () => {
    setLines([...lines, { account_id: "", debit: "0", credit: "0", desc: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error("Um lançamento deve ter pelo menos 2 linhas.");
      return;
    }
    const newLines = [...lines];
    newLines.splice(index, 1);
    setLines(newLines);
  };

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    return { totalDebit, totalCredit, diff: totalDebit - totalCredit };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { totalDebit, totalCredit, diff } = calculateTotals();
    
    if (Math.abs(diff) > 0.01) {
      toast.error(`Partidas dobradas inválidas. Diferença: ${diff.toFixed(2)}`);
      return;
    }

    if (totalDebit === 0) {
      toast.error("O valor do lançamento não pode ser zero.");
      return;
    }

    // Validar contas preenchidas
    if (lines.some(l => !l.account_id)) {
      toast.error("Selecione a conta para todas as linhas.");
      return;
    }

    createPostingMutation.mutate({
      posting_date: postingDate,
      description,
      lines: lines.map(l => ({
        account_id: Number(l.account_id),
        debit_amount: Math.round(Number(l.debit) * 100), // Converter para centavos
        credit_amount: Math.round(Number(l.credit) * 100),
        description: l.desc || undefined
      }))
    });
  };

  // Filtrar apenas contas analíticas para lançamento
  const analyticalAccounts = accounts.filter(acc => acc.is_analytical);

  const { totalDebit, totalCredit } = calculateTotals();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lançamentos Contábeis"
        description="Registre e visualize os lançamentos diários."
        icon={FileText}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Novo Lançamento Contábil</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={postingDate}
                      onChange={(e) => setPostingDate(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="desc">Histórico Padrão</Label>
                    <div className="flex gap-2">
                      <Input
                        id="desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Pagamento de fornecedor ref. NF 123"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => {
                          if (!description) {
                            toast.error("Preencha o histórico para a IA analisar.");
                            return;
                          }
                          suggestMutation.mutate({ description });
                        }}
                        disabled={suggestMutation.isPending}
                        title="Preencher com IA"
                      >
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="grid grid-cols-12 gap-2 mb-2 font-medium text-sm text-muted-foreground">
                    <div className="col-span-4">Conta</div>
                    <div className="col-span-3">Histórico (Opcional)</div>
                    <div className="col-span-2 text-right">Débito</div>
                    <div className="col-span-2 text-right">Crédito</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                      <div className="col-span-4">
                        <Select
                          value={line.account_id}
                          onValueChange={(val) => updateLine(index, "account_id", val)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {analyticalAccounts.map(acc => (
                              <SelectItem key={acc.id} value={String(acc.id)}>
                                {acc.account_code} - {acc.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          className="h-8"
                          value={line.desc}
                          onChange={(e) => updateLine(index, "desc", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => {
                            updateLine(index, "debit", e.target.value);
                            if (Number(e.target.value) > 0) updateLine(index, "credit", "0");
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => {
                            updateLine(index, "credit", e.target.value);
                            if (Number(e.target.value) > 0) updateLine(index, "debit", "0");
                          }}
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeLine(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" size="sm" onClick={addLine} className="mt-2">
                    <Plus className="mr-2 h-3 w-3" /> Adicionar Linha
                  </Button>
                </div>

                <div className="flex justify-between items-center p-4 bg-muted rounded-md">
                  <div className="text-sm font-medium">Totais</div>
                  <div className="flex gap-8">
                    <div className="text-sm">
                      Débito: <span className="font-bold">{totalDebit.toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      Crédito: <span className="font-bold">{totalCredit.toFixed(2)}</span>
                    </div>
                    <div className={`text-sm ${Math.abs(totalDebit - totalCredit) > 0.01 ? "text-red-500 font-bold" : "text-green-600"}`}>
                      Diferença: {(totalDebit - totalCredit).toFixed(2)}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createPostingMutation.isPending}>
                    {createPostingMutation.isPending ? "Lançando..." : "Confirmar Lançamento"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Últimos Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : postings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum lançamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                postings.map((posting) => (
                  <TableRow key={posting.id}>
                    <TableCell>{format(new Date(posting.posting_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-mono">{posting.posting_number}</TableCell>
                    <TableCell>{posting.description}</TableCell>
                    <TableCell className="capitalize">{posting.reference_type}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {posting.status}
                      </span>
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
