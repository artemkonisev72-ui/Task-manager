import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const partnerId = url.searchParams.get('partnerId');
	const since = url.searchParams.get('since');

	if (!partnerId || !since) return json({ messages: [] });

	const newMessages = await prisma.message.findMany({
		where: {
			OR: [
				{ senderId: locals.user.id, receiverId: partnerId },
				{ senderId: partnerId, receiverId: locals.user.id }
			],
			createdAt: { gt: new Date(since) }
		},
		orderBy: { createdAt: 'asc' }
	});

	// Mark new incoming messages as read instantly
	const unreadIncoming = newMessages.filter(m => m.receiverId === locals.user.id && !m.read);
	if (unreadIncoming.length > 0) {
		await prisma.message.updateMany({
			where: {
				id: { in: unreadIncoming.map(m => m.id) }
			},
			data: { read: true }
		});
	}

	return json({ messages: newMessages });
};
