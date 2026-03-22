import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Не авторизован' }, { status: 401 });
	}

	try {
		const { phone } = await request.json();

		await prisma.user.update({
			where: { id: locals.user.id },
			data: { phone: phone || null }
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error updating profile:', error);
		return json({ success: false, error: 'Ошибка обновления профиля' }, { status: 500 });
	}
};
