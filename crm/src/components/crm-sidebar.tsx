"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  LogOut,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  User,
  TrendingUp,
  FolderGit2,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bot,
  Upload,
  PanelLeftClose,
  PanelLeft,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "klaws_sidebar_collapsed"

type NavItem = {
  href?: string
  label: string
  icon: typeof LayoutDashboard
  disabled?: boolean
  badge?: number | boolean
  onClick?: () => void
}

type NavGroup = {
  title: string
  items: NavItem[]
}

export function CrmSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string>("")
  const [userName, setUserName] = useState("")
  const [userCargo, setUserCargo] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_KEY)
    if (saved === "true") setCollapsed(true)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem(COLLAPSE_KEY, String(collapsed))
  }, [collapsed, mounted])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setEmail(data.user.email)
        setUserName(data.user.user_metadata?.name || data.user.email?.split("@")[0] || "")
        setUserCargo(data.user.user_metadata?.cargo || "")
      }
    })
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setUserName(data.name)
        if (data.cargo) setUserCargo(data.cargo)
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
      })
      .catch(() => {})
  }, [])

  const [chatUnread, setChatUnread] = useState(true)
  const cargoUpper = (userCargo || "").toUpperCase()
  const canAdmin = !userCargo || cargoUpper.includes("ADMIN") || cargoUpper.includes("GERENTE") || cargoUpper.includes("FINANCEIRO") || cargoUpper.includes("ASSISTENTE")
  const isChatPage = pathname.startsWith("/crm/chat")

  useEffect(() => {
    const stored = localStorage.getItem("klaws_chat_read")
    if (stored === "true" || isChatPage) {
      setChatUnread(false)
    }
  }, [isChatPage])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), [])

  const nameParts = userName.split(" ").filter(Boolean)
  const firstName = nameParts[0] || ""
  const secondName = nameParts[1] || ""
  const displayName = [firstName, secondName].filter(Boolean).join(" ") || email?.split("@")[0] || "Usuário"
  const initials = firstName ? firstName.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : "?"

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === "/crm") return pathname === "/crm"
    return pathname.startsWith(href)
  }

  const navGroups: NavGroup[] = [
    {
      title: "Geral",
      items: [
        { href: "/crm", label: "Dashboard", icon: LayoutDashboard },
        {
          href: "/crm/chat",
          label: "Chat de Atendimento",
          icon: MessageSquare,
          badge: chatUnread ? 1 : undefined,
          onClick: () => { setChatUnread(false); localStorage.setItem("klaws_chat_read", "true") },
        },
        { href: "/crm/clientes/timeline", label: "Timeline", icon: Clock },
        { label: "Agenda", icon: Calendar, disabled: true },
      ],
    },
    {
      title: "Comercial",
      items: [
        { label: "Oportunidades", icon: TrendingUp, disabled: true },
        { label: "Contatos", icon: Users, disabled: true },
        { label: "Empresas", icon: FolderGit2, disabled: true },
      ],
    },
    {
      title: "Suporte",
      items: [
        { href: "/crm/perfil", label: "Perfil", icon: User },
        { label: "Ajuda & FAQ", icon: HelpCircle, disabled: true },
        { label: "Configurações", icon: Settings, disabled: true },
      ],
    },
  ]

  if (canAdmin) {
    navGroups.push({
      title: "Administração",
      items: [
        { href: "/admin", label: "Usuários", icon: Settings },
        { href: "/admin/agentes", label: "Agentes", icon: Bot },
        { href: "/admin/importar", label: "Importar", icon: Upload },
        { href: "/admin/conciliacao", label: "Conciliação", icon: CheckSquare },
        { href: "/admin/pendencias", label: "Pendências", icon: AlertTriangle },
      ],
    })
  }

  if (!mounted) {
    return <aside className="w-64 bg-[#131520]" />
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#131520] text-slate-300 font-sans border-r border-[#1e2030] transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex h-16 items-center border-b border-[#1e2030] transition-all",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20">
            <TrendingUp className="h-4 w-4 stroke-[2.5]" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20">
              <TrendingUp className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <span className="font-bold text-lg tracking-wide text-white font-sans">Klaws</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            "h-8 w-8 text-slate-400 hover:text-white hover:bg-[#1c1e30] transition-colors",
            collapsed && "hidden"
          )}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-[#1e2030]">
        {collapsed && (
          <div className="px-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#1c1e30] mx-auto"
              aria-label="Expandir sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {navGroups.map((group) => (
          <div key={group.title} className="mb-6">
            {!collapsed && (
              <div className="px-4 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon

                if (item.disabled) {
                  return (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed opacity-60 transition-all",
                        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href!}
                    onClick={item.onClick}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative",
                      collapsed
                        ? "justify-center p-2.5"
                        : "gap-3 px-3 py-2.5",
                      active
                        ? "bg-[#1f2136] text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-100 hover:bg-[#171928]"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.badge !== undefined && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Profile Footer */}
      <div className={cn(
        "border-t border-[#1e2030] bg-[#0e1019] transition-all",
        collapsed ? "p-2" : "p-3"
      )}>
        <div className={cn(
          "flex items-center rounded-xl transition-colors",
          collapsed ? "justify-center p-1.5" : "gap-3 p-1.5 hover:bg-[#171928]"
        )}>
          <Avatar className="h-9 w-9 border border-[#1e2030] shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate capitalize">{displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">{email}</p>
                {userCargo && <p className="text-[10px] text-indigo-400 truncate font-medium">{userCargo}</p>}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        {collapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 mt-1 mx-auto block"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  )
}
