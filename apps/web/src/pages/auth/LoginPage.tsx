import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user)
      navigate('/dashboard')
    },
    onError: () => setError('root', { message: 'E-mail ou senha incorretos' }),
  })

  return (
    <div className="bg-card rounded-2xl border card-shadow-md p-8">
      <div className="mb-7">
        <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
          Bem-vindo(a) de volta
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Entre com suas credenciais para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            error={!!errors.email}
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            {...register('password')}
            type="password"
            placeholder="••••••••"
            error={!!errors.password}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.password.message}
            </p>
          )}
        </div>

        {errors.root && (
          <div className="flex items-center gap-2.5 text-sm text-destructive bg-destructive/8 border border-destructive/20 px-3.5 py-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errors.root.message}
          </div>
        )}

        <Button type="submit" loading={isPending} className="w-full mt-2" size="lg">
          {isPending ? 'Entrando...' : 'Entrar no sistema'}
        </Button>
      </form>
    </div>
  )
}
