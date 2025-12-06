
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, LogOut, PanelLeft, Users, History, ArrowLeftRight, 
  FileSpreadsheet, Sparkles, Moon, Sun, Upload, Package, ShoppingCart, 
  Wrench, DollarSign, TrendingUp, Settings, Tag, Headphones, FileInput, 
  Table, Wallet, Shield, Database, Bell, FileText, UserCog, Lock, 
  FolderTree, BarChart3, Briefcase, ChevronRight, Calculator, Truck, 
  CreditCard, Receipt, UserPlus, MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { NotificationBell } from "./NotificationBell";
import { TenantSwitcher } from "./TenantSwitcher";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// Definição de tipos para o menu
type MenuItem = {
  icon: any;
  label: string;
  path?: string;
  gradient?: string;
  bgGradient?: string;
  iconColor?: string;
  roles?: string[];
  masterAdminOnly?: boolean;
  items?: SubMenuItem[]; // Submenus
};

type SubMenuItem = {
  label: string;
  path: string;
  roles?: string[];
  masterAdminOnly?: boolean;
};

const menuGroups = [
  {
    title: "Principal",
    items: [
      { 
        icon: LayoutDashboard, 
        label: "Dashboard", 
        path: "/dashboard",
        gradient: "from-blue-500 to-cyan-500",
        bgGradient: "from-blue-50 to-cyan-50",
        iconColor: "text-blue-600"
      },
      { 
        icon: TrendingUp, 
        label: "Dashboard BI", 
        path: "/dashboard-bi",
        gradient: "from-orange-500 to-amber-500",
        bgGradient: "from-orange-50 to-amber-50",
        iconColor: "text-orange-600"
      },
    ]
  },
  {
    title: "Vendas",
    items: [
      { 
        icon: ShoppingCart, 
        label: "Vendas (PDV)", 
        path: "/vendas",
        gradient: "from-green-500 to-emerald-500",
        bgGradient: "from-green-50 to-emerald-50",
        iconColor: "text-green-600"
      },
      { 
        icon: History, 
        label: "Histórico de Vendas", 
        path: "/historico-vendas",
        gradient: "from-teal-500 to-cyan-500",
        bgGradient: "from-teal-50 to-cyan-50",
        iconColor: "text-teal-600"
      },
      { 
        icon: Wallet, 
        label: "Comissões", 
        path: "/controle-comissoes",
        gradient: "from-purple-500 to-pink-500",
        bgGradient: "from-purple-50 to-pink-50",
        iconColor: "text-purple-600",
        roles: ["gerente", "admin", "master_admin"]
      },
    ]
  },
  {
    title: "Estoque",
    items: [
      { 
        icon: Package, 
        label: "Gerenciar Estoque", 
        items: [
          { label: "Produtos", path: "/estoque" },
          { label: "Movimentações", path: "/movimentacoes" },
          { label: "Gerar Etiquetas", path: "/gerar-etiquetas" },
        ],
        gradient: "from-purple-500 to-pink-500",
        bgGradient: "from-purple-50 to-pink-50",
        iconColor: "text-purple-600"
      },
      { 
        icon: Upload, 
        label: "Importação", 
        items: [
          { label: "Importar Produtos", path: "/importar-produtos" },
          { label: "Importar XML (NF-e)", path: "/importar-xml" },
          { label: "Importar Planilha (CSV)", path: "/importar-planilha" },
          { label: "Assistente IA", path: "/assistente-importacao" },
          { label: "Relatórios Avançados", path: "/relatorio-avancado-estoque" },
        ],
        gradient: "from-violet-500 to-purple-500",
        bgGradient: "from-violet-50 to-purple-50",
        iconColor: "text-violet-600"
      },
    ]
  },
  {
    title: "Serviços",
    items: [
      { 
        icon: Wrench, 
        label: "Ordens de Serviço", 
        path: "/os",
        gradient: "from-red-500 to-rose-500",
        bgGradient: "from-red-50 to-rose-50",
        iconColor: "text-red-600"
      },
      { 
        icon: Headphones, 
        label: "Chamados", 
        items: [
          { label: "Meus Chamados", path: "/meus-chamados" },
          { label: "Gerenciar Chamados", path: "/gerenciar-chamados", masterAdminOnly: true },
        ],
        gradient: "from-teal-500 to-cyan-500",
        bgGradient: "from-teal-50 to-cyan-50",
        iconColor: "text-teal-600"
      },
    ]
  },
  {
    title: "Financeiro & Fiscal",
    items: [
      { 
        icon: DollarSign, 
        label: "Financeiro", 
        path: "/financeiro",
        gradient: "from-yellow-500 to-orange-400",
        bgGradient: "from-yellow-50 to-orange-50",
        iconColor: "text-yellow-600"
      },
      { 
        icon: FileText, 
        label: "Notas Fiscais", 
        path: "/notas-fiscais",
        gradient: "from-sky-500 to-blue-500",
        bgGradient: "from-sky-50 to-blue-50",
        iconColor: "text-sky-600"
      },
      { 
        icon: Calculator, 
        label: "Contabilidade", 
        items: [
          { label: "Plano de Contas", path: "/contabilidade/plano-contas" },
          { label: "Lançamentos", path: "/contabilidade/lancamentos" },
          { label: "Relatórios", path: "/contabilidade/relatorios" },
          { label: "Área do Contador", path: "/contabilidade/area-contador" },
        ],
        gradient: "from-cyan-600 to-blue-600",
        bgGradient: "from-cyan-50 to-blue-50",
        iconColor: "text-cyan-700",
        roles: ["gerente", "admin", "master_admin"]
      },
    ]
  },
  {
    title: "Cadastros",
    items: [
      { 
        icon: Users, 
        label: "Clientes (CRM)", 
        path: "/clientes",
        gradient: "from-pink-500 to-rose-500",
        bgGradient: "from-pink-50 to-rose-50",
        iconColor: "text-pink-600"
      },
      { 
        icon: UserCog, 
        label: "Vendedores", 
        path: "/vendedores",
        gradient: "from-blue-500 to-indigo-500",
        bgGradient: "from-blue-50 to-indigo-50",
        iconColor: "text-blue-600",
        roles: ["gerente", "admin", "master_admin"]
      },
    ]
  },
  {
    title: "Sistema",
    items: [
      { 
        icon: Settings, 
        label: "Configurações", 
        path: "/configuracoes",
        gradient: "from-slate-500 to-gray-500",
        bgGradient: "from-slate-50 to-gray-50",
        iconColor: "text-slate-600"
      },
      { 
        icon: Bell, 
        label: "Notificações", 
        path: "/notificacoes",
        gradient: "from-rose-500 to-pink-500",
        bgGradient: "from-rose-50 to-pink-50",
        iconColor: "text-rose-600"
      },
      { 
        icon: Shield, 
        label: "Administração", 
        items: [
          { label: "Liberação de Módulos", path: "/liberacao-modulos" },
          { label: "Suporte ao Cliente", path: "/suporte-clientes" },
          { label: "Admin Master", path: "/admin-master" },
          { label: "Gerenciar Backups", path: "/gerenciar-backups" },
          { label: "Analytics Chatbot", path: "/chatbot-analytics" },
        ],
        gradient: "from-red-600 to-pink-600",
        bgGradient: "from-red-50 to-pink-50",
        iconColor: "text-red-700",
        masterAdminOnly: true
      },

    ]
  }
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

// Componente de toggle de tema
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-lg transition-all hover:bg-accent"
      aria-label="Alternar tema"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {theme === 'dark' ? (
          <Moon className="h-5 w-5 text-blue-400" />
        ) : (
          <Sun className="h-5 w-5 text-amber-500" />
        )}
      </motion.div>
    </Button>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  // Função para verificar permissões
  const hasPermission = (item: MenuItem | SubMenuItem) => {
    if (item.masterAdminOnly && user?.role !== "master_admin") return false;
    if (item.roles && !item.roles.includes(user?.role || "")) return false;
    return true;
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border/40 bg-card/50 backdrop-blur-xl supports-[backdrop-filter]:bg-card/50">
        <SidebarHeader className="h-16 border-b border-border/40 px-4 flex items-center justify-between bg-card/50">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-6 w-6 text-white" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background p-0.5">
                <div className="h-full w-full rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden transition-all duration-300">
                <span className="truncate font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  CellSync
                </span>
                <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Business OS
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4 gap-6">
          {/* Tenant Switcher */}
          {!isCollapsed && (
            <div className="px-2 mb-2">
              <TenantSwitcher />
            </div>
          )}

          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">
                  {group.title}
                </h4>
              )}
              
              <SidebarMenu>
                {group.items.map((item, index) => {
                  if (!hasPermission(item)) return null;

                  const isActive = item.path === location || (item.items && item.items.some(sub => sub.path === location));
                  const Icon = item.icon;

                  // Renderizar item com submenu
                  if (item.items) {
                    return (
                      <Collapsible
                        key={index}
                        asChild
                        defaultOpen={isActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton 
                              tooltip={item.label}
                              className={`
                                w-full justify-between group transition-all duration-200 ease-in-out rounded-xl my-0.5
                                ${isActive 
                                  ? `bg-gradient-to-r ${item.bgGradient} border-r-2 border-indigo-500` 
                                  : 'hover:bg-accent/50 hover:translate-x-1'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`
                                  p-2 rounded-lg transition-all duration-300
                                  ${isActive 
                                    ? `bg-gradient-to-br ${item.gradient} text-white shadow-md` 
                                    : `${item.iconColor} bg-background/80 group-hover:scale-110`
                                  }
                                `}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className={`font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                  {item.label}
                                </span>
                              </div>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem, subIndex) => {
                                if (!hasPermission(subItem)) return null;
                                const isSubActive = subItem.path === location;
                                
                                return (
                                  <SidebarMenuSubItem key={subIndex}>
                                    <SidebarMenuSubButton 
                                      asChild 
                                      isActive={isSubActive}
                                      className={`
                                        transition-all duration-200 rounded-lg
                                        ${isSubActive ? 'font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' : 'text-muted-foreground hover:text-foreground'}
                                      `}
                                    >
                                      <Link href={subItem.path}>
                                        <span>{subItem.label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // Renderizar item simples
                  return (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        className={`
                          w-full group transition-all duration-200 ease-in-out rounded-xl my-0.5
                          ${isActive 
                            ? `bg-gradient-to-r ${item.bgGradient} border-r-2 border-indigo-500` 
                            : 'hover:bg-accent/50 hover:translate-x-1'
                          }
                        `}
                      >
                        <Link href={item.path!}>
                          <div className={`
                            p-2 rounded-lg transition-all duration-300
                            ${isActive 
                              ? `bg-gradient-to-br ${item.gradient} text-white shadow-md` 
                              : `${item.iconColor} bg-background/80 group-hover:scale-110`
                            }
                          `}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={`font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-border/40 p-4 bg-card/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-2 h-14 hover:bg-accent/50 rounded-xl group transition-all duration-200">
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:border-indigo-500 transition-colors">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left overflow-hidden transition-all duration-300 group-hover:translate-x-1">
                  <span className="text-sm font-semibold truncate w-full text-foreground">
                    {user?.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full capitalize">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-border/50 backdrop-blur-xl bg-card/95">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">Tema</span>
                <ThemeToggle />
              </div>
              <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-accent/50" onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-red-500 font-medium">Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background/50 backdrop-blur-3xl">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 px-4 bg-card/50 backdrop-blur-xl sticky top-0 z-10 transition-all duration-200">
          <SidebarTrigger className="-ml-1 hover:bg-accent/50 rounded-lg" />
          <div className="mr-4 hidden md:block h-4 w-px bg-border/50" />
          
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden md:inline-block font-medium text-foreground/80">
                {menuGroups.flatMap(g => g.items).find(i => i.path === location || i.items?.some(sub => sub.path === location))?.label || "Dashboard"}
              </span>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <NotificationBell />
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </SidebarInset>
    </>
  );
}
