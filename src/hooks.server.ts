import type { Handle } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import bcrypt from 'bcryptjs';
import { startDailyPushCron } from '$lib/server/cron';

// Seed admin on first server start
let seeded = false;
async function ensureAdmin() {
    if (seeded) return;
    seeded = true;
    startDailyPushCron(); // Инициализация крона для рассылок
    const existing = await prisma.user.findUnique({ where: { login: 'admin' } });
    if (!existing) {
        const passwordHash = await bcrypt.hash('123456', 10);
        await prisma.user.create({
            data: { login: 'admin', passwordHash, role: 'ADMIN' }
        });
        console.log('[SEED] Admin user created (login: admin, password: 123456)');
    }
}

export const handle: Handle = async ({ event, resolve }) => {
    await ensureAdmin();

    const sessionId = event.cookies.get('session');

    if (!sessionId) {
        event.locals.user = null;
        return resolve(event);
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true }
    });

    if (session && session.expiresAt > new Date()) {
        event.locals.user = {
            id: session.user.id,
            login: session.user.login,
            role: session.user.role,
            phone: session.user.phone
        };
    } else {
        event.locals.user = null;
        if (session) {
            await prisma.session.delete({ where: { id: sessionId } });
        }
        event.cookies.delete('session', { path: '/' });
    }

    return resolve(event);
};
