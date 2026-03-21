import webpush from 'web-push';
import prisma from '$lib/server/prisma';
import { VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '$env/static/private';
import { PUBLIC_VAPID_KEY } from '$env/static/public';

webpush.setVapidDetails(
	VAPID_SUBJECT,
	PUBLIC_VAPID_KEY,
	VAPID_PRIVATE_KEY
);

export async function sendPushNotification(userId: string, title: string, body: string) {
	try {
		const sub = await prisma.webPushSubscription.findUnique({ where: { userId } });
		if (!sub) return false;

		const pushSubscription = {
			endpoint: sub.endpoint,
			keys: {
				p256dh: sub.p256dh,
				auth: sub.auth
			}
		};

		const payload = JSON.stringify({ title, body });

		await webpush.sendNotification(pushSubscription, payload);
		return true;
	} catch (error: any) {
		console.error(`Error sending push notification to user ${userId}:`, error.message);
		if (error.statusCode === 410 || error.statusCode === 404) {
			// Subscription expired or invalid, remove it
			await prisma.webPushSubscription.delete({ where: { userId } });
		}
		return false;
	}
}
