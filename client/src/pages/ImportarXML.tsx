import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface UploadedFile {
  file: File;
  content: string;
  status: 'pending' | 'previewing' | 'success' | 'error';
  error?: string;
  preview?: any;
}

export default function ImportarXML() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [createNewProducts, setCreateNewProducts] = useState(true);
  const [updatePrices, setUpdatePrices] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const previewMutation = trpc.xmlImport.previewXML.useMutation();
  const importMutation = trpc.xmlImport.importXML.useMutation();

  // Ler conteúdo do arquivo
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const xmlFiles = droppedFiles.filter((file) => file.name.endsWith('.xml'));

    if (xmlFiles.length === 0) {
      toast.error('Nenhum arquivo XML encontrado');
      return;
    }

    // Ler conteúdo dos arquivos
    const uploadedFiles: UploadedFile[] = await Promise.all(
      xmlFiles.map(async (file) => {
        try {
          const content = await readFileContent(file);
          return {
            file,
            content,
            status: 'pending' as const,
          };
        } catch (error) {
          return {
            file,
            content: '',
            status: 'error' as const,
            error: 'Erro ao ler arquivo',
          };
        }
      })
    );

    setFiles((prev) => [...prev, ...uploadedFiles]);
  }, []);

  // Handle file input
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const xmlFiles = selectedFiles.filter((file) => file.name.endsWith('.xml'));

    if (xmlFiles.length === 0) {
      toast.error('Selecione apenas arquivos XML');
      return;
    }

    const uploadedFiles: UploadedFile[] = await Promise.all(
      xmlFiles.map(async (file) => {
        try {
          const content = await readFileContent(file);
          return {
            file,
            content,
            status: 'pending' as const,
          };
        } catch (error) {
          return {
            file,
            content: '',
            status: 'error' as const,
            error: 'Erro ao ler arquivo',
          };
        }
      })
    );

    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  // Preview de um arquivo
  const handlePreview = async (index: number) => {
    const file = files[index];
    if (!file.content) return;

    try {
      const result = await previewMutation.mutateAsync({
        xmlContent: file.content,
      });

      setPreviewData(result);
      toast.success('Preview carregado com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar XML');
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error', error: error.message } : f
        )
      );
    }
  };

  // Importar todos os arquivos
  const handleImportAll = async () => {
    if (files.length === 0) {
      toast.error('Nenhum arquivo para importar');
      return;
    }

    setIsImporting(true);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.content) continue;

      try {
        const result = await importMutation.mutateAsync({
          xmlContent: file.content,
          createNewProducts,
          updatePrices,
        });

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'success', preview: result } : f
          )
        );

        successCount++;
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', error: error.message } : f
          )
        );
        errorCount++;
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} NF-e(s) importada(s) com sucesso!`);
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} erro(s) durante a importação`);
    }
  };

  // Remover arquivo
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Limpar todos
  const handleClearAll = () => {
    setFiles([]);
    setPreviewData(null);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar XML de NF-e</h1>
        <p className="text-muted-foreground mt-2">
          Importe notas fiscais de entrada para cadastrar produtos e atualizar estoque automaticamente
        </p>
      </div>

      {/* Área de Upload */}
      <Card className="p-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            Arraste arquivos XML aqui
          </h3>
          <p className="text-muted-foreground mb-4">
            ou clique no botão abaixo para selecionar
          </p>
          <label htmlFor="file-input">
            <Button type="button" onClick={() => document.getElementById('file-input')?.click()}>
              <FileText className="w-4 h-4 mr-2" />
              Selecionar Arquivos
            </Button>
          </label>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".xml"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Opções de Importação */}
        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Opções de Importação</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-new"
                checked={createNewProducts}
                onCheckedChange={(checked) => setCreateNewProducts(checked as boolean)}
              />
              <label htmlFor="create-new" className="text-sm cursor-pointer">
                Criar novos produtos automaticamente
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-prices"
                checked={updatePrices}
                onCheckedChange={(checked) => setUpdatePrices(checked as boolean)}
              />
              <label htmlFor="update-prices" className="text-sm cursor-pointer">
                Atualizar preços de produtos existentes
              </label>
            </div>
          </div>
        )}
      </Card>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Arquivos Selecionados ({files.length})
            </h3>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={isImporting}
              >
                Limpar Todos
              </Button>
              <Button
                onClick={handleImportAll}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Todos
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {file.status === 'pending' && (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                  {file.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}

                  <div className="flex-1">
                    <p className="font-medium">{file.file.name}</p>
                    {file.error && (
                      <p className="text-sm text-red-500">{file.error}</p>
                    )}
                    {file.preview && (
                      <p className="text-sm text-muted-foreground">
                        NF-e {file.preview.nfeNumber} - {file.preview.successCount} produtos importados
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {file.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(index)}
                    >
                      Preview
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isImporting}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preview dos Produtos */}
      {previewData && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Preview da NF-e</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Número</p>
                  <p className="font-semibold">{previewData.nfe.number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Série</p>
                  <p className="font-semibold">{previewData.nfe.series}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-semibold">
                    {new Date(previewData.nfe.issueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">
                    R$ {previewData.nfe.totalValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Fornecedor</h4>
              <p className="text-sm">{previewData.supplier.name}</p>
              <p className="text-sm text-muted-foreground">
                CNPJ: {previewData.supplier.cnpj}
              </p>
            </div>

            {previewData.isDuplicate && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Esta NF-e já foi importada anteriormente
                </p>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-3">
                Produtos ({previewData.summary.totalProducts})
              </h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{previewData.summary.newProducts}</p>
                      <p className="text-sm text-muted-foreground">Novos</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{previewData.summary.existingProducts}</p>
                      <p className="text-sm text-muted-foreground">Existentes</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        R$ {previewData.summary.totalValue.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Código</th>
                      <th className="text-left p-3 text-sm font-medium">Produto</th>
                      <th className="text-right p-3 text-sm font-medium">Qtd</th>
                      <th className="text-right p-3 text-sm font-medium">Preço Unit.</th>
                      <th className="text-right p-3 text-sm font-medium">Total</th>
                      <th className="text-center p-3 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.products.map((product: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3 text-sm">{product.code}</td>
                        <td className="p-3 text-sm">{product.name}</td>
                        <td className="p-3 text-sm text-right">{product.quantity}</td>
                        <td className="p-3 text-sm text-right">
                          R$ {product.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-sm text-right">
                          R$ {product.totalPrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {product.exists ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Existente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Novo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
