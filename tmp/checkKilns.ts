import { prisma } from "@/lib/prisma";

async function main() {
  const studios = await prisma.studio.findMany({
    select: {
      id: true,
      name: true,
      kilns: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });

  for (const studio of studios) {
    console.log(`Studio ${studio.name} (${studio.id}) -> ${studio.kilns.length} kilns`);
    for (const kiln of studio.kilns) {
      console.log(`  - ${kiln.id}: ${kiln.name}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
