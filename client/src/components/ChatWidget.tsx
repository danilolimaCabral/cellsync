import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou a CellIA 🤖. Como posso ajudar sua assistência técnica hoje?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();

  // Mutations
  const publicChatMutation = trpc.chatbot.publicChat.useMutation();
  const authChatMutation = trpc.chatbot.authenticatedChat.useMutation();

  const isLoading = publicChatMutation.isPending || authChatMutation.isPending;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    try {
      let response;
      
      if (user) {
        response = await authChatMutation.mutateAsync({
          messages: [...messages, userMessage],
          context: window.location.pathname
        });
      } else {
        response = await publicChatMutation.mutateAsync({
          messages: [...messages, userMessage]
        });
      }

      if (response.success && response.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: response.message! }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: response.message || "Desculpe, tive um erro ao processar sua mensagem." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Ops! Algo deu errado. Tente novamente." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <Card className="w-[350px] h-[500px] mb-4 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col">
          <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </div>
              <div>
                <CardTitle className="text-base">CellIA Assistente</CardTitle>
                <p className="text-xs text-primary-foreground/80">Online agora</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden relative bg-slate-50 dark:bg-slate-900">
            <div 
              ref={scrollRef} 
              className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Digitando...</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-3 bg-white dark:bg-slate-950 border-t">
            <form 
              onSubmit={handleSendMessage}
              className="flex w-full items-center gap-2"
            >
              <Input
                ref={inputRef}
                placeholder="Digite sua dúvida..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 focus-visible:ring-1"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  "transition-all duration-200",
                  inputValue.trim() ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-110",
          isOpen ? "bg-slate-500 hover:bg-slate-600" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-7 w-7" />
        )}
      </Button>
    </div>
  );
}
