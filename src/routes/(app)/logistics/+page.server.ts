import prisma from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (user.role === 'ADMIN' || user.role === 'MANAGER') {
		const executors = await prisma.user.findMany({
			where: { role: 'EXECUTOR' },
			include: {
				logisticsTasks: {
					orderBy: { date: 'desc' }
				}
			}
		});
		return { executors, isManager: true };
	} else {
		// EXECUTOR
		const tasks = await prisma.logisticsTask.findMany({
			where: {
				executors: {
					some: { id: user.id }
				}
			},
			orderBy: { date: 'desc' }
		});
		return { tasks, isManager: false };
	}
};

export const actions: Actions = {
	createTask: async ({ request, locals }) => {
		if (locals.user?.role !== 'ADMIN' && locals.user?.role !== 'MANAGER') {
			return fail(403, { error: 'Недостаточно прав' });
		}
		
		const data = await request.formData();
		const number = data.get('number') as string;
		const dateStr = data.get('date') as string;
		const timeStart = data.get('timeStart') as string;
		const timeEnd = data.get('timeEnd') as string;
		const address = data.get('address') as string;
		const logistics = data.get('logistics') as string;
		const dealContent = data.get('dealContent') as string;
		const comment = data.get('comment') as string;
		const checklist = data.get('checklist') as string;
		const amountStr = data.get('amount') as string;
		
		// executors[] handling
		const executorIds = data.getAll('executorIds') as string[];

		if (!number || !dateStr || !timeStart || !timeEnd || !address || !logistics || !dealContent || !amountStr || executorIds.length === 0) {
			return fail(400, { error: 'Заполните все обязательные поля и выберите хотя бы одного исполнителя' });
		}

		await prisma.logisticsTask.create({
			data: {
				number,
				date: new Date(dateStr),
				timeStart,
				timeEnd,
				address,
				logistics,
				dealContent,
				comment,
				checklist,
				amount: parseFloat(amountStr),
				executors: {
					connect: executorIds.map(id => ({ id }))
				}
			}
		});
	},
	deleteTask: async ({ request, locals }) => {
		if (locals.user?.role !== 'ADMIN' && locals.user?.role !== 'MANAGER') {
			return fail(403, { error: 'Недостаточно прав' });
		}

		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		if (!taskId) return fail(400, { error: 'ID задачи не указан' });

		await prisma.logisticsTask.delete({ where: { id: taskId } });
	}
};
