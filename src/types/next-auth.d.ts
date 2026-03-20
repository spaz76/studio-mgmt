import type { Role } from "@/generated/prisma";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      memberships: {
        studioId: string;
        role: Role;
        studioName: string;
        studioSlug: string;
      }[];
    };
  }
}
