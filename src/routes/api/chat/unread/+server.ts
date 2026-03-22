import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ count: 0 }, { status: 401 });

	const count = await prisma.message.count({
		where: { receiverId: locals.user.id, read: false }
	});

	return json({ count });
};
