import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'nestormachado70@gmail.com' },
    update: {},
    create: {
      email: 'nestormachado70@gmail.com',
      name: 'Administrador',
      role: 'ADMIN',
    },
  })
  console.log('Seed: admin user ensured')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
