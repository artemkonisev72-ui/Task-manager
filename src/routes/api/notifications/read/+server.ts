import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export async function POST({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await prisma.notification.updateMany({
		where: { userId: locals.user.id, read: false },
		data: { read: true }
	});

	return json({ success: true });
}
