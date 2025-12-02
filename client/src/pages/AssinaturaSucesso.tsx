import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  Mail,
  Calendar,
  CreditCard,
  Zap,
} from "lucide-react";

export default function AssinaturaSucesso() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Pegar session_id da URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    setSessionId(sid);

    // Confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Simular confetti (pode adicionar biblioteca real se desejar)
      console.log("🎉 Confetti!", particleCount);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const nextSteps = [
    {
      icon: Zap,
      title: "Acesse o Dashboard",
      description: "Explore todas as funcionalidades do sistema",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Calendar,
      title: "Configure sua Loja",
      description: "Adicione produtos, clientes e configure as preferências",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Mail,
      title: "Verifique seu Email",
      description: "Enviamos um guia completo para começar",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Animação de Sucesso */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-50"
            />
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-8 shadow-2xl">
              <CheckCircle className="h-24 w-24 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </motion.div>

        {/* Título Principal */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            🎉 Assinatura Confirmada!
          </h1>
          <p className="text-xl text-gray-600">
            Bem-vindo ao <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">CellSync</span>
          </p>
        </motion.div>

        {/* Card de Informações */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mb-8 border-2 border-green-200 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Pagamento Processado com Sucesso
                  </h3>
                  <p className="text-gray-600">
                    Sua assinatura foi ativada e você já pode começar a usar todas as funcionalidades do sistema.
                  </p>
                  {sessionId && (
                    <p className="text-xs text-gray-400 mt-2">
                      ID da Sessão: {sessionId.substring(0, 20)}...
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-semibold">Confirmação Enviada</span>
                </div>
                <p className="text-sm text-blue-600">
                  Enviamos um email com os detalhes da sua assinatura e um guia de primeiros passos.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximos Passos */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Próximos Passos
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {nextSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`${step.bgColor} rounded-lg p-3 w-fit mb-4`}>
                      <step.icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Botões de Ação */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            onClick={() => setLocation("/dashboard")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg group"
          >
            <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
            Acessar Dashboard
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/configuracoes")}
            className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-6 text-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Configurar Loja
          </Button>
        </motion.div>

        {/* Informação Adicional */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500">
            Precisa de ajuda? Entre em contato com nosso{" "}
            <button
              onClick={() => setLocation("/meus-chamados")}
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              suporte técnico
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
