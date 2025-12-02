import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertCircle, Loader2, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function ImportarPlanilha() {
  const [activeTab, setActiveTab] = useState<'products' | 'customers'>('products');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const previewMutation = trpc.csvImport.previewCSV.useMutation();
  const importProductsMutation = trpc.csvImport.importProducts.useMutation();
  const importCustomersMutation = trpc.csvImport.importCustomers.useMutation();

  // Ler conteúdo do arquivo
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  };

  // Handle file input
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'txt'].includes(extension || '')) {
      toast.error('Selecione apenas arquivos CSV');
      return;
    }

    setFile(selectedFile);
    setPreviewData(null);
  };

  // Preview do arquivo
  const handlePreview = async () => {
    if (!file) return;

    try {
      const content = await readFileContent(file);
      const result = await previewMutation.mutateAsync({
        csvContent: content,
        type: activeTab,
      });

      setPreviewData(result);
      toast.success('Preview carregado com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar CSV');
    }
  };

  // Importar dados
  const handleImport = async () => {
    if (!file || !previewData) return;

    setIsImporting(true);

    try {
      const content = await readFileContent(file);

      if (activeTab === 'products') {
        const result = await importProductsMutation.mutateAsync({
          csvContent: content,
          updateExisting,
        });

        toast.success(result.message);
        setPreviewData(null);
        setFile(null);
      } else {
        const result = await importCustomersMutation.mutateAsync({
          csvContent: content,
          updateExisting,
        });

        toast.success(result.message);
        setPreviewData(null);
        setFile(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar dados');
    } finally {
      setIsImporting(false);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const filename = activeTab === 'products' ? 'produtos-template.csv' : 'clientes-template.csv';
    const link = document.createElement('a');
    link.href = `/templates/${filename}`;
    link.download = filename;
    link.click();
    toast.success('Template baixado com sucesso');
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Planilhas (CSV/Excel)</h1>
        <p className="text-muted-foreground mt-2">
          Importe produtos e clientes em massa usando planilhas CSV ou Excel
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Template de Produtos</h3>
                  <p className="text-sm text-muted-foreground">
                    Baixe o template e preencha com seus dados
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Campos obrigatórios:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>nome:</strong> Nome do produto</li>
                  <li>• <strong>preco_custo:</strong> Preço de custo (ex: 100.50)</li>
                  <li>• <strong>preco_venda:</strong> Preço de venda (ex: 199.90)</li>
                </ul>
                <p className="text-sm font-medium mt-3 mb-2">Campos opcionais:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• sku, codigo_barras, categoria, marca, modelo</li>
                  <li>• estoque_minimo, estoque_atual, requer_imei (sim/não)</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Template de Clientes</h3>
                  <p className="text-sm text-muted-foreground">
                    Baixe o template e preencha com seus dados
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Campo obrigatório:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>nome:</strong> Nome completo ou razão social</li>
                </ul>
                <p className="text-sm font-medium mt-3 mb-2">Campos opcionais:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• cpf_cnpj, email, telefone</li>
                  <li>• endereco, cidade, estado, cep</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Área de Upload */}
      <Card className="p-8">
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              Selecione seu arquivo CSV
            </h3>
            <p className="text-muted-foreground mb-4">
              Arquivos suportados: .csv, .txt
            </p>
            <label htmlFor="csv-input">
              <Button type="button" onClick={() => document.getElementById('csv-input')?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </label>
            <input
              id="csv-input"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={previewMutation.isPending}
                >
                  {previewMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Visualizar Preview'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreviewData(null);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Opções */}
          {previewData && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-existing"
                checked={updateExisting}
                onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
              />
              <label htmlFor="update-existing" className="text-sm cursor-pointer">
                Atualizar registros existentes (por SKU para produtos, CPF/CNPJ para clientes)
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Preview dos Dados */}
      {previewData && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview dos Dados</h3>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Dados
                  </>
                )}
              </Button>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{previewData.summary.total}</p>
                    <p className="text-sm text-muted-foreground">Total de linhas</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{previewData.summary.valid}</p>
                    <p className="text-sm text-muted-foreground">Válidas ({previewData.summary.successRate}%)</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{previewData.summary.invalid}</p>
                    <p className="text-sm text-muted-foreground">Com erros</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Erros */}
            {previewData.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Erros Encontrados:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {previewData.errors.map((error: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Linha {error.line}:
                        </p>
                        <ul className="text-sm text-red-700 dark:text-red-300 mt-1 space-y-1">
                          {error.errors.map((err: string, i: number) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview da Tabela */}
            {previewData.rows.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">
                  Preview ({previewData.rows.slice(0, 10).length} de {previewData.validRows} registros válidos)
                </h4>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        {Object.keys(previewData.rows[0])
                          .filter((key) => key !== 'lineNumber' && key !== 'isValid')
                          .map((key) => (
                            <th key={key} className="text-left p-3 text-sm font-medium capitalize">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.slice(0, 10).map((row: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          {Object.entries(row)
                            .filter(([key]) => key !== 'lineNumber' && key !== 'isValid')
                            .map(([key, value], i) => (
                              <td key={i} className="p-3 text-sm">
                                {String(value || '-')}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.rows.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    ... e mais {previewData.rows.length - 10} registros
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
