import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import prisma from '$lib/server/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const documents = await prisma.document.findMany({
		orderBy: { createdAt: 'desc' },
		include: { uploader: { select: { login: true } } }
	});

	return { documents };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Не авторизован' });
		if (locals.user.role === 'EXECUTOR') return fail(403, { error: 'Нет прав' });

		const formData = await request.formData();
		const file = formData.get('file') as File;
		
		if (!file || file.size === 0) {
			return fail(400, { error: 'Файл не выбран' });
		}
		
		if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
			return fail(400, { error: 'Только PDF файлы разрешены' });
		}

		// Save the file to a robust external disk directory mapped locally
		const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
		await fs.mkdir(uploadDir, { recursive: true });

		const buffer = Buffer.from(await file.arrayBuffer());
		const fileId = crypto.randomUUID();
		const filePath = path.join(uploadDir, `${fileId}.pdf`);

		await fs.writeFile(filePath, buffer);

		await prisma.document.create({
			data: {
				id: fileId,
				name: file.name,
				path: filePath,
				uploaderId: locals.user.id
			}
		});

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Не авторизован' });
		if (locals.user.role === 'EXECUTOR') return fail(403, { error: 'Нет прав' });

		const data = await request.formData();
		const id = data.get('id') as string;

		const document = await prisma.document.findUnique({ where: { id } });
		if (!document) return fail(404, { error: 'Документ не найден' });

		try {
			await fs.unlink(document.path);
		} catch (e) {
			console.error('Failed to delete file from disk:', e);
		}

		await prisma.document.delete({ where: { id } });

		return { success: true };
	}
};
