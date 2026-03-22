declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				login: string;
				role: string;
				phone?: string | null;
				email?: string | null;
			} | null;
		}
	}
}

export {};
