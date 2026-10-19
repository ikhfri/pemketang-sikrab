declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				nim: string;
				name: string;
				role: 'VOTER' | 'ADMIN';
				hasVoted: boolean;
				expiresAt: Date;
			} | null;
		}
	}
}

export {};