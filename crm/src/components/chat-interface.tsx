"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User } from "lucide-react"

type Message = {
  id: string
  sender: "user" | "bot"
  message: string
  created_at: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
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

    // Save user message to Supabase
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
      // Send to n8n webhook
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

      // Save bot response to Supabase
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
      // If n8n is unreachable, show error
      const { data: errMsg } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          sender: "bot",
          message: "Sorry, I'm having trouble connecting right now. Please try again later.",
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
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Chat</h2>
        <p className="text-sm text-muted-foreground">
          Send a message to start a conversation
        </p>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : ""}`}
            >
              {msg.sender === "bot" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-xl px-4 py-2 max-w-[70%] text-sm ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.message}
              </div>
              {msg.sender === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSend} className="flex gap-3">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
