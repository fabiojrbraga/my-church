import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Calendar,
  Church,
  ClipboardList,
  LayoutDashboard,
  Music2,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'

export type NavigationStatus = 'active' | 'planned'

export interface NavigationItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
  status: NavigationStatus
  highlights: [string, string, string]
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export const navigationSections: NavigationSection[] = [
  {
    title: 'Visao geral',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        description: 'Resumo operacional, acesso rapido e visao consolidada da igreja.',
        icon: LayoutDashboard,
        status: 'active',
        highlights: [
          'Resumo da operacao por unidade e equipe.',
          'Acesso rapido aos fluxos mais usados.',
          'Indicadores prontos para crescer com os proximos modulos.',
        ],
      },
    ],
  },
  {
    title: 'Gestao',
    items: [
      {
        to: '/membros',
        label: 'Membros',
        description: 'Cadastros, familias, historico ministerial e acompanhamento pastoral.',
        icon: Users,
        status: 'active',
        highlights: [
          'Cadastro completo de membros com dados pessoais e eclesiasticos.',
          'Filtros por filial, categoria e status para consulta rapida.',
          'Edicao, mudanca de status e exclusao protegida por vinculos.',
        ],
      },
      {
        to: '/filiais',
        label: 'Filiais',
        description: 'Administracao da matriz, filiais e congregacoes em um unico painel.',
        icon: Building2,
        status: 'active',
        highlights: [
          'Hierarquia entre matriz, filiais e congregacoes.',
          'CRUD completo com status, validacoes e exclusao protegida.',
          'Base pronta para permissoes e indicadores por filial.',
        ],
      },
      {
        to: '/eventos',
        label: 'Eventos',
        description: 'Agenda, inscricoes e acompanhamento de participacao.',
        icon: Calendar,
        status: 'planned',
        highlights: [
          'Eventos publicos ou internos com status operacional.',
          'Estrutura preparada para inscricoes e pagamentos.',
          'Fluxos focados em publicacao simples e acompanhamento claro.',
        ],
      },
      {
        to: '/ministerios',
        label: 'Ministerios',
        description: 'Gestao de equipes, lideranca e atuacao por unidade.',
        icon: Church,
        status: 'planned',
        highlights: [
          'Vinculo de membros e lideres por ministerio.',
          'Estrutura reutilizavel para eventos e escalas.',
          'Navegacao desenhada para expansao modular.',
        ],
      },
      {
        to: '/escalas',
        label: 'Escalas',
        description: 'Planejamento de cultos, funcoes e confirmacao de participacao.',
        icon: ClipboardList,
        status: 'planned',
        highlights: [
          'Tipos de culto, funcoes e vagas com confirmacao.',
          'Compativel com disponibilidade de membros.',
          'Fluxo preparado para publicacao e historico.',
        ],
      },
      {
        to: '/tesouraria',
        label: 'Tesouraria',
        description: 'Contas, categorias, lancamentos, dizimos e relatorios mensais.',
        icon: Wallet,
        status: 'planned',
        highlights: [
          'Base financeira completa ja mapeada no dominio.',
          'Estrutura para conciliacao, contratos e relatorios.',
          'Interface desenhada para reduzir ruido e erro operacional.',
        ],
      },
      {
        to: '/escalas-musica',
        label: 'Louvor',
        description: 'Planejamento especifico de repertorio, funcoes e rotina do ministerio.',
        icon: Music2,
        status: 'planned',
        highlights: [
          'Espaco dedicado para o fluxo do time de louvor.',
          'Integracao natural com escalas e ministerios.',
          'Base pronta para um painel focado e sem distracoes.',
        ],
      },
    ],
  },
]

export const utilityNavigationItems: NavigationItem[] = [
  {
    to: '/configuracoes',
    label: 'Configuracoes',
    description: 'Preferencias, parametros da operacao e ajustes administrativos.',
    icon: Settings,
    status: 'planned',
    highlights: [
      'Centralizacao das preferencias da aplicacao.',
      'Ponto unico para ajustes institucionais e integracoes.',
      'Padrao visual consistente com o restante do app.',
    ],
  },
]

export const navigationItems = [
  ...navigationSections.flatMap((section) => section.items),
  ...utilityNavigationItems,
]

export const quickActionItems = navigationItems.filter((item) =>
  ['/membros', '/eventos', '/escalas', '/tesouraria'].includes(item.to),
)

export function findNavigationItem(pathname: string) {
  return navigationItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
}
