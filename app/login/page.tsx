import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(to bottom, #87CEEB, #000080)" }}
    >
      <LoginForm />
    </div>
  )
}
