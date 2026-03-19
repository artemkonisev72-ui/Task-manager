import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	await parent(); // ensures user logic loads
	const boards = await prisma.board.findMany({
		orderBy: { createdAt: 'desc' },
		include: { _count: { select: { columns: true } } }
	});
	return { boards };
};

export const actions: Actions = {
	createBoard: async ({ request, locals }) => {
		if (locals.user?.role === 'EXECUTOR') {
			return fail(403, { error: 'Недостаточно прав' });
		}
		
		const data = await request.formData();
		const title = data.get('title') as string;
		
		if (!title) return fail(400, { missing: true });

		// Make standard columns
		const board = await prisma.board.create({
			data: { 
				title,
				columns: {
					create: [
						{ title: 'К выполнению', order: 0 },
						{ title: 'В процессе', order: 1 },
						{ title: 'Готово', order: 2 }
					]
				} 
			}
		});
	},
	deleteBoard: async ({ request, locals }) => {
		if (locals.user?.role !== 'ADMIN' && locals.user?.role !== 'MANAGER') {
			return fail(403, { error: 'Недостаточно прав для удаления' });
		}
		
		const data = await request.formData();
		const boardId = data.get('boardId') as string;
		
		if (!boardId) return fail(400, { error: 'ID доски не указан' });

		await prisma.board.delete({
			where: { id: boardId }
		});
	}
};
