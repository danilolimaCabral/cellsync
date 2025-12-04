import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { fetchCnpjData, CnpjData } from "@/lib/cnpj-service";
import { toast } from "sonner";

interface InputCNPJProps {
  value: string;
  onChange: (value: string) => void;
  onDataFetched?: (data: CnpjData) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function InputCNPJ({
  value,
  onChange,
  onDataFetched,
  disabled = false,
  placeholder = "00.000.000/0000-00",
  className = "",
}: InputCNPJProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (cnpjValue?: string) => {
    const cnpjToSearch = cnpjValue || value;
    const cleanCnpj = cnpjToSearch.replace(/\D/g, "");

    if (cleanCnpj.length !== 14) {
      if (!cnpjValue) toast.error("CNPJ inválido. Digite 14 números.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchCnpjData(cleanCnpj);
      toast.success("Dados da empresa carregados!");
      if (onDataFetched) {
        onDataFetched(data);
      }
    } catch (error) {
      toast.error("Erro ao buscar CNPJ. Verifique o número.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const cleanValue = value.replace(/\D/g, "");
            if (cleanValue.length === 14) {
              handleSearch(value);
            }
          }}
          disabled={disabled || isLoading}
          className={isLoading ? "pr-10" : ""}
        />
        {/* Usar opacity em vez de renderização condicional para evitar erro de removeChild */}
        <div 
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-hidden={!isLoading}
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleSearch()}
        disabled={disabled || isLoading}
        title="Buscar dados do CNPJ"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
