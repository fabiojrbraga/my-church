import { useAuthStore } from '@/stores/auth.store'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground">Bem-vindo(a), {user?.name ?? user?.email}</p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Membros', 'Eventos', 'Ministérios', 'Tesouraria'].map((label) => (
          <div key={label} className="bg-card rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
