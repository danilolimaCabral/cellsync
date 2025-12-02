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
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, History, ArrowLeftRight, FileSpreadsheet, Sparkles, Moon, Sun, Upload, Shield, FileInput, Table, Database } from "lucide-react";
import { motion } from "framer-motion";
import { NotificationBell } from "./NotificationBell";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

import { Package, ShoppingCart, Wrench, DollarSign, TrendingUp, Settings, Tag } from "lucide-react";

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    path: "/dashboard",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    iconColor: "text-blue-600"
  },
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
    icon: Package, 
    label: "Estoque", 
    path: "/estoque",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
    iconColor: "text-purple-600"
  },
  { 
    icon: Upload, 
    label: "Importar Produtos", 
    path: "/importar-produtos",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
    iconColor: "text-violet-600"
  },
  { 
    icon: Tag, 
    label: "Gerar Etiquetas", 
    path: "/gerar-etiquetas",
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-50 to-yellow-50",
    iconColor: "text-amber-600"
  },
  { 
    icon: FileInput, 
    label: "Importar XML (NF-e)", 
    path: "/importar-xml",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-red-50",
    iconColor: "text-orange-600"
  },
  { 
    icon: Table, 
    label: "Importar Planilha (CSV)", 
    path: "/importar-planilha",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50",
    iconColor: "text-emerald-600"
  },
  { 
    icon: FileSpreadsheet, 
    label: "Relatório Avançado", 
    path: "/relatorio-avancado-estoque",
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50",
    iconColor: "text-indigo-600"
  },
  { 
    icon: ArrowLeftRight, 
    label: "Movimentações", 
    path: "/movimentacoes",
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-50 to-blue-50",
    iconColor: "text-cyan-600"
  },
  { 
    icon: Wrench, 
    label: "Ordem de Serviço", 
    path: "/os",
    gradient: "from-red-500 to-rose-500",
    bgGradient: "from-red-50 to-rose-50",
    iconColor: "text-red-600"
  },
  { 
    icon: Users, 
    label: "Clientes (CRM)", 
    path: "/clientes",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-50 to-rose-50",
    iconColor: "text-pink-600"
  },
  { 
    icon: DollarSign, 
    label: "Financeiro", 
    path: "/financeiro",
    gradient: "from-yellow-500 to-orange-400",
    bgGradient: "from-yellow-50 to-orange-50",
    iconColor: "text-yellow-600"
  },
  { 
    icon: TrendingUp, 
    label: "Dashboard BI", 
    path: "/dashboard-bi",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-50 to-amber-50",
    iconColor: "text-orange-600"
  },
  { 
    icon: Settings, 
    label: "Configurações", 
    path: "/configuracoes",
    gradient: "from-slate-500 to-gray-500",
    bgGradient: "from-slate-50 to-gray-50",
    iconColor: "text-slate-600"
  },
  { 
    icon: Shield, 
    label: "Admin Master", 
    path: "/admin-master",
    gradient: "from-red-600 to-pink-600",
    bgGradient: "from-red-50 to-pink-50",
    iconColor: "text-red-700",
    masterOnly: true // Apenas para master_admin
  },
  { 
    icon: Database, 
    label: "Gerenciar Backups", 
    path: "/gerenciar-backups",
    gradient: "from-indigo-600 to-blue-600",
    bgGradient: "from-indigo-50 to-blue-50",
    iconColor: "text-indigo-700",
    masterOnly: true // Apenas para master_admin
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

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
        animate={{ rotate: theme === "dark" ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {theme === "light" ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Moon className="h-4 w-4 text-blue-500" />
        )}
      </motion.div>
    </Button>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/login";
    },
  });
  const logout = () => logoutMutation.mutate();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate">
                    Navigation
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1 space-y-1">
              {menuItems
                .filter(item => !item.masterOnly || user?.role === "master_admin")
                .map((item, index) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={`h-11 transition-all duration-300 font-medium group relative overflow-hidden ${
                          isActive 
                            ? `bg-gradient-to-r ${item.bgGradient} border-l-4 border-l-transparent shadow-sm` 
                            : "hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100"
                        }`}
                      >
                        {/* Gradiente de fundo no hover */}
                        {!isActive && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                        )}
                        
                        {/* Ícone com background colorido */}
                        <motion.div
                          className={`relative z-10 p-2 rounded-lg ${
                            isActive 
                              ? `bg-gradient-to-br ${item.gradient} shadow-md` 
                              : `bg-gradient-to-br ${item.bgGradient} group-hover:shadow-sm`
                          } transition-all duration-300`}
                          whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className={`h-4 w-4 ${
                            isActive ? "text-white" : item.iconColor
                          } transition-colors duration-300`} />
                        </motion.div>
                        
                        {/* Label */}
                        <span className={`relative z-10 ${
                          isActive 
                            ? "font-semibold text-slate-800" 
                            : "text-slate-600 group-hover:text-slate-800"
                        } transition-colors duration-300`}>
                          {item.label}
                        </span>
                        
                        {/* Indicador de ativo */}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.gradient} rounded-r-full`}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
