import type { ReactNode } from "react"
import { CrmSidebar } from "@/components/crm-sidebar"

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <CrmSidebar />
      <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
    </div>
  )
}
