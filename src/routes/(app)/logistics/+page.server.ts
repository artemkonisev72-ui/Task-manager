import prisma from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sendPushNotification } from '$lib/server/push';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (user.role === 'EXECUTOR') {
		throw redirect(303, '/requests');
	}

	const executorsRaw = await prisma.user.findMany({
		where: { role: 'EXECUTOR' },
		include: { assignments: { include: { task: true }, orderBy: { task: { date: 'desc' } } } }
	});
	const executors = executorsRaw.map(e => ({
		id: e.id, login: e.login, role: e.role,
		logisticsTasks: e.assignments.map(a => ({ ...a.task, assignmentStatus: a.status }))
	}));

	const unassignedTasks = await prisma.logisticsTask.findMany({
		where: { assignments: { none: {} } },
		orderBy: { date: 'desc' }
	});

	return { executors, unassignedTasks, isManager: true };
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

		if (!number || !dateStr) {
			return fail(400, { error: 'Номер и дата обязательны' });
		}

		const dateObj = new Date(dateStr);
		
		// If task starts in the future, autoRejectTime = time_until_start / 12
		const diffMs = dateObj.getTime() - Date.now();
		const autoRejectAt = diffMs > 0 ? new Date(Date.now() + (diffMs / 12)) : new Date(Date.now() + 1000 * 60 * 60);

		await prisma.logisticsTask.create({
			data: {
				number,
				date: dateObj,
				timeStart,
				timeEnd,
				address,
				logistics: logistics || '',
				dealContent: dealContent || '',
				comment,
				checklist,
				amount: amountStr ? parseFloat(amountStr) : 0,
				assignments: {
					create: executorIds.map(id => ({ userId: id, autoRejectAt }))
				}
			}
		});

		// Trigger notifications asynchronously
		executorIds.forEach(executorId => {
			sendPushNotification(executorId, 'Новая заявка', `Вам назначена заявка №${number}`);
		});
	},
	deleteTask: async ({ request, locals }) => {
		if (locals.user?.role !== 'ADMIN' && locals.user?.role !== 'MANAGER') {
			return fail(403, { error: 'Недостаточно прав' });
		}

		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		if (!taskId) return fail(400, { error: 'ID заявки не указан' });

		await prisma.logisticsTask.delete({ where: { id: taskId } });
	},
	updateTask: async ({ request, locals }) => {
		if (locals.user?.role !== 'ADMIN' && locals.user?.role !== 'MANAGER') {
			return fail(403, { error: 'Недостаточно прав' });
		}

		const data = await request.formData();
		const taskId = data.get('taskId') as string;
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
		const executorIds = data.getAll('executorIds') as string[];

		if (!taskId || !number || !dateStr) {
			return fail(400, { error: 'ID, номер и дата обязательны' });
		}

		const dateObj = new Date(dateStr);
		const diffMs = dateObj.getTime() - Date.now();
		const autoRejectAt = diffMs > 0 ? new Date(Date.now() + (diffMs / 12)) : new Date(Date.now() + 1000 * 60 * 60);

		const existingAssignments = await prisma.taskAssignment.findMany({ where: { taskId } });
		const existingUserIds = existingAssignments.map(a => a.userId);

		const toAdd = executorIds.filter(id => !existingUserIds.includes(id));
		const toRemove = existingUserIds.filter(id => !executorIds.includes(id));

		if (toRemove.length > 0) {
			await prisma.taskAssignment.deleteMany({ where: { taskId, userId: { in: toRemove } } });
		}
		if (toAdd.length > 0) {
			await prisma.taskAssignment.createMany({
				data: toAdd.map(userId => ({ taskId, userId, autoRejectAt }))
			});
		}

		await prisma.logisticsTask.update({
			where: { id: taskId },
			data: {
				number,
				date: dateObj,
				timeStart,
				timeEnd,
				address,
				logistics: logistics || '',
				dealContent: dealContent || '',
				comment,
				checklist,
				amount: amountStr ? parseFloat(amountStr) : 0
			}
		});

		// Push to newly added executors
		toAdd.forEach(executorId => {
			sendPushNotification(executorId, 'Новая заявка', `Вам назначена заявка №${number}`);
		});
	}
};
