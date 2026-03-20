import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const tasks = await prisma.logisticsTask.findMany({
		orderBy: { date: 'asc' },
		include: {
			executors: {
				select: { id: true, login: true }
			}
		}
	});

	return { tasks };
};
