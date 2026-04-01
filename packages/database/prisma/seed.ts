import { PrismaClient, BranchType, UserRole, PersonCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ── 1. Matriz ──────────────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { cnpj: process.env.SEED_BRANCH_CNPJ ?? '00.000.000/0001-00' },
    update: {},
    create: {
      name: process.env.SEED_BRANCH_NAME ?? 'Igreja MyChurch — Matriz',
      type: BranchType.HEADQUARTERS,
      cnpj: process.env.SEED_BRANCH_CNPJ ?? '00.000.000/0001-00',
      email: process.env.SEED_BRANCH_EMAIL ?? 'contato@mychurch.com',
      isActive: true,
    },
  })
  console.log(`✅ Filial criada: ${branch.name} (${branch.id})`)

  // ── 2. Person do Super Admin ────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@mychurch.com'

  const person = await prisma.person.upsert({
    where: { cpf: process.env.SEED_ADMIN_CPF ?? '000.000.000-00' },
    update: {},
    create: {
      branchId: branch.id,
      fullName: process.env.SEED_ADMIN_NAME ?? 'Administrador',
      cpf: process.env.SEED_ADMIN_CPF ?? '000.000.000-00',
      email: adminEmail,
      category: PersonCategory.MEMBER,
      isActive: true,
    },
  })
  console.log(`✅ Person criada: ${person.fullName} (${person.id})`)

  // ── 3. User SUPER_ADMIN ─────────────────────────────────────
  const rawPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123'
  const passwordHash = await bcrypt.hash(rawPassword, 12)

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      branchId: branch.id,
      personId: person.id,
      isActive: true,
    },
  })
  console.log(`✅ Usuário criado: ${user.email} | role: ${user.role}`)

  console.log('')
  console.log('─────────────────────────────────────────')
  console.log('  Credenciais iniciais:')
  console.log(`  E-mail  : ${adminEmail}`)
  console.log(`  Senha   : ${rawPassword}`)
  console.log('  ⚠️  Altere a senha após o primeiro login!')
  console.log('─────────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
