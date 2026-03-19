import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMIN') {
		throw redirect(303, '/boards');
	}

	const users = await prisma.user.findMany({
		orderBy: { createdAt: 'desc' },
		select: { id: true, email: true, role: true, createdAt: true }
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
	}
};
