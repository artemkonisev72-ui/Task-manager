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

			if (!email || !password) { return fail(400, { email, missing: true }); }

			const user = await prisma.user.findUnique({ where: { email } });
			if (!user) { return fail(400, { email, incorrect: true }); }

			const valid = await bcrypt.compare(password, user.passwordHash);
			if (!valid) { return fail(400, { email, incorrect: true }); }

			await setSession(user.id, cookies);
		} catch (e: any) {
			console.error("LOGIN ERROR:", e);
			return fail(500, { error: e.message || String(e) });
		}
		throw redirect(303, '/logistics');
	}
};
