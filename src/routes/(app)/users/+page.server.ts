import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import prisma from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	const users = await prisma.user.findMany({
		orderBy: { createdAt: 'desc' },
		select: { id: true, login: true, role: true, phone: true, createdAt: true }
	});

	return { users };
};

export const actions: Actions = {
	toggleRole: async ({ request, locals }) => {
		if (locals.user?.role !== 'ADMIN') {
			return fail(403, { error: 'Недостаточно прав' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;

		if (!targetUserId) return fail(400, { error: 'Укажите ID пользователя' });
		if (targetUserId === locals.user?.id) return fail(400, { error: 'Нельзя изменить собственную роль' });

		const targetUser = await prisma.user.findUnique({
			where: { id: targetUserId }
		});

		if (!targetUser) return fail(404, { error: 'Пользователь не найден' });
		if (targetUser.role === 'ADMIN') return fail(400, { error: 'Нельзя изменять статус администратора' });

		const newRole = targetUser.role === 'MANAGER' ? 'EXECUTOR' : 'MANAGER';

		await prisma.user.update({
			where: { id: targetUserId },
			data: { role: newRole }
		});
	},
	createUser: async ({ request, locals }) => {
		if (locals.user?.role !== 'ADMIN' && locals.user?.role !== 'MANAGER') {
			return fail(403, { error: 'Недостаточно прав' });
		}

		const data = await request.formData();
		const login = data.get('login') as string;
		const password = data.get('password') as string;
		const role = data.get('role') as string;

		if (!login || !password || password.length < 6) {
			return fail(400, { error: 'Логин и пароль (мин. 6 символов) обязательны' });
		}

		if (locals.user?.role === 'MANAGER' && role !== 'EXECUTOR') {
			return fail(403, { error: 'Менеджер может создавать только исполнителей' });
		}

		if (role === 'ADMIN') {
			return fail(403, { error: 'Нельзя создавать администраторов' });
		}

		const existing = await prisma.user.findUnique({ where: { login } });
		if (existing) {
			return fail(400, { error: 'Пользователь с таким логином уже существует' });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		await prisma.user.create({
			data: { login, passwordHash, role: role as 'EXECUTOR' | 'MANAGER' }
		});
	},
	deleteUser: async ({ request, locals }) => {
		if (locals.user?.role !== 'ADMIN') {
			return fail(403, { error: 'Недостаточно прав' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;

		if (!targetUserId) return fail(400, { error: 'Укажите ID пользователя' });
		if (targetUserId === locals.user?.id) return fail(400, { error: 'Нельзя удалить собственный аккаунт' });

		const targetUser = await prisma.user.findUnique({
			where: { id: targetUserId }
		});

		if (!targetUser) return fail(404, { error: 'Пользователь не найден' });
		if (targetUser.role === 'ADMIN') return fail(400, { error: 'Нельзя удалять других администраторов' });

		await prisma.user.delete({
			where: { id: targetUserId }
		});
	}
};
