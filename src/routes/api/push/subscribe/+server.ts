import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const subscription = await request.json();

	if (!subscription || !subscription.endpoint || !subscription.keys) {
		return json({ error: 'Invalid subscription data' }, { status: 400 });
	}

	await prisma.webPushSubscription.upsert({
		where: { userId: locals.user.id },
		update: {
			endpoint: subscription.endpoint,
			p256dh: subscription.keys.p256dh,
			auth: subscription.keys.auth
		},
		create: {
			userId: locals.user.id,
			endpoint: subscription.endpoint,
			p256dh: subscription.keys.p256dh,
			auth: subscription.keys.auth
		}
	});

	return json({ success: true });
}
