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
		executors = await prisma.user.findMany({
			where: { role: 'EXECUTOR' },
			select: { id: true, login: true }
		});
	}

	return { tasks, executors, isManager: !isExecutor };
};
