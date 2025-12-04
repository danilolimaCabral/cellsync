import { z } from "zod";
import { adminProcedure, router } from "./trpc";
import { getDb } from "../db";
import { digitalCertificates, fiscalSettings } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const fiscalRouter = router({
  // Obter configurações fiscais
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const settings = await db.query.fiscalSettings.findFirst({
      where: eq(fiscalSettings.tenantId, ctx.user.tenantId),
      with: {
        certificate: true // Assumindo relação definida no schema relations (simulado aqui)
      }
    });

    // Se não existir, retorna default
    if (!settings) {
      return {
        environment: "homologacao",
        nextNfeNumber: 1,
        series: 1,
        simpleNational: true,
        hasCertificate: false
      };
    }

    // Buscar certificado separadamente se relation não estiver configurada
    const certificate = settings.certificateId 
      ? await db.query.digitalCertificates.findFirst({
          where: eq(digitalCertificates.id, settings.certificateId)
        })
      : null;

    return {
      ...settings,
      hasCertificate: !!certificate,
      certificateExpiration: certificate?.expirationDate,
      certificateIssuer: certificate?.issuer
    };
  }),

  // Salvar configurações fiscais
  saveSettings: adminProcedure
    .input(z.object({
      environment: z.enum(["homologacao", "producao"]),
      cscToken: z.string().optional(),
      cscId: z.string().optional(),
      nextNfeNumber: z.number().min(1),
      series: z.number().min(1),
      simpleNational: z.boolean(),
      defaultNcm: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const existing = await db.query.fiscalSettings.findFirst({
        where: eq(fiscalSettings.tenantId, ctx.user.tenantId)
      });

      if (existing) {
        await db.update(fiscalSettings)
          .set({
            ...input,
            updatedAt: new Date()
          })
          .where(eq(fiscalSettings.id, existing.id));
      } else {
        await db.insert(fiscalSettings).values({
          tenantId: ctx.user.tenantId,
          ...input,
          taxRegime: input.simpleNational ? "1" : "3",
        });
      }

      return { success: true };
    }),

  // Upload de certificado (Simulação de processamento)
  uploadCertificate: adminProcedure
    .input(z.object({
      fileName: z.string(),
      fileUrl: z.string(), // URL do S3
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Em produção: ler arquivo .pfx, validar senha e extrair dados
      // Simulação:
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1); // Validade de 1 ano

      const [result] = await db.insert(digitalCertificates).values({
        tenantId: ctx.user.tenantId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        password: input.password, // Deveria ser criptografada
        expirationDate: expirationDate,
        issuer: "Simulated CA",
        serialNumber: "SIMULATED123456",
        active: true
      });

      // Atualizar settings com o novo certificado
      const existingSettings = await db.query.fiscalSettings.findFirst({
        where: eq(fiscalSettings.tenantId, ctx.user.tenantId)
      });

      if (existingSettings) {
        await db.update(fiscalSettings)
          .set({ certificateId: Number(result.insertId) })
          .where(eq(fiscalSettings.id, existingSettings.id));
      } else {
        await db.insert(fiscalSettings).values({
          tenantId: ctx.user.tenantId,
          certificateId: Number(result.insertId),
          environment: "homologacao"
        });
      }

      return { success: true, expirationDate };
    }),
    
  // Listar certificados
  getCertificates: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return await db.select()
      .from(digitalCertificates)
      .where(eq(digitalCertificates.tenantId, ctx.user.tenantId))
      .orderBy(desc(digitalCertificates.createdAt));
  }),

  // Teste de Geração de XML (Apenas para debug)
  debugGenerateXML: adminProcedure
    .input(z.object({ saleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { nfeService } = await import("../services/nfeService");
      
      // 1. Gerar XML
      const xml = await nfeService.generateXML(input.saleId, ctx.user.tenantId);
      
      // 2. Assinar XML (Simulado com chave temporária)
      const signedXml = await nfeService.signXML(xml, ctx.user.tenantId);
      
      return { 
        success: true, 
        xml: signedXml,
        message: "XML gerado e assinado com sucesso (Chave de teste)"
      };
    })
});
