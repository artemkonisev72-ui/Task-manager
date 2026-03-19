import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import bcrypt from 'bcryptjs';
import prisma from '$lib/server/prisma';
import { setSession } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		try {
			const data = await request.formData();
			const email = data.get('email') as string;
			const password = data.get('password') as string;

			if (!email || !password || password.length < 6) { return fail(400, { email, missing: true }); }

			const existingUser = await prisma.user.findUnique({ where: { email } });
			if (existingUser) { return fail(400, { email, exists: true }); }

			const passwordHash = await bcrypt.hash(password, 10);
			const role = email === 'admin@admin.com' ? 'ADMIN' : 'EXECUTOR';

			const user = await prisma.user.create({
				data: { email, passwordHash, role }
			});

			await setSession(user.id, cookies);
		} catch (e: any) {
			console.error("REGISTER ERROR:", e);
			return fail(500, { error: e.message || String(e) });
		}
		throw redirect(303, '/boards');
	}
};
