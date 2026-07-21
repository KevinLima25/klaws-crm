import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TrendingUp } from "lucide-react"

async function signIn(formData: FormData) {
  "use server"

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect("/crm")
}

export default async function LoginPage(props: { searchParams?: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams?.error

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#131520] p-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 mb-4">
            <TrendingUp className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide text-white">Klaws</h1>
          <p className="text-sm text-slate-400 mt-1">Faça login para continuar</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#1e2030] bg-[#1f2136] p-8 shadow-xl">
          <form action={signIn} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">{error}</p>
            )}

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 active:scale-[0.98]"
            >
              Entrar
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Klaws CRM &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
