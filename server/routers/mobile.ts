import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import * as db from '../db';

/**
 * Router para API Mobile
 * Endpoints otimizados para consumo do aplicativo mobile
 */
export const mobileRouter = router({
  // ========== DASHBOARD ==========
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Vendas do dia
      const vendasHoje = await db.getVendasByDateRange(today, new Date());
      const totalVendasHoje = vendasHoje.reduce((sum, v) => sum + Number(v.valorTotal), 0);

      // OS abertas
      const osAbertas = await db.getServiceOrdersByStatus('aberta');

      // Total de produtos
      const produtos = await db.getAllProducts();

      // Total de clientes
      const clientes = await db.getAllCustomers();

      return {
        vendasHoje: totalVendasHoje,
        osAbertas: osAbertas.length,
        totalProdutos: produtos.length,
        totalClientes: clientes.length,
      };
    }),

    activities: protectedProcedure.query(async ({ ctx }) => {
      // Últimas 10 atividades
      const vendas = await db.getRecentSales(5);
      const os = await db.getRecentServiceOrders(5);

      const activities = [
        ...vendas.map(v => ({
          id: `venda-${v.id}`,
          type: 'venda',
          title: 'Venda finalizada',
          value: `R$ ${Number(v.valorTotal).toFixed(2)}`,
          timestamp: v.createdAt,
        })),
        ...os.map(o => ({
          id: `os-${o.id}`,
          type: 'os',
          title: 'Nova OS criada',
          value: `#OS-${o.id}`,
          timestamp: o.createdAt,
        })),
      ];

      // Ordenar por data mais recente
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activities.slice(0, 10);
    }),
  }),

  // ========== PRODUTOS ==========
  produtos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const produtos = await db.getAllProducts();
      return produtos.map(p => ({
        id: p.id,
        nome: p.nome,
        preco: Number(p.precoVenda),
        estoque: p.quantidadeEstoque,
        categoria: p.categoria || 'Geral',
        imei: p.imei,
      }));
    }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        const produtos = await db.searchProducts(input.query);
        return produtos.map(p => ({
          id: p.id,
          nome: p.nome,
          preco: Number(p.precoVenda),
          estoque: p.quantidadeEstoque,
          categoria: p.categoria || 'Geral',
          imei: p.imei,
        }));
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const produto = await db.getProductById(input.id);
        if (!produto) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        }
        return {
          id: produto.id,
          nome: produto.nome,
          preco: Number(produto.precoVenda),
          estoque: produto.quantidadeEstoque,
          categoria: produto.categoria || 'Geral',
          imei: produto.imei,
          descricao: produto.descricao,
        };
      }),
  }),

  // ========== VENDAS ==========
  vendas: router({
    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          produtoId: z.number(),
          quantidade: z.number(),
          preco: z.number(),
        })),
        formaPagamento: z.enum(['dinheiro', 'cartao', 'pix']),
        valorRecebido: z.number().optional(),
        clienteId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const total = input.items.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

        const venda = await db.createSale({
          valorTotal: total,
          formaPagamento: input.formaPagamento,
          valorRecebido: input.valorRecebido,
          clienteId: input.clienteId,
          vendedorId: ctx.user.id,
          items: input.items,
        });

        return {
          id: venda.id,
          total,
          troco: input.valorRecebido ? input.valorRecebido - total : 0,
        };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const vendas = await db.getRecentSales(50);
      return vendas.map(v => ({
        id: v.id,
        valorTotal: Number(v.valorTotal),
        formaPagamento: v.formaPagamento,
        createdAt: v.createdAt,
      }));
    }),
  }),

  // ========== ORDENS DE SERVIÇO ==========
  os: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const os = await db.getAllServiceOrders();
      return os.map(o => ({
        id: o.id,
        clienteNome: o.clienteNome,
        equipamento: o.equipamento,
        defeito: o.defeito,
        status: o.status,
        prioridade: o.prioridade || 'normal',
        valorOrcamento: o.valorOrcamento ? Number(o.valorOrcamento) : null,
        createdAt: o.createdAt,
      }));
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const os = await db.getServiceOrderById(input.id);
        if (!os) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'OS não encontrada' });
        }
        return os;
      }),

    create: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        equipamento: z.string(),
        defeito: z.string(),
        observacoes: z.string().optional(),
        prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const os = await db.createServiceOrder({
          ...input,
          tecnicoId: ctx.user.id,
          status: 'aberta',
        });
        return os;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['aberta', 'em_andamento', 'aguardando_peca', 'concluida', 'cancelada']),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateServiceOrderStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ========== CLIENTES ==========
  clientes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const clientes = await db.getAllCustomers();
      return clientes.map(c => ({
        id: c.id,
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        cpf: c.cpf,
        fidelidade: c.pontosFidelidade || 0,
        nivelFidelidade: getNivelFidelidade(c.pontosFidelidade || 0),
      }));
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const cliente = await db.getCustomerById(input.id);
        if (!cliente) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });
        }
        return {
          ...cliente,
          nivelFidelidade: getNivelFidelidade(cliente.pontosFidelidade || 0),
        };
      }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        telefone: z.string(),
        email: z.string().email().optional(),
        cpf: z.string().optional(),
        endereco: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const cliente = await db.createCustomer(input);
        return cliente;
      }),
  }),

  // ========== FINANCEIRO ==========
  financeiro: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const lancamentos = await db.getFinancialTransactionsByDateRange(firstDayOfMonth, today);

      const receitas = lancamentos
        .filter(l => l.tipo === 'receita')
        .reduce((sum, l) => sum + Number(l.valor), 0);

      const despesas = lancamentos
        .filter(l => l.tipo === 'despesa')
        .reduce((sum, l) => sum + Number(l.valor), 0);

      return {
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    }),

    lancamentos: protectedProcedure
      .input(z.object({
        tipo: z.enum(['receita', 'despesa', 'todos']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const lancamentos = await db.getRecentFinancialTransactions(50);

        const filtered = input.tipo && input.tipo !== 'todos'
          ? lancamentos.filter(l => l.tipo === input.tipo)
          : lancamentos;

        return filtered.map(l => ({
          id: l.id,
          tipo: l.tipo,
          descricao: l.descricao,
          valor: Number(l.valor),
          categoria: l.categoria,
          data: l.data,
        }));
      }),

    createLancamento: protectedProcedure
      .input(z.object({
        tipo: z.enum(['receita', 'despesa']),
        descricao: z.string(),
        valor: z.number(),
        categoria: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lancamento = await db.createFinancialTransaction(input);
        return lancamento;
      }),
  }),

  // ========== ESTOQUE ==========
  estoque: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const produtos = await db.getAllProducts();

      const total = produtos.length;
      const baixo = produtos.filter(p => p.quantidadeEstoque <= (p.estoqueMinimo || 5)).length;
      const esgotado = produtos.filter(p => p.quantidadeEstoque === 0).length;

      return {
        total,
        baixo,
        esgotado,
      };
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const produtos = await db.getAllProducts();
      return produtos.map(p => ({
        id: p.id,
        nome: p.nome,
        quantidade: p.quantidadeEstoque,
        minimo: p.estoqueMinimo || 5,
        status: getStatusEstoque(p.quantidadeEstoque, p.estoqueMinimo || 5),
        imei: p.imei,
      }));
    }),
  }),
});

// Helpers
function getNivelFidelidade(pontos: number): string {
  if (pontos >= 1000) return 'platina';
  if (pontos >= 500) return 'ouro';
  if (pontos >= 200) return 'prata';
  return 'bronze';
}

function getStatusEstoque(quantidade: number, minimo: number): string {
  if (quantidade === 0) return 'esgotado';
  if (quantidade <= minimo) return 'baixo';
  return 'ok';
}
