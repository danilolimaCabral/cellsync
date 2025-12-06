import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string; // Rota específica para voltar, ou usa history.back()
  showBackButton?: boolean; // Padrão: true
  actions?: React.ReactNode;
}

export default function PageHeader({ 
  title, 
  description, 
  backTo,
  showBackButton = true,
  actions
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
    <div className="mb-6 relative">
      <div className="flex items-center gap-3 mb-2 pr-0 md:pr-32">
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
      {actions && (
        <div className="mt-4 md:mt-0 md:absolute md:right-0 md:top-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
