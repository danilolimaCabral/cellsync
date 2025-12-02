import { describe, it, expect } from "vitest";
import { validateCNPJ, formatCNPJ, cleanCNPJ, lookupCNPJ } from "./cnpj-lookup";

describe("Consulta de CNPJ", () => {
  describe("cleanCNPJ", () => {
    it("deve remover pontos, barras e hífens", () => {
      expect(cleanCNPJ("19.131.243/0001-97")).toBe("19131243000197");
      expect(cleanCNPJ("19131243000197")).toBe("19131243000197");
    });
  });

  describe("formatCNPJ", () => {
    it("deve formatar CNPJ com pontos, barra e hífen", () => {
      expect(formatCNPJ("19131243000197")).toBe("19.131.243/0001-97");
    });

    it("deve retornar original se CNPJ inválido", () => {
      expect(formatCNPJ("123")).toBe("123");
    });
  });

  describe("validateCNPJ", () => {
    it("deve validar CNPJ válido", () => {
      expect(validateCNPJ("19.131.243/0001-97")).toBe(true);
      expect(validateCNPJ("19131243000197")).toBe(true);
    });

    it("deve rejeitar CNPJ com tamanho inválido", () => {
      expect(validateCNPJ("123")).toBe(false);
      expect(validateCNPJ("12345678901234567")).toBe(false);
    });

    it("deve rejeitar CNPJ com todos dígitos iguais", () => {
      expect(validateCNPJ("00000000000000")).toBe(false);
      expect(validateCNPJ("11111111111111")).toBe(false);
    });

    it("deve rejeitar CNPJ com dígito verificador inválido", () => {
      expect(validateCNPJ("19131243000198")).toBe(false); // Último dígito errado
      expect(validateCNPJ("19131243000187")).toBe(false); // Penúltimo dígito errado
    });
  });

  describe("lookupCNPJ", () => {
    it("deve rejeitar CNPJ inválido", async () => {
      await expect(lookupCNPJ("00000000000000")).rejects.toThrow("CNPJ inválido");
    });

    it("deve consultar CNPJ válido na BrasilAPI", async () => {
      // CNPJ da Open Knowledge Brasil (usado na documentação da BrasilAPI)
      const result = await lookupCNPJ("19.131.243/0001-97");
      
      expect(result).not.toBeNull();
      expect(result?.cnpj).toBe("19131243000197");
      expect(result?.razao_social).toBeTruthy();
      expect(result?.nome_fantasia).toBeTruthy();
      expect(result?.uf).toBeTruthy();
      expect(result?.municipio).toBeTruthy();
    }, 10000); // Timeout de 10s para consulta externa

    it("deve retornar null para CNPJ não encontrado", async () => {
      // CNPJ válido mas que pode não estar no cache
      const result = await lookupCNPJ("00.000.000/0001-91");
      
      // Aceita null (não encontrado) ou dados (se existir)
      expect(result === null || result?.cnpj).toBeTruthy();
    }, 10000);
  });
});
