/**
 * Test-only Prisma client — uses standard TCP connection (no Neon WebSocket
 * adapter) so it works against a local or Docker Postgres instance.
 *
 * DATABASE_URL must point to the test database.
 */

import { PrismaClient } from "../../src/generated/prisma";

let _client: PrismaClient | undefined;

export function getTestPrisma(): PrismaClient {
  if (!_client) {
    _client = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
      log: process.env.DEBUG_PRISMA ? ["query", "error"] : ["error"],
    });
  }
  return _client;
}

export async function disconnectTestPrisma(): Promise<void> {
  if (_client) {
    await _client.$disconnect();
    _client = undefined;
  }
}
