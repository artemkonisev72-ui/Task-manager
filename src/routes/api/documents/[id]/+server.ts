import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import fs from 'fs';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const document = await prisma.document.findUnique({
		where: { id: params.id }
	});

	if (!document) throw error(404, 'Document not found in database');

	if (!fs.existsSync(document.path)) {
		console.error(`Document file missing from disk: ${document.path}`);
		throw error(404, 'File missing from disk');
	}

	const stream = fs.createReadStream(document.path);
	
	const readableStream = new ReadableStream({
		start(controller) {
			stream.on('data', (chunk) => controller.enqueue(chunk));
			stream.on('end', () => controller.close());
			stream.on('error', (err) => controller.error(err));
		},
		cancel() {
			stream.destroy();
		}
	});

	return new Response(readableStream, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="${encodeURIComponent(document.name)}"`
		}
	});
};
