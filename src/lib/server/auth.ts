import prisma from './prisma';
import type { Cookies } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export async function setSession(userId: string, cookies: Cookies) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const session = await prisma.session.create({
        data: {
            userId,
            expiresAt
        }
    });

    cookies.set('session', session.id, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        expires: expiresAt,
        secure: process.env.NODE_ENV === 'production'
    });
}

export async function clearSession(cookies: Cookies) {
    const sessionId = cookies.get('session');
    if (sessionId) {
        await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    }
    cookies.delete('session', { path: '/' });
}
