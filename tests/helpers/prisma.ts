/**
 * Test-only Prisma client — uses @prisma/adapter-pg for standard TCP
 * connection to local or Docker Postgres instance.
 *
 * DATABASE_URL must point to the test database.
 */

import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

let _client: PrismaClient | undefined;

export function getTestPrisma(): PrismaClient {
  if (!_client) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    _client = new PrismaClient({
      adapter,
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
