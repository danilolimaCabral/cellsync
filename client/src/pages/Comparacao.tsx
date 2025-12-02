import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Sparkles, Zap, TrendingUp, Clock, DollarSign, Users } from "lucide-react";
import { useLocation } from "wouter";

interface Feature {
  name: string;
  cellsync: boolean | string;
  okcell: boolean | string;
  highlight?: boolean;
}

// Foco apenas em recursos relacionados a IA e Automação
const features: Feature[] = [
  // Assistentes IA
  { name: "Assistente IA para Cadastro de Produtos", cellsync: true, okcell: false, highlight: true },
  { name: "Assistente IA para Cadastro de Clientes", cellsync: true, okcell: false, highlight: true },
  { name: "Análise de Imagens com IA (Produtos)", cellsync: true, okcell: false, highlight: true },
  { name: "Análise de Documentos com IA (RG, CNH, CPF)", cellsync: true, okcell: false, highlight: true },
  { name: "Análise de Notas Fiscais com IA", cellsync: true, okcell: false, highlight: true },
  { name: "Preenchimento Automático de Dados", cellsync: true, okcell: false, highlight: true },
  { name: "Sugestão Inteligente de Preços", cellsync: true, okcell: false, highlight: true },
  { name: "Validação Automática de CPF/CNPJ", cellsync: true, okcell: "Manual", highlight: true },
  { name: "Busca Automática de CEP", cellsync: true, okcell: "Manual" },
  { name: "Importação Inteligente de Planilhas", cellsync: true, okcell: "Manual" },
  { name: "Chat Contextual com IA", cellsync: true, okcell: false, highlight: true },
  { name: "Sugestões de Segmentação de Clientes", cellsync: true, okcell: false },
  
  // Automações
  { name: "Emissão Automática de NF-e", cellsync: true, okcell: "Pago à parte" },
  { name: "Cálculo Automático de Comissões", cellsync: true, okcell: "Manual" },
  { name: "Baixa Automática de Estoque", cellsync: true, okcell: true },
  { name: "Notificações Inteligentes", cellsync: true, okcell: "Básico" },
  { name: "Backup Automático em Nuvem", cellsync: true, okcell: "Pago à parte" },
  { name: "Atualizações Automáticas", cellsync: true, okcell: "Manual" },
];

const differentials = [
  {
    icon: <Sparkles className="h-8 w-8 text-purple-600" />,
    title: "IA Integrada em Todos os Módulos",
    description: "Assistentes inteligentes que ajudam no cadastro de produtos, clientes, análise de documentos e muito mais. Economize até 70% do tempo em tarefas repetitivas.",
    savings: "Economia de 15-20 horas/semana",
  },
  {
    icon: <Zap className="h-8 w-8 text-blue-600" />,
    title: "Análise de Imagens Automática",
    description: "Tire uma foto do produto, documento ou nota fiscal e a IA extrai automaticamente todas as informações. Sem digitação manual!",
    savings: "5 segundos vs 3 minutos por cadastro",
  },
  {
    icon: <Clock className="h-8 w-8 text-green-600" />,
    title: "Preenchimento Instantâneo",
    description: "A IA preenche automaticamente marca, modelo, categoria, preços sugeridos e muito mais. Você só confirma ou ajusta.",
    savings: "95% menos digitação",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
    title: "Aprendizado Contínuo",
    description: "Quanto mais você usa, mais inteligente o sistema fica. A IA aprende com seus padrões e melhora as sugestões.",
    savings: "Precisão aumenta 20% a cada mês",
  },
];

const useCases = [
  {
    title: "Cadastro de Produto com Foto",
    cellsync: "5 segundos (foto + IA)",
    okcell: "3 minutos (digitação manual)",
    icon: "📸",
  },
  {
    title: "Cadastro de Cliente com Documento",
    cellsync: "10 segundos (foto do RG + IA)",
    okcell: "5 minutos (digitação manual)",
    icon: "🆔",
  },
  {
    title: "Importação de 100 Produtos",
    cellsync: "2 minutos (planilha + IA)",
    okcell: "2 horas (digitação manual)",
    icon: "📊",
  },
  {
    title: "Análise de Nota Fiscal",
    cellsync: "15 segundos (foto + IA)",
    okcell: "10 minutos (digitação manual)",
    icon: "📄",
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
        <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full mb-6">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Tecnologia de Inteligência Artificial
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            CellSync com IA
          </span>
          {" vs "}
          <span className="text-slate-600 dark:text-slate-400">OKCell Tradicional</span>
        </h1>
        
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-4">
          O CellSync é o <strong>único sistema do mercado</strong> com Assistentes de IA integrados em todos os módulos.
          Economize até <strong className="text-green-600">70% do tempo</strong> em tarefas repetitivas.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
          <Clock className="h-4 w-4" />
          <span>Cadastro de produtos em <strong>5 segundos</strong> vs 3 minutos no OKCell</span>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => setLocation("/planos")}>
            <Sparkles className="h-4 w-4 mr-2" />
            Experimentar IA Grátis
          </Button>
          <Button size="lg" variant="outline" onClick={() => setLocation("/onboarding")}>
            Ver Demonstração
          </Button>
        </div>
      </section>

      {/* Casos de Uso Práticos */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Economia de Tempo Real
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Compare o tempo gasto em tarefas comuns do dia a dia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="font-bold mb-4 text-lg">{useCase.title}</h3>
                
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                      CellSync com IA
                    </div>
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                      {useCase.cellsync}
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                      OKCell Tradicional
                    </div>
                    <div className="text-lg font-bold text-red-700 dark:text-red-300">
                      {useCase.okcell}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tabela Comparativa */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Recursos de IA e Automação
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
            Como a IA do CellSync Funciona?
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
                <p className="text-slate-600 dark:text-slate-400 mb-4">{diff.description}</p>
                <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg inline-block">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    💰 {diff.savings}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ROI */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Retorno Sobre Investimento (ROI)
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Com a economia de tempo proporcionada pela IA, o CellSync se paga em menos de 1 mês
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">15-20h</div>
                <div className="text-sm opacity-90">Horas economizadas por semana</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">70%</div>
                <div className="text-sm opacity-90">Redução em tarefas repetitivas</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-sm opacity-90">Menos digitação manual</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Pronto para Experimentar a Diferença?
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
          Teste o CellSync gratuitamente por 14 dias e veja como a IA pode transformar sua loja
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => setLocation("/planos")}>
            <Sparkles className="h-5 w-5 mr-2" />
            Começar Teste Grátis
          </Button>
          <Button size="lg" variant="outline" onClick={() => setLocation("/")}>
            Voltar para Home
          </Button>
        </div>
      </section>
    </div>
  );
}
