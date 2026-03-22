import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { cleanupExpiredAssignments } from '$lib/server/cleanup';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	let pendingAssignments = [];
	let notifications = [];

	if (locals.user.role === 'EXECUTOR' || locals.user.role === 'MANAGER' || locals.user.role === 'ADMIN') {
		await cleanupExpiredAssignments();
	}

	if (locals.user.role === 'EXECUTOR') {
		pendingAssignments = await prisma.taskAssignment.findMany({
			where: { userId: locals.user.id, status: 'PENDING' },
			include: { task: true },
			orderBy: { assignedAt: 'asc' }
		});
	} else if (locals.user.role === 'MANAGER' || locals.user.role === 'ADMIN') {
		notifications = await prisma.notification.findMany({
			where: { userId: locals.user.id },
			orderBy: { createdAt: 'desc' },
			take: 20
		});
	}

	const unreadMessagesCount = await prisma.message.count({
		where: { receiverId: locals.user.id, read: false }
	});

	return {
		user: locals.user,
		pendingAssignments,
		notifications,
		unreadMessagesCount
	};
};
