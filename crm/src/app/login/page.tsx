import { AuthForm } from "@/components/auth-form"

export default async function LoginPage(props: { searchParams?: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams?.error

  return <AuthForm serverError={error} />
}
