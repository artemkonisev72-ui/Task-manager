import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedAdmin() {
    const existing = await prisma.user.findUnique({ where: { login: 'admin' } });
    if (!existing) {
        const passwordHash = await bcrypt.hash('123456', 10);
        await prisma.user.create({
            data: {
                login: 'admin',
                passwordHash,
                role: 'ADMIN'
            }
        });
        console.log('[SEED] Admin user created (login: admin, password: 123456)');
    }
}

// Run directly via `npx tsx prisma/seed.ts`
seedAdmin()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
