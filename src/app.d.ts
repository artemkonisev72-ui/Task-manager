declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				login: string;
				role: string;
				phone?: string | null;
			} | null;
		}
	}
}

export {};
