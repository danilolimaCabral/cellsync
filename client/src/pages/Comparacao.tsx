import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Sparkles, Zap, TrendingUp, Users } from "lucide-react";
import { useLocation } from "wouter";

interface Feature {
  name: string;
  cellsync: boolean | string;
  okcell: boolean | string;
  highlight?: boolean;
}

const features: Feature[] = [
  // Funcionalidades Básicas
  { name: "PDV (Ponto de Venda)", cellsync: true, okcell: true },
  { name: "Controle de Estoque", cellsync: true, okcell: true },
  { name: "Gestão de Clientes (CRM)", cellsync: true, okcell: true },
  { name: "Ordem de Serviço (OS)", cellsync: true, okcell: true },
  { name: "Financeiro Completo", cellsync: true, okcell: true },
  
  // Diferenciais CellSync
  { name: "Assistente IA em Todos os Módulos", cellsync: true, okcell: false, highlight: true },
  { name: "Análise de Imagens com IA", cellsync: true, okcell: false, highlight: true },
  { name: "Preenchimento Automático de Dados", cellsync: true, okcell: false, highlight: true },
  { name: "Rastreamento por IMEI", cellsync: true, okcell: "Limitado" },
  { name: "Sistema Atacado/Varejo Integrado", cellsync: true, okcell: false, highlight: true },
  { name: "Emissão de NF-e Automática", cellsync: true, okcell: "Pago à parte" },
  { name: "Importação Inteligente de Planilhas", cellsync: true, okcell: "Manual" },
  { name: "Geração de Etiquetas e QR Codes", cellsync: true, okcell: false },
  { name: "Relatórios Avançados com BI", cellsync: true, okcell: "Básico" },
  { name: "Sistema de Comissões Automático", cellsync: true, okcell: false, highlight: true },
  { name: "Multi-tenant (Várias Lojas)", cellsync: true, okcell: false, highlight: true },
  { name: "Notificações Inteligentes", cellsync: true, okcell: "Básico" },
  { name: "Suporte a Múltiplos Usuários", cellsync: "Ilimitado", okcell: "Limitado por plano" },
  { name: "Backup Automático em Nuvem", cellsync: true, okcell: "Pago à parte" },
  { name: "Atualizações Automáticas", cellsync: true, okcell: "Manual" },
  { name: "Suporte Técnico", cellsync: "24/7", okcell: "Horário comercial" },
  { name: "Onboarding Guiado", cellsync: true, okcell: false },
  { name: "API Aberta para Integrações", cellsync: true, okcell: false, highlight: true },
];

const differentials = [
  {
    icon: <Sparkles className="h-8 w-8 text-purple-600" />,
    title: "IA Integrada em Todos os Módulos",
    description: "Assistentes inteligentes que ajudam no cadastro de produtos, clientes, análise de documentos e muito mais. Economize até 70% do tempo em tarefas repetitivas.",
  },
  {
    icon: <Zap className="h-8 w-8 text-blue-600" />,
    title: "Análise de Imagens Automática",
    description: "Tire uma foto do produto, documento ou nota fiscal e a IA extrai automaticamente todas as informações. Sem digitação manual!",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-green-600" />,
    title: "Sistema Atacado/Varejo Unificado",
    description: "Gerencie preços diferenciados para atacado e varejo no mesmo sistema. Cálculo automático de descontos e margem de lucro.",
  },
  {
    icon: <Users className="h-8 w-8 text-orange-600" />,
    title: "Multi-tenant Nativo",
    description: "Gerencie múltiplas lojas ou franquias em um único sistema. Relatórios consolidados e gestão centralizada.",
  },
];

export default function Comparacao() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CellSync
            </span>
          </div>
          <Button onClick={() => setLocation("/planos")}>
            Começar Agora
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            CellSync
          </span>
          {" vs "}
          <span className="text-slate-600 dark:text-slate-400">OKCell</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
          Descubra por que <strong>mais de 500 lojas</strong> estão migrando do OKCell para o CellSync.
          Compare funcionalidades, preços e diferenciais lado a lado.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => setLocation("/planos")}>
            Experimentar CellSync Grátis
          </Button>
          <Button size="lg" variant="outline" onClick={() => setLocation("/onboarding")}>
            Agendar Demonstração
          </Button>
        </div>
      </section>

      {/* Tabela Comparativa */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comparação Completa de Funcionalidades
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Veja lado a lado o que cada sistema oferece
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-800">
                  <th className="text-left p-4 font-semibold">Funcionalidade</th>
                  <th className="text-center p-4 font-semibold">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        CellSync
                      </span>
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold text-slate-600 dark:text-slate-400">
                    OKCell
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      feature.highlight ? "bg-purple-50/50 dark:bg-purple-950/20" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {feature.name}
                        {feature.highlight && (
                          <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-0.5 rounded-full">
                            Exclusivo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.cellsync === "boolean" ? (
                        feature.cellsync ? (
                          <div className="flex justify-center">
                            <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {feature.cellsync}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.okcell === "boolean" ? (
                        feature.okcell ? (
                          <div className="flex justify-center">
                            <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {feature.okcell}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Diferenciais */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que CellSync é Superior?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Tecnologia de ponta que transforma sua operação
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {differentials.map((diff, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4">{diff.icon}</div>
                <h3 className="text-xl font-bold mb-2">{diff.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{diff.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Preços Transparentes
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Sem taxas ocultas, sem surpresas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* CellSync */}
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">CellSync</h3>
                <div className="text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    R$ 197
                  </span>
                  <span className="text-lg text-slate-600 dark:text-slate-400">/mês</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Teste grátis por 14 dias
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Usuários ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Todas as funcionalidades</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>IA inclusa (sem custo extra)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>NF-e inclusa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Backup automático</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Suporte 24/7</span>
                </li>
              </ul>
              <Button className="w-full" size="lg" onClick={() => setLocation("/planos")}>
                Começar Agora
              </Button>
            </CardContent>
          </Card>

          {/* OKCell */}
          <Card className="opacity-75">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">OK</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-600 dark:text-slate-400">OKCell</h3>
                <div className="text-4xl font-bold mb-2 text-slate-600 dark:text-slate-400">
                  R$ 149
                  <span className="text-lg">/mês</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Plano básico
                </p>
              </div>
              <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span>Até 5 usuários</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span>Funcionalidades básicas</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  <span>Sem IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sm">+ R$ 99/mês para NF-e</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sm">+ R$ 49/mês para backup</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sm">Suporte comercial</span>
                </li>
              </ul>
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                <strong>Total real:</strong> ~R$ 297/mês
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            💰 Economize R$ 100/mês com CellSync e tenha mais funcionalidades!
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0">
          <CardContent className="p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para Transformar sua Loja?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de lojas que já migraram e estão economizando tempo e dinheiro com CellSync
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => setLocation("/planos")}>
                Começar Teste Grátis
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" onClick={() => setLocation("/onboarding")}>
                Falar com Especialista
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>© 2024 CellSync. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
