import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { cleanupExpiredAssignments } from '$lib/server/cleanup';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await cleanupExpiredAssignments();

	let pendingAssignments: any[] = [];
	let notifications: any[] = [];

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

	return json({ pendingAssignments, notifications });
}
