import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	const user = locals.user;
	if (!user || user.role !== 'EXECUTOR') {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const body = await request.json();
	const { taskId, action } = body;

	if (!taskId || (action !== 'ACCEPT' && action !== 'REJECT')) {
		return json({ error: 'Invalid Request Data' }, { status: 400 });
	}

	const assignment = await prisma.taskAssignment.findUnique({
		where: {
			taskId_userId: {
				taskId: taskId,
				userId: user.id
			}
		},
		include: {
			task: true
		}
	});

	if (!assignment || assignment.status !== 'PENDING') {
		return json({ error: 'Assignment not found or already answered' }, { status: 404 });
	}

	if (action === 'ACCEPT') {
		await prisma.$transaction(async (tx) => {
			await tx.taskAssignment.update({
				where: { id: assignment.id },
				data: { status: 'ACCEPTED' }
			});

			const managers = await tx.user.findMany({
				where: { role: { in: ['MANAGER', 'ADMIN'] } }
			});

			if (managers.length > 0) {
				await tx.notification.createMany({
					data: managers.map(mgr => ({
						userId: mgr.id,
						title: 'Принятие заявки',
						message: `Исполнитель ${user.login} принял заявку №${assignment.task.number}.`
					}))
				});
			}
		});

		return json({ success: true, status: 'ACCEPTED' });
	}

	if (action === 'REJECT') {
		await prisma.$transaction(async (tx) => {
			const managers = await tx.user.findMany({
				where: { role: { in: ['MANAGER', 'ADMIN'] } }
			});

			if (managers.length > 0) {
				await tx.notification.createMany({
					data: managers.map(mgr => ({
						userId: mgr.id,
						title: 'Отказ от заявки',
						message: `Исполнитель ${user.login} отклонил заявку №${assignment.task.number}.`
					}))
				});
			}

			// Delete assignment to detach user
			await tx.taskAssignment.delete({
				where: { id: assignment.id }
			});
		});

		return json({ success: true, status: 'REJECTED_AND_REMOVED' });
	}
}
