import { VersionInfo } from '@/components/VersionInfo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

export default function Sobre() {
  return (
    <div className="container max-w-4xl py-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Sobre o CellSync</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Sistema completo de gestão para lojas de celulares e acessórios
        </p>
      </div>

      {/* Versão */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Versão</CardTitle>
          <CardDescription>
            Detalhes sobre a versão atual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VersionInfo />
        </CardContent>
      </Card>

      {/* Recursos */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos Principais</CardTitle>
          <CardDescription>
            Funcionalidades disponíveis no CellSync
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Gestão de Produtos</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastro e controle de estoque com suporte a IMEI
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">PDV Integrado</h3>
                <p className="text-sm text-muted-foreground">
                  Ponto de venda com múltiplas formas de pagamento
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Emissão de NF-e</h3>
                <p className="text-sm text-muted-foreground">
                  Integração com sistema de notas fiscais eletrônicas
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Relatórios e BI</h3>
                <p className="text-sm text-muted-foreground">
                  Análises detalhadas de vendas e desempenho
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Assistente IA</h3>
                <p className="text-sm text-muted-foreground">
                  Importação automática de dados com inteligência artificial
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Gestão de Clientes</h3>
                <p className="text-sm text-muted-foreground">
                  CRM integrado para melhor relacionamento
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suporte */}
      <Card>
        <CardHeader>
          <CardTitle>Suporte e Feedback</CardTitle>
          <CardDescription>
            Precisa de ajuda ou tem sugestões?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Entre em contato conosco através dos canais de suporte disponíveis na plataforma.
            Seu feedback é importante para melhorar continuamente o CellSync.
          </p>
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              CellSync © 2025. Todos os direitos reservados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
