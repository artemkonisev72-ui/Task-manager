import prisma from '$lib/server/prisma';

export async function cleanupExpiredAssignments() {
	try {
		const expired = await prisma.taskAssignment.findMany({
			where: { 
				status: 'PENDING', 
				autoRejectAt: { lt: new Date() } 
			},
			include: { task: true, user: true }
		});

		if (expired.length === 0) return;

		const managers = await prisma.user.findMany({
			where: { role: { in: ['MANAGER', 'ADMIN'] } }
		});

		for (const exp of expired) {
			await prisma.taskAssignment.update({
				where: { id: exp.id },
				data: { status: 'REJECTED' }
			});

			if (managers.length > 0) {
				await prisma.notification.createMany({
					data: managers.map(mgr => ({
						userId: mgr.id,
						title: 'Автоматический отказ (Таймаут)',
						message: `Исполнитель ${exp.user.login} автоматически снят с заявки №${exp.task.number} по истечении времени.`
					}))
				});
			}
		}
	} catch (e) {
		console.error('Failed to cleanup expired assignments', e);
	}
}
