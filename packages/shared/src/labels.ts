// ============================================================
// Labels em pt-BR para todos os enums do dominio
// Uso: labels.tipoPessoa[PersonCategory.MEMBER] => "Membro"
// ============================================================

export const labels = {
  tipoPessoa: {
    MEMBER: 'Membro',
    VISITOR_OCCASIONAL: 'Visitante Eventual',
    VISITOR_FREQUENT: 'Visitante Assiduo',
    PROSPECTIVE_MEMBER: 'Em Preparacao',
    KIDS_MEMBER: 'Membro Kids',
  },

  faixaEtariaKids: {
    NURSERY: 'Bercario (0-2 anos)',
    TODDLER: 'Maternal (3-4 anos)',
    JUNIOR: 'Juniores (5-7 anos)',
    CHILDREN: 'Criancas (8-10 anos)',
    PRE_TEEN: 'Pre-adolescente (11-12 anos)',
  },

  statusMembro: {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    TRANSFERRED: 'Transferido',
    DECEASED: 'Falecido',
  },

  relacionamentoFamiliar: {
    FATHER: 'Pai',
    MOTHER: 'Mae',
    SON: 'Filho',
    DAUGHTER: 'Filha',
    SPOUSE: 'Conjuge',
    SIBLING: 'Irmao/Irma',
    GRANDPARENT: 'Avo/Avo',
    GRANDCHILD: 'Neto/Neta',
    OTHER: 'Outro',
  },

  tipoVinculoFamiliar: {
    PARENT_OF: 'Pai/Mae de',
    SPOUSE_OF: 'Conjuge de',
    SIBLING_OF: 'Irmao/Irma de',
    GRANDPARENT_OF: 'Avo/Avo de',
    GUARDIAN_OF: 'Responsavel por',
    OTHER: 'Vinculo familiar',
  },

  tipoFilial: {
    HEADQUARTERS: 'Matriz',
    BRANCH: 'Filial',
    CONGREGATION: 'Congregacao',
  },

  papelUsuario: {
    SUPER_ADMIN: 'Super Administrador',
    BOARD_MEMBER: 'Diretoria',
    BRANCH_ADMIN: 'Administrador da Filial',
    SECRETARY: 'Secretaria',
    TREASURER: 'Tesoureiro',
    MINISTRY_LEADER: 'Lider de Ministerio',
    MEMBER: 'Membro',
  },

  cargoDiretoria: {
    PRESIDENT: 'Presidente',
    VICE_PRESIDENT: 'Vice-Presidente',
    TREASURER: 'Tesoureiro',
    SECRETARY: 'Secretario(a)',
    FINANCIAL_SECRETARY: 'Secretario(a) Financeiro(a)',
    BOARD_MEMBER: 'Membro da Diretoria',
    FISCAL_COUNCIL: 'Conselho Fiscal',
  },

  estadoCivil: {
    SINGLE: 'Solteiro(a)',
    MARRIED: 'Casado(a)',
    DIVORCED: 'Divorciado(a)',
    WIDOWED: 'Viuvo(a)',
    COMMON_LAW: 'Uniao Estavel',
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
    CREDIT_CARD: 'Cartao de Credito',
    DEBIT_CARD: 'Cartao de Debito',
    CASH: 'Dinheiro',
    BANK_TRANSFER: 'Transferencia Bancaria',
    EXEMPT: 'Isento',
  },

  statusEscala: {
    DRAFT: 'Rascunho',
    PUBLISHED: 'Publicada',
    ARCHIVED: 'Arquivada',
  },

  tipoTransacao: {
    INCOME: 'Entrada',
    EXPENSE: 'Saida',
  },

  periodicidade: {
    DAILY: 'Diaria',
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
    2: 'Terca-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sabado',
  },
} as const
