"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  MessageSquare, 
  LogOut, 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Users, 
  TrendingUp, 
  FolderGit2, 
  Settings, 
  HelpCircle,
  ChevronDown
} from "lucide-react"

export function CrmSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = email ? email.charAt(0).toUpperCase() : "?"
  const displayName = email ? email.split("@")[0] : "Usuário"

  return (
    <aside className="flex w-64 flex-col bg-[#131520] text-slate-300 font-sans border-r border-[#1e2030]">
      {/* Header com Logo Nexus */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#1e2030]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20">
            <TrendingUp className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-lg tracking-wide text-white font-sans">Nexus</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#1c1e30]">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Menu Principal */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-[#1e2030]">
        {/* Categoria Geral */}
        <div className="space-y-1">
          <Link
            href="/crm"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              pathname === "/crm"
                ? "bg-[#1f2136] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-[#171928]"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          
          <Link
            href="/crm/chat"
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/crm/chat")
                ? "bg-[#1f2136] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-[#171928]"
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4" />
              Chat de Atendimento
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              1
            </span>
          </Link>

          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60">
            <Calendar className="h-4 w-4" />
            Agenda
          </div>
        </div>

        {/* Categoria Comercial (Mockup Nexus) */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Comercial
          </div>
          
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60">
            <TrendingUp className="h-4 w-4" />
            Oportunidades
          </div>
          
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60">
            <Users className="h-4 w-4" />
            Contatos
          </div>

          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60">
            <FolderGit2 className="h-4 w-4" />
            Empresas
          </div>
        </div>

        {/* Categoria Suporte (Mockup Nexus) */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Suporte
          </div>
          
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-[#171928] cursor-pointer">
            <HelpCircle className="h-4 w-4" />
            Ajuda & FAQ
          </div>

          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-[#171928] cursor-pointer">
            <Settings className="h-4 w-4" />
            Configurações
          </div>
        </div>
      </div>

      {/* Separador e Rodapé com Perfil */}
      <div className="p-3 border-t border-[#1e2030] bg-[#0e1019]">
        <div className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#171928] transition-colors duration-200">
          <Avatar className="h-9 w-9 border border-[#1e2030]">
            <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate capitalize">{displayName}</p>
            <p className="text-[10px] text-slate-500 truncate">{email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
