"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, LogOut, Home } from "lucide-react"

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

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <MessageSquare className="h-5 w-5" />
        <span>CRM</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        <Link
          href="/crm"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/crm"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/crm/chat"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/crm/chat"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </Link>
      </nav>
      <Separator />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-sm">{email}</span>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
