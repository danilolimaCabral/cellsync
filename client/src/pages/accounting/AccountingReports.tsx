import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { BarChart3, Download, Filter } from "lucide-react";
import { format } from "date-fns";

export default function AccountingReports() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data: trialBalance = [], isLoading, refetch } = trpc.accounting.getTrialBalance.useQuery({
    startDate,
    endDate
  });

  const handleFilter = () => {
    refetch();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios Contábeis"
        description="Visualize o balancete e outros demonstrativos."
        icon={BarChart3}
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            <Button onClick={handleFilter}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Saldo Anterior</TableHead>
                  <TableHead className="text-right">Débitos</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead className="text-right">Saldo Atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : trialBalance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum dado encontrado para o período.
                    </TableCell>
                  </TableRow>
                ) : (
                  trialBalance.map((account: any) => (
                    <TableRow key={account.id} className={!account.is_analytical ? "font-bold bg-muted/30" : ""}>
                      <TableCell>{account.account_code}</TableCell>
                      <TableCell>
                        <span style={{ paddingLeft: `${(account.account_code.split('.').length - 1) * 12}px` }}>
                          {account.account_name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(account.initial_balance || 0)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(account.debits || 0)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(account.credits || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(account.final_balance || 0)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
