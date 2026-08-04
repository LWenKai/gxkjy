import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_INIT_USERNAME || 'admin';
  const password = process.env.ADMIN_INIT_PASSWORD || 'Guxin@2026';

  const existingAdmin = await prisma.adminUser.findUnique({
    where: {
      username,
    },
  });

  if (existingAdmin) {
    console.log(`admin user "${username}" already exists, skip seed`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.create({
    data: {
      username,
      passwordHash,
      realName: '超级管理员',
    },
  });

  console.log(`admin user "${username}" created`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
