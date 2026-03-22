import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	
	const isExecutor = locals.user.role === 'EXECUTOR';

	const users = await prisma.user.findMany({
		where: {
			role: isExecutor ? 'MANAGER' : 'EXECUTOR'
		},
		select: { id: true, login: true, role: true }
	});

	const unreadCountsRaw = await prisma.message.groupBy({
		by: ['senderId'],
		where: { receiverId: locals.user.id, read: false },
		_count: { _all: true }
	});

	const unreadMap: Record<string, number> = {};
	for (const row of unreadCountsRaw) {
		unreadMap[row.senderId] = row._count._all;
	}

	const contacts = users.map(u => ({
		...u,
		unreadCount: unreadMap[u.id] || 0
	}));

	contacts.sort((a, b) => {
		if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
		return a.login.localeCompare(b.login);
	});

	return { contacts };
};
