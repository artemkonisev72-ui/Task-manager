import prisma from '$lib/server/prisma';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	await parent(); // ensures user is loaded
	const board = await prisma.board.findUnique({
		where: { id: params.id },
		include: {
			columns: {
				orderBy: { order: 'asc' },
				include: {
					tasks: {
						orderBy: { order: 'asc' },
						include: { assignee: true, tags: true }
					}
				}
			}
		}
	});

	if (!board) throw error(404, 'Доска не найдена');

	const users = await prisma.user.findMany({
		select: { id: true, email: true, role: true }
	});

	return { board, users };
};

export const actions: Actions = {
	createTask: async ({ request, locals }) => {
		if (locals.user?.role === 'EXECUTOR') return fail(403, { error: 'Недостаточно прав' });
		const data = await request.formData();
		const title = data.get('title') as string;
		const columnId = data.get('columnId') as string;
		if (!title || !columnId) return fail(400, { missing: true });

		await prisma.task.create({
			data: {
				title,
				columnId,
				assigneeId: locals.user?.id
			}
		});
	},
	moveTask: async ({ request }) => {
		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		const columnId = data.get('columnId') as string;
		if (!taskId || !columnId) return fail(400, { missing: true });

		await prisma.task.update({
			where: { id: taskId },
			data: { columnId }
		});
	},
    deleteTask: async ({ request, locals }) => {
        if (locals.user?.role === 'EXECUTOR') return fail(403, { error: 'Недостаточно прав' });
        const data = await request.formData();
		const taskId = data.get('taskId') as string;
        if (!taskId) return fail(400, { missing: true });

        await prisma.task.delete({ where: { id: taskId } });
    }
};
