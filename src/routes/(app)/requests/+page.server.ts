import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const isExecutor = user.role === 'EXECUTOR';

	const tasksRaw = await prisma.logisticsTask.findMany({
		where: isExecutor ? { assignments: { some: { userId: user.id } } } : undefined,
		orderBy: { date: 'asc' },
		include: { assignments: { include: { user: { select: { id: true, login: true } } } } }
	});

	const tasks = tasksRaw.map((t: any) => ({
		...t,
		executors: t.assignments.map((a: any) => ({ ...a.user, status: a.status, paymentText: a.paymentText }))
	}));

	let executors: any[] = [];
	if (!isExecutor) {
		// @ts-ignore - level and _count exist in the DB schema but local prisma types aren't generated yet
		const executorsRaw = await prisma.user.findMany({
			where: { role: 'EXECUTOR' },
			select: { 
				id: true, login: true, level: true,
				_count: { select: { assignments: { where: { status: { in: ['PENDING', 'ACCEPTED'] } } } } }
			}
		});
		
		const levelWeight: Record<string, number> = { TOP: 3, PRO: 2, BEGINNER: 1 };
		
		executors = executorsRaw.map((e: any) => ({
			id: e.id,
			login: e.login,
			level: e.level,
			activeTasksCount: e._count.assignments
		})).sort((a: any, b: any) => {
			if (levelWeight[a.level] !== levelWeight[b.level]) {
				return levelWeight[b.level] - levelWeight[a.level]; // Descending level
			}
			return a.activeTasksCount - b.activeTasksCount; // Ascending active task count
		});
	}

	return { tasks, executors, isManager: !isExecutor };
};
