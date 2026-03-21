import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	if (!locals.user || locals.user.role !== 'EXECUTOR') {
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
				userId: locals.user.id
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
		await prisma.taskAssignment.update({
			where: { id: assignment.id },
			data: { status: 'ACCEPTED' }
		});
		return json({ success: true, status: 'ACCEPTED' });
	}

	if (action === 'REJECT') {
		await prisma.$transaction(async (tx) => {
			await tx.taskAssignment.update({
				where: { id: assignment.id },
				data: { status: 'REJECTED' }
			});

			const managers = await tx.user.findMany({
				where: { role: { in: ['MANAGER', 'ADMIN'] } }
			});

			if (managers.length > 0) {
				await tx.notification.createMany({
					data: managers.map(mgr => ({
						userId: mgr.id,
						title: 'Отказ от заявки',
						message: `Исполнитель ${locals.user.login} отклонил заявку №${assignment.task.number}.`
					}))
				});
			}
		});

		return json({ success: true, status: 'REJECTED' });
	}
}
