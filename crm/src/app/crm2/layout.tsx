import type { ReactNode } from "react"
import { CrmSidebarV2 } from "@/components/crm-sidebar-v2"

export default function CrmLayoutV2({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <CrmSidebarV2 />
      <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
    </div>
  )
}
