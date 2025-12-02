import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Package, MapPin, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RastreamentoEnvios() {
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);

  const trackMutation = trpc.shipping.trackShipment.useQuery(
    { trackingCode },
    { enabled: false }
  );

  const { data: shipments, isLoading: isLoadingShipments } = trpc.shipping.listShipments.useQuery({
    limit: 20,
  });

  const handleTrack = async () => {
    if (!trackingCode.trim()) {
      alert("Digite um código de rastreamento");
      return;
    }

    setIsTracking(true);
    try {
      const result = await trackMutation.refetch();
      setTrackingResult(result.data);
    } catch (error) {
      console.error("Erro ao rastrear:", error);
      alert("Erro ao rastrear encomenda. Tente novamente.");
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      posted: { label: "Postado", variant: "default" },
      in_transit: { label: "Em Trânsito", variant: "default" },
      out_delivery: { label: "Saiu para Entrega", variant: "default" },
      delivered: { label: "Entregue", variant: "default" },
      failed: { label: "Falha na Entrega", variant: "destructive" },
      returned: { label: "Devolvido", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rastreamento de Envios</h1>
        <p className="text-muted-foreground">Acompanhe suas encomendas em tempo real</p>
      </div>

      {/* Busca por Código de Rastreamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Rastrear Encomenda
          </CardTitle>
          <CardDescription>Digite o código de rastreamento para ver o status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="trackingCode">Código de Rastreamento</Label>
              <Input
                id="trackingCode"
                placeholder="Ex: AA123456789BR"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
              />
            </div>
          </div>
          <Button onClick={handleTrack} disabled={isTracking} className="w-full">
            {isTracking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rastreando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Rastrear
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do Rastreamento */}
      {trackingResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Rastreamento</CardTitle>
            <CardDescription>Código: {trackingCode}</CardDescription>
          </CardHeader>
          <CardContent>
            {trackingResult.source === "correios" && trackingResult.events && (
              <div className="space-y-4">
                {trackingResult.events.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum evento encontrado para este código de rastreamento.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {trackingResult.events.map((event: any, index: number) => (
                      <div key={index} className="flex gap-4 border-l-2 border-primary pl-4 py-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {event.data} às {event.hora}
                            </span>
                          </div>
                          <p className="font-semibold">{event.status}</p>
                          {event.local && (
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{event.local}</span>
                            </div>
                          )}
                          {(event.origem || event.destino) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.origem && `De: ${event.origem}`}
                              {event.origem && event.destino && " → "}
                              {event.destino && `Para: ${event.destino}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {trackingResult.source === "melhor_envio" && trackingResult.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <p className="font-medium">{trackingResult.data.status}</p>
                  </div>
                  <div>
                    <Label>Protocolo</Label>
                    <p className="font-medium">{trackingResult.data.protocol}</p>
                  </div>
                </div>
              </div>
            )}

            {trackingResult.source === "none" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{trackingResult.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Envios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Envios Recentes
          </CardTitle>
          <CardDescription>Últimos 20 envios cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingShipments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : shipments && shipments.length > 0 ? (
            <div className="space-y-3">
              {shipments.map((shipment: any) => (
                <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{shipment.trackingCode}</span>
                      {getStatusBadge(shipment.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>De: {shipment.fromName} ({shipment.fromPostalCode})</p>
                      <p>Para: {shipment.toName} ({shipment.toPostalCode})</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{shipment.carrier}</span>
                      {shipment.service && <span>• {shipment.service}</span>}
                      <span>• {format(new Date(shipment.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTrackingCode(shipment.trackingCode);
                      handleTrack();
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Rastrear
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Nenhum envio cadastrado ainda.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
