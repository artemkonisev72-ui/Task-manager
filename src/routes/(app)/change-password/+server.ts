import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const data = await request.json();
    const { oldPassword, newPassword } = data;

    if (!oldPassword || !newPassword || newPassword.length < 6) {
        return json({ error: 'Новый пароль должен быть не менее 6 символов' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: locals.user.id } });
    if (!user) {
        return json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
        return json({ error: 'Неверный текущий пароль' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: locals.user.id },
        data: { passwordHash }
    });

    return json({ success: true });
};
