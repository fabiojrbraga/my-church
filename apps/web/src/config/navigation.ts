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
    title: 'Visão geral',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        description: 'Resumo operacional, acesso rápido e visão consolidada da igreja.',
        icon: LayoutDashboard,
        status: 'active',
        highlights: [
          'Resumo da operação por unidade e equipe.',
          'Acesso rápido aos fluxos mais usados.',
          'Indicadores prontos para crescer com os próximos módulos.',
        ],
      },
    ],
  },
  {
    title: 'Gestão',
    items: [
      {
        to: '/membros',
        label: 'Membros',
        description: 'Cadastros, famílias, histórico ministerial e acompanhamento pastoral.',
        icon: Users,
        status: 'planned',
        highlights: [
          'Cadastro completo de pessoas, membros e visitantes.',
          'Estrutura pronta para famílias, categorias e vínculos.',
          'Fluxos desenhados para triagem simples e consulta rápida.',
        ],
      },
      {
        to: '/filiais',
        label: 'Filiais',
        description: 'Administração da matriz, filiais e congregações em um único painel.',
        icon: Building2,
        status: 'planned',
        highlights: [
          'Hierarquia entre matriz, filiais e congregações.',
          'Escopo por unidade no backend e na autenticação.',
          'Base pronta para permissões e indicadores por filial.',
        ],
      },
      {
        to: '/eventos',
        label: 'Eventos',
        description: 'Agenda, inscrições e acompanhamento de participação.',
        icon: Calendar,
        status: 'planned',
        highlights: [
          'Eventos públicos ou internos com status operacional.',
          'Estrutura preparada para inscrições e pagamentos.',
          'Fluxos focados em publicação simples e acompanhamento claro.',
        ],
      },
      {
        to: '/ministerios',
        label: 'Ministérios',
        description: 'Gestão de equipes, liderança e atuação por unidade.',
        icon: Church,
        status: 'planned',
        highlights: [
          'Vínculo de membros e líderes por ministério.',
          'Estrutura reutilizável para eventos e escalas.',
          'Navegação desenhada para expansão modular.',
        ],
      },
      {
        to: '/escalas',
        label: 'Escalas',
        description: 'Planejamento de cultos, funções e confirmação de participação.',
        icon: ClipboardList,
        status: 'planned',
        highlights: [
          'Tipos de culto, funções e vagas com confirmação.',
          'Compatível com disponibilidade de membros.',
          'Fluxo preparado para publicação e histórico.',
        ],
      },
      {
        to: '/tesouraria',
        label: 'Tesouraria',
        description: 'Contas, categorias, lançamentos, dízimos e relatórios mensais.',
        icon: Wallet,
        status: 'planned',
        highlights: [
          'Base financeira completa já mapeada no domínio.',
          'Estrutura para conciliação, contratos e relatórios.',
          'Interface desenhada para reduzir ruído e erro operacional.',
        ],
      },
      {
        to: '/escalas-musica',
        label: 'Louvor',
        description: 'Planejamento específico de repertório, funções e rotina do ministério.',
        icon: Music2,
        status: 'planned',
        highlights: [
          'Espaço dedicado para o fluxo do time de louvor.',
          'Integração natural com escalas e ministérios.',
          'Base pronta para um painel focado e sem distrações.',
        ],
      },
    ],
  },
]

export const utilityNavigationItems: NavigationItem[] = [
  {
    to: '/configuracoes',
    label: 'Configurações',
    description: 'Preferências, parâmetros da operação e ajustes administrativos.',
    icon: Settings,
    status: 'planned',
    highlights: [
      'Centralização das preferências da aplicação.',
      'Ponto único para ajustes institucionais e integrações.',
      'Padrão visual consistente com o restante do app.',
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
