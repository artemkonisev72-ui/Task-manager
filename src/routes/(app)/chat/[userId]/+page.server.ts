import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (locals.user.role === 'ADMIN') throw redirect(303, '/requests');

	const partnerId = params.userId;
	if (locals.user.id === partnerId) throw redirect(303, '/chat');

	const partner = await prisma.user.findUnique({
		where: { id: partnerId },
		select: { id: true, login: true, role: true }
	});

	if (!partner) throw redirect(303, '/chat');

	// Block executors from chatting with admins
	if (locals.user.role === 'EXECUTOR' && partner.role === 'ADMIN') {
		throw redirect(303, '/chat');
	}

	// Mark all unread messages from partner as read
	await prisma.message.updateMany({
		where: { senderId: partnerId, receiverId: locals.user.id, read: false },
		data: { read: true }
	});

	const messages = await prisma.message.findMany({
		where: {
			OR: [
				{ senderId: locals.user.id, receiverId: partnerId },
				{ senderId: partnerId, receiverId: locals.user.id }
			]
		},
		orderBy: { createdAt: 'desc' },
		take: 50
	});

	messages.reverse(); // chronological

	return { partner, messages };
};

import { sendPushNotification } from '$lib/server/push';

export const actions: Actions = {
	sendMessage: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { error: 'Не авторизован' });
		const data = await request.formData();
		const content = data.get('content') as string;
		if (!content || !content.trim()) return fail(400, { error: 'Пустое сообщение' });

		const recipient = await prisma.user.findUnique({
			where: { id: params.userId },
			select: { role: true }
		});

		await prisma.message.create({
			data: {
				senderId: locals.user.id,
				receiverId: params.userId,
				content: content.trim()
			}
		});

		// Trigger push notification if manager/admin sends to executor
		if (
			recipient?.role === 'EXECUTOR' &&
			(locals.user.role === 'MANAGER' || locals.user.role === 'ADMIN')
		) {
			const body = content.length > 50 ? content.substring(0, 50) + '...' : content;
			await sendPushNotification(params.userId, 'Новое сообщение', body);
		}
	}
};
