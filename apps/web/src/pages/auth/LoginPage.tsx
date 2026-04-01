import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, LockKeyhole } from 'lucide-react'

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
    <div className="space-y-8">
      <div className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          Acesso da equipe
        </Badge>

        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Entre para continuar a operação.
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Faça login com a conta administrativa da sua igreja para acessar os módulos e o painel principal.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5">
        <div className="space-y-2">
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
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" /> {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
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
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" /> {errors.password.message}
            </p>
          )}
        </div>

        {errors.root && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.root.message}
          </div>
        )}

        <Button type="submit" loading={isPending} className="mt-2 w-full" size="lg">
          {isPending ? 'Entrando...' : 'Entrar no sistema'}
        </Button>
      </form>

      <div className="surface-subtle flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LockKeyhole className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Sessão contínua e navegação simplificada</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A experiência foi ajustada para mobile e desktop, com navegação consistente, componentes reutilizáveis e
            um app shell mais fluido para as próximas telas.
          </p>
        </div>
      </div>
    </div>
  )
}
