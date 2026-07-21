"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Send, 
  Bot, 
  User, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Plus, 
  MoreHorizontal,
  Bell,
  HelpCircle
} from "lucide-react"

type Message = {
  id: string
  sender: "user" | "bot"
  message: string
  created_at: string
}

export function ChatInterfaceV2() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "scheduled">("all")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        setUserName(data.user.user_metadata?.name || data.user.email?.split('@')[0] || "")
        loadMessages(data.user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function loadMessages(uid: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true })
      .limit(100)
    if (data) setMessages(data)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !userId) return

    const text = input.trim()
    setInput("")
    setLoading(true)

    const supabase = createClient()

    // Salva mensagem do usuário no Supabase
    const { data: userMsg } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        sender: "user",
        message: text,
        source: "web_crm",
      })
      .select()
      .single()

    if (userMsg) {
      setMessages((prev) => [...prev, userMsg])
    }

    try {
      // Envia para o webhook do n8n
      const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: userName,
          message: text,
          source: "web_crm",
        }),
      })

      let botReply = ""
      try {
        const data = await response.json()
        botReply = Array.isArray(data) ? data[0]?.text || "" : data.text || ""
      } catch {
        botReply = await response.text()
      }

      // Salva resposta do bot no Supabase
      const { data: botMsg } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          sender: "bot",
          message: botReply,
          source: "web_crm",
        })
        .select()
        .single()

      if (botMsg) {
        setMessages((prev) => [...prev, botMsg])
      }
    } catch {
      // Se der erro ao alcançar o n8n
      const { data: errMsg } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          sender: "bot",
          message: "Desculpe, estou tendo dificuldades para me conectar agora. Por favor, tente novamente mais tarde.",
          source: "web_crm",
        })
        .select()
        .single()

      if (errMsg) {
        setMessages((prev) => [...prev, errMsg])
      }
    }

    setLoading(false)
  }

  return (
    <div className="flex h-full flex-col bg-[#f8f9fc] font-sans">
      {/* Top Header - Estilo Klaws */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Conversas</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">Ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600 rounded-lg">
            <Bell className="h-4.5 w-4.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600 rounded-lg">
            <HelpCircle className="h-4.5 w-4.5" />
          </Button>
          <Button className="h-9 gap-1.5 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-lg px-3.5 text-xs font-semibold shadow-sm shadow-emerald-500/10">
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Nova Conversa
          </Button>
        </div>
      </header>

      {/* Sub Header com Abas e Filtros - Estilo Klaws */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 bg-white px-6 py-1 gap-4">
        {/* Abas */}
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "all"
                ? "border-[#10b981] text-[#10b981]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Todas as mensagens
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "unread"
                ? "border-[#10b981] text-[#10b981]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Não respondidas
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "scheduled"
                ? "border-[#10b981] text-[#10b981]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Agendamentos
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex items-center gap-2 pb-2 md:pb-0">
          <div className="relative w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar..."
              className="h-9 pl-9 pr-4 rounded-lg border-slate-200 bg-slate-50/50 text-xs focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:border-slate-300"
            />
          </div>
          <Button variant="outline" className="h-9 border-slate-200 text-slate-600 gap-1.5 px-3 text-xs rounded-lg hover:bg-slate-50">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Ordenar
          </Button>
          <Button variant="outline" className="h-9 border-slate-200 text-slate-600 gap-1.5 px-3 text-xs rounded-lg hover:bg-slate-50">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Janela de Mensagens */}
      <ScrollArea className="flex-1 px-8 py-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-[#10b981] flex items-center justify-center shadow-sm">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Nenhuma mensagem ainda</p>
                <p className="text-xs text-slate-400">Envie uma mensagem abaixo para iniciar a conversa.</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 items-end ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <Avatar className="h-8.5 w-8.5 border border-slate-100 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-tr from-emerald-400 to-teal-500 text-white">
                    <Bot className="h-4.5 w-4.5" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`group relative rounded-2xl px-4.5 py-3 text-sm leading-relaxed shadow-sm transition-all duration-200 ${
                  msg.sender === "user"
                    ? "bg-[#1f2136] text-white rounded-br-none"
                    : "bg-white text-slate-700 rounded-bl-none border border-slate-100"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.message}</div>
                <span className={`block text-[10px] mt-1.5 font-medium ${
                  msg.sender === "user" ? "text-slate-400 text-right" : "text-slate-400"
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {msg.sender === "user" && (
                <Avatar className="h-8.5 w-8.5 border border-slate-100 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white">
                    <User className="h-4.5 w-4.5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input de Mensagem */}
      <footer className="border-t border-slate-200 bg-white p-4.5">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-3">
            <Input
              placeholder="Digite sua mensagem para o agente de agendamento..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 h-12 px-5 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus-visible:ring-2 focus-visible:ring-[#10b981]/30 focus-visible:border-[#10b981] placeholder-slate-400"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={loading || !input.trim()}
              className="h-12 w-12 rounded-xl bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-md shadow-emerald-500/10 active:scale-95 transition-all duration-150"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
        </div>
      </footer>
    </div>
  )
}
