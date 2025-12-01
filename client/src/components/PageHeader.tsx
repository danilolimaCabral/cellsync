import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string; // Rota específica para voltar, ou usa history.back()
  showBackButton?: boolean; // Padrão: true
}

export default function PageHeader({ 
  title, 
  description, 
  backTo,
  showBackButton = true 
}: PageHeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (backTo) {
      setLocation(backTo);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-gray-100"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
      </div>
      {description && (
        <p className={`text-sm md:text-base text-gray-500 ${showBackButton ? 'ml-12' : ''}`}>
          {description}
        </p>
      )}
    </div>
  );
}
