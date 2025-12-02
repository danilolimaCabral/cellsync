import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Package, TruckIcon, Clock, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CalculadoraFrete() {
  const [formData, setFormData] = useState({
    fromPostalCode: "",
    toPostalCode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const [quotes, setQuotes] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateMutation = trpc.shipping.calculateQuotes.useMutation();
  const { data: apisStatus } = trpc.shipping.checkApisStatus.useQuery();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    // Validar campos
    if (!formData.fromPostalCode || !formData.toPostalCode || !formData.weight || !formData.length || !formData.width || !formData.height) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setIsCalculating(true);
    try {
      const result = await calculateMutation.mutateAsync({
        fromPostalCode: formData.fromPostalCode.replace(/\D/g, ""),
        toPostalCode: formData.toPostalCode.replace(/\D/g, ""),
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
      });

      setQuotes(result);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      alert("Erro ao calcular frete. Tente novamente.");
    } finally {
      setIsCalculating(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDeliveryTime = (days: number) => {
    if (days === 0) return "Não disponível";
    if (days === 1) return "1 dia útil";
    return `${days} dias úteis`;
  };

  const getCheapestQuote = () => {
    const validQuotes = quotes.filter(q => !q.error && q.price > 0);
    if (validQuotes.length === 0) return null;
    return validQuotes.reduce((cheapest, current) => 
      current.price < cheapest.price ? current : cheapest
    );
  };

  const getFastestQuote = () => {
    const validQuotes = quotes.filter(q => !q.error && q.deliveryTime > 0);
    if (validQuotes.length === 0) return null;
    return validQuotes.reduce((fastest, current) => 
      current.deliveryTime < fastest.deliveryTime ? current : fastest
    );
  };

  const cheapest = getCheapestQuote();
  const fastest = getFastestQuote();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calculadora de Frete</h1>
        <p className="text-muted-foreground">Compare preços e prazos de múltiplas transportadoras</p>
      </div>

      {/* Status das APIs */}
      {apisStatus && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex gap-4">
              <span>
                <strong>Correios:</strong> {apisStatus.correios ? "✅ Configurado" : "❌ Não configurado"}
              </span>
              <span>
                <strong>Melhor Envio:</strong> {apisStatus.melhorEnvio ? "✅ Configurado" : "❌ Não configurado"}
              </span>
            </div>
            {!apisStatus.anyConfigured && (
              <p className="mt-2 text-sm text-destructive">
                Configure pelo menos uma API de frete nas variáveis de ambiente para obter cotações reais.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Formulário de Cálculo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dados do Pacote
          </CardTitle>
          <CardDescription>Preencha as informações para calcular o frete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CEP Origem */}
            <div className="space-y-2">
              <Label htmlFor="fromPostalCode">CEP Origem *</Label>
              <Input
                id="fromPostalCode"
                placeholder="00000-000"
                value={formData.fromPostalCode}
                onChange={(e) => handleInputChange("fromPostalCode", e.target.value)}
                maxLength={9}
              />
            </div>

            {/* CEP Destino */}
            <div className="space-y-2">
              <Label htmlFor="toPostalCode">CEP Destino *</Label>
              <Input
                id="toPostalCode"
                placeholder="00000-000"
                value={formData.toPostalCode}
                onChange={(e) => handleInputChange("toPostalCode", e.target.value)}
                maxLength={9}
              />
            </div>

            {/* Peso */}
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (gramas) *</Label>
              <Input
                id="weight"
                type="number"
                placeholder="1000"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                min="1"
              />
            </div>

            {/* Comprimento */}
            <div className="space-y-2">
              <Label htmlFor="length">Comprimento (cm) *</Label>
              <Input
                id="length"
                type="number"
                placeholder="30"
                value={formData.length}
                onChange={(e) => handleInputChange("length", e.target.value)}
                min="1"
              />
            </div>

            {/* Largura */}
            <div className="space-y-2">
              <Label htmlFor="width">Largura (cm) *</Label>
              <Input
                id="width"
                type="number"
                placeholder="20"
                value={formData.width}
                onChange={(e) => handleInputChange("width", e.target.value)}
                min="1"
              />
            </div>

            {/* Altura */}
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm) *</Label>
              <Input
                id="height"
                type="number"
                placeholder="10"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                min="1"
              />
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            disabled={isCalculating}
            className="w-full"
            size="lg"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <TruckIcon className="mr-2 h-4 w-4" />
                Calcular Frete
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {quotes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Cotações Disponíveis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotes.map((quote, index) => {
              const isCheapest = cheapest && quote.id === cheapest.id;
              const isFastest = fastest && quote.id === fastest.id;
              const hasError = !!quote.error;

              return (
                <Card key={index} className={hasError ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{quote.carrier}</CardTitle>
                        <CardDescription>{quote.service}</CardDescription>
                      </div>
                      {quote.logo && (
                        <img src={quote.logo} alt={quote.carrier} className="h-8 w-8 object-contain" />
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {isCheapest && (
                        <Badge variant="default" className="bg-green-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Mais Barato
                        </Badge>
                      )}
                      {isFastest && (
                        <Badge variant="default" className="bg-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Mais Rápido
                        </Badge>
                      )}
                      {quote.source === "correios" && (
                        <Badge variant="outline">Correios</Badge>
                      )}
                      {quote.source === "melhor_envio" && (
                        <Badge variant="outline">Melhor Envio</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{quote.error}</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Preço:</span>
                          <span className="text-2xl font-bold">{formatPrice(quote.price)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Prazo:</span>
                          <span className="font-medium">{formatDeliveryTime(quote.deliveryTime)}</span>
                        </div>
                        <Button variant="outline" className="w-full" size="sm">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Selecionar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Instruções */}
      {quotes.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Como usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>1. Preencha o CEP de origem e destino</p>
            <p>2. Informe o peso em gramas (ex: 1000g = 1kg)</p>
            <p>3. Informe as dimensões do pacote em centímetros</p>
            <p>4. Clique em "Calcular Frete" para ver as opções disponíveis</p>
            <p className="text-sm text-muted-foreground mt-4">
              💡 O sistema compara automaticamente preços dos Correios e outras transportadoras via Melhor Envio
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
