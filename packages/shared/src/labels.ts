// ============================================================
// Labels em pt-BR para todos os enums do domínio
// Uso: labels.tipoPessoa[PersonCategory.MEMBER] => "Membro"
// ============================================================

export const labels = {
  tipoPessoa: {
    MEMBER: 'Membro',
    VISITOR_OCCASIONAL: 'Visitante Eventual',
    VISITOR_FREQUENT: 'Visitante Assíduo',
    PROSPECTIVE_MEMBER: 'Em Preparação',
    KIDS_MEMBER: 'Membro Kids',
  },

  faixaEtariaKids: {
    NURSERY: 'Berçário (0-2 anos)',
    TODDLER: 'Maternal (3-4 anos)',
    JUNIOR: 'Juniores (5-7 anos)',
    CHILDREN: 'Crianças (8-10 anos)',
    PRE_TEEN: 'Pré-adolescente (11-12 anos)',
  },

  statusMembro: {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    TRANSFERRED: 'Transferido',
    DECEASED: 'Falecido',
  },

  relacionamentoFamiliar: {
    FATHER: 'Pai',
    MOTHER: 'Mãe',
    SON: 'Filho',
    DAUGHTER: 'Filha',
    SPOUSE: 'Cônjuge',
    SIBLING: 'Irmão/Irmã',
    GRANDPARENT: 'Avô/Avó',
    GRANDCHILD: 'Neto/Neta',
    OTHER: 'Outro',
  },

  tipoFilial: {
    HEADQUARTERS: 'Matriz',
    BRANCH: 'Filial',
    CONGREGATION: 'Congregação',
  },

  papelUsuario: {
    SUPER_ADMIN: 'Super Administrador',
    BOARD_MEMBER: 'Diretoria',
    BRANCH_ADMIN: 'Administrador da Filial',
    SECRETARY: 'Secretaria',
    TREASURER: 'Tesoureiro',
    MINISTRY_LEADER: 'Líder de Ministério',
    MEMBER: 'Membro',
  },

  cargoDiretoria: {
    PRESIDENT: 'Presidente',
    VICE_PRESIDENT: 'Vice-Presidente',
    TREASURER: 'Tesoureiro',
    SECRETARY: 'Secretário(a)',
    FINANCIAL_SECRETARY: 'Secretário(a) Financeiro(a)',
    BOARD_MEMBER: 'Membro da Diretoria',
    FISCAL_COUNCIL: 'Conselho Fiscal',
  },

  estadoCivil: {
    SINGLE: 'Solteiro(a)',
    MARRIED: 'Casado(a)',
    DIVORCED: 'Divorciado(a)',
    WIDOWED: 'Viúvo(a)',
    COMMON_LAW: 'União Estável',
  },

  statusEvento: {
    DRAFT: 'Rascunho',
    PUBLISHED: 'Publicado',
    CANCELLED: 'Cancelado',
    FINISHED: 'Encerrado',
  },

  statusInscricao: {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    CANCELLED: 'Cancelado',
    WAITLISTED: 'Lista de Espera',
  },

  statusPagamento: {
    PENDING: 'Pendente',
    PAID: 'Pago',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Estornado',
    EXEMPT: 'Isento',
  },

  formaPagamento: {
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    CASH: 'Dinheiro',
    BANK_TRANSFER: 'Transferência Bancária',
    EXEMPT: 'Isento',
  },

  statusEscala: {
    DRAFT: 'Rascunho',
    PUBLISHED: 'Publicada',
    ARCHIVED: 'Arquivada',
  },

  tipoTransacao: {
    INCOME: 'Entrada',
    EXPENSE: 'Saída',
  },

  periodicidade: {
    DAILY: 'Diária',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensal',
    QUARTERLY: 'Trimestral',
    YEARLY: 'Anual',
  },

  statusConciliacao: {
    OPEN: 'Aberta',
    CLOSED: 'Fechada',
  },

  diaDaSemana: {
    0: 'Domingo',
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
  },
} as const
