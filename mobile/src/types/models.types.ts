// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'vendedor' | 'tecnico' | 'gerente';
  active: boolean;
}

// Product Types
export interface Product {
  id: number;
  nome: string;
  descricao?: string;
  categoria: string;
  marca?: string;
  modelo?: string;
  precoVenda: number;
  precoAtacado?: number;
  precoCompra: number;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockItem {
  id: number;
  produtoId: number;
  imei?: string;
  numeroSerie?: string;
  status: 'disponivel' | 'vendido' | 'reservado' | 'defeito';
  localizacao?: string;
  observacoes?: string;
  produto?: Product;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface Customer {
  id: number;
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pontosFidelidade: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sale Types
export interface Sale {
  id: number;
  clienteId?: number;
  vendedorId: number;
  tipoVenda: 'varejo' | 'atacado';
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: string;
  status: 'concluida' | 'cancelada';
  observacoes?: string;
  cliente?: Customer;
  vendedor?: User;
  itens: SaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: number;
  vendaId: number;
  produtoId: number;
  estoqueId?: number;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  produto?: Product;
}

// Service Order Types
export interface ServiceOrder {
  id: number;
  clienteId: number;
  tecnicoId?: number;
  aparelho: string;
  marca?: string;
  modelo?: string;
  imei?: string;
  defeito: string;
  observacoes?: string;
  status: 'aberta' | 'em_andamento' | 'aguardando_peca' | 'pronta' | 'entregue' | 'cancelada';
  valorOrcamento?: number;
  valorFinal?: number;
  dataPrevisao?: Date;
  dataEntrega?: Date;
  cliente?: Customer;
  tecnico?: User;
  pecas: ServiceOrderPart[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOrderPart {
  id: number;
  ordemServicoId: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  produto?: Product;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  stockItemId?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  customer?: Customer;
  paymentMethod?: string;
  saleType: 'varejo' | 'atacado';
}

// Dashboard Types
export interface DashboardKPIs {
  vendasHoje: number;
  vendasMes: number;
  lucroMes: number;
  ordensAbertas: number;
  estoqueAlerta: number;
  clientesAtivos: number;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
}
