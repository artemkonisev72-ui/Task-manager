import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const isExecutor = user.role === 'EXECUTOR';

	const tasks = await prisma.logisticsTask.findMany({
		where: isExecutor ? { executors: { some: { id: user.id } } } : undefined,
		orderBy: { date: 'asc' },
		include: {
			executors: {
				select: { id: true, login: true }
			}
		}
	});

	let executors: any[] = [];
	if (!isExecutor) {
		executors = await prisma.user.findMany({
			where: { role: 'EXECUTOR' },
			select: { id: true, login: true }
		});
	}

	return { tasks, executors, isManager: !isExecutor };
};
