import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

// Replace these with your actual IPC bridge fns:
import { enrollChallenge, enrollProof } from '../electron/ipc/bridge';

export default fp(async function enrollRoutes(fastify: FastifyInstance) {
  fastify.get('/api/enroll/challenge', async () => {
    // Should return { nonce, payload, expiresAt, ... }
    return await enrollChallenge();
  });

  fastify.post('/api/enroll/proof', async (req, reply) => {
    const body = req.body as { nonce?: string; proof?: string; device?: any };
    if (!body?.nonce || !body?.proof) return reply.code(400).send({ error: 'nonce and proof required' });
    const res = await enrollProof(body);
    return reply.code(200).send(res); // e.g., { deviceId, token }
  });
});
