import type { Handle } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		include: { user: true }
	});

	if (session && session.expiresAt > new Date()) {
		event.locals.user = {
			id: session.user.id,
			email: session.user.email,
			role: session.user.role
		};
	} else {
		event.locals.user = null;
		if (session) {
			await prisma.session.delete({ where: { id: sessionId } });
		}
		event.cookies.delete('session', { path: '/' });
	}

	return resolve(event);
};
