import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
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
      <div className="flex-1">
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
          // Removido qualquer elemento filho ou manipulação complexa
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleSearch()}
        disabled={disabled || isLoading}
        title="Buscar dados do CNPJ"
        className="w-10 px-0" // Tamanho fixo para evitar pulo de layout
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
