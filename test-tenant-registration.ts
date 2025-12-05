import { appRouter } from './server/routers';
import * as db from './server/db';
import { eq } from 'drizzle-orm';
import { tenants, users } from './drizzle/schema';

// Mock do contexto
const ctx = {
  req: {} as any,
  res: { cookie: () => {}, clearCookie: () => {} } as any,
  user: null,
};

const caller = appRouter.createCaller(ctx);

async function testRegistration() {
  const uniqueId = Date.now();
  const testEmail = `test_reg_${uniqueId}@example.com`;
  const testSubdomain = `test-reg-${uniqueId}`;

  console.log(`Iniciando teste de registro para: ${testEmail}`);

  try {
    // Simular input SEM CNPJ (que estava causando erro)
    const input = {
      tenantData: {
        nomeFantasia: `Test Tenant ${uniqueId}`,
        razaoSocial: `Razão Social ${uniqueId} Ltda`,
        // cnpj: undefined, // OMITIDO PROPOSITALMENTE
        cep: "01001-000",
        logradouro: "Praça da Sé",
        numero: "100",
        bairro: "Sé",
        cidade: "São Paulo",
        estado: "SP",
        telefone: "11999999999",
        email: testEmail,
        planSlug: "profissional" // Slug válido do banco
      },
      userData: {
        name: "Test User",
        email: testEmail,
        password: "password123"
      }
    };

    console.log('Chamando mutation registerTenant...');
    const result = await caller.tenant.createWithUser(input);
    
    console.log('SUCESSO! Resultado:', result);

    // Verificar no banco se foi criado corretamente com CNPJ null
    const dbConn = await db.getDb();
    if (dbConn) {
      const tenant = await dbConn.query.tenants.findFirst({
        where: eq(tenants.subdomain, result.tenant.subdomain)
      });
      
      console.log('Tenant verificado no banco:', {
        id: tenant?.id,
        name: tenant?.name,
        cnpj: tenant?.cnpj, // Deve ser null
        status: tenant?.status
      });

      if (tenant && tenant.cnpj === null) {
        console.log('✅ TESTE PASSOU: Tenant criado com CNPJ null conforme esperado.');
      } else {
        console.error('❌ TESTE FALHOU: CNPJ não é null ou tenant não encontrado.');
      }
    }

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
  }
}

testRegistration();
