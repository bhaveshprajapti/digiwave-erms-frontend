export const metadata = {
  title: 'Forgot Password — Digiwave',
  description: 'Recover access to your Digiwave account',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-semibold">Forgot Password</h1>
          <p className="text-sm text-muted-foreground">This feature is currently disabled. Please contact your administrator.</p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="identifier" className="text-sm font-medium">Email or Username</label>
            <input id="identifier" type="text" className="h-10 w-full rounded-md border px-3 py-2 text-base" placeholder="you@company.com or username" disabled />
          </div>
          <button type="button" className="h-10 w-full rounded-md bg-muted text-muted-foreground" disabled>
            Send reset link (disabled)
          </button>
        </form>
      </div>
    </div>
  )
}
