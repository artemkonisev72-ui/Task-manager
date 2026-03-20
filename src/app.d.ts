declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				login: string;
				role: string;
			} | null;
		}
	}
}

export {};
