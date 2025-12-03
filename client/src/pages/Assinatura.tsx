import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';


export default function Assinatura() {
  const [, setLocation] = useLocation();
  
  const { data: subscription, isLoading } = trpc.plans.mySubscription.useQuery();
  const createPortal = trpc.plans.createBillingPortal.useMutation({
    onSuccess: (data) => {
      // Redirecionar para o portal do Stripe
      window.location.href = data.portalUrl;
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  // Verificar se há session_id na URL (retorno do checkout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId) {
      // Limpar URL
      window.history.replaceState({}, '', '/assinatura');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription || !subscription.plan) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Assinatura Ativa</CardTitle>
            <CardDescription>
              Você ainda não possui uma assinatura ativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/planos')}>
              Ver Planos Disponíveis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tenant, plan } = subscription;

  // Status badge
  const getStatusBadge = () => {
    switch (tenant.status) {
      case 'active':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'trial':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Período de Teste
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspenso
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  // Formatar preço
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  return (
    <div className="container max-w-4xl py-12 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minha Assinatura</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie sua assinatura e informações de pagamento
        </p>
      </div>

      {/* Status da Assinatura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plano {plan.name}</CardTitle>
              <CardDescription className="mt-1">
                {plan.description}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Plano */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>Valor Mensal</span>
              </div>
              <p className="text-2xl font-bold">
                {formatPrice(plan.priceMonthly)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>

            {plan.priceYearly && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Valor Anual</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatPrice(plan.priceYearly)}
                  <span className="text-sm font-normal text-muted-foreground">/ano</span>
                </p>
                <p className="text-xs text-green-600">
                  Economize {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%
                </p>
              </div>
            )}
          </div>

          {/* Recursos do Plano */}
          <div>
            <h3 className="font-semibold mb-3">Recursos Incluídos</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Até {plan.maxUsers} usuários</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Até {plan.maxProducts.toLocaleString('pt-BR')} produtos</span>
              </div>
              {plan.features && plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="capitalize">{feature.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trial Info */}
          {tenant.status === 'trial' && tenant.trialEndsAt && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Período de Teste
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Seu período de teste termina em{' '}
                    {new Date(tenant.trialEndsAt).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t">
            {tenant.stripeCustomerId && (
              <Button
                onClick={() => createPortal.mutate()}
                disabled={createPortal.isPending}
              >
                {createPortal.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <CreditCard className="w-4 h-4 mr-2" />
                Gerenciar Pagamento
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setLocation('/planos')}
            >
              Mudar de Plano
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome da Empresa:</span>
              <span className="font-medium">{tenant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID do Tenant:</span>
              <span className="font-mono text-xs">{tenant.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
