import type { PrismaClient } from "@/generated/prisma";

export type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryNode[];
};

export async function getCategoriesFlat(prisma: PrismaClient, studioId: string) {
  return prisma.category.findMany({
    where: { studioId },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
}

/** Returns a flat list with label showing hierarchy (e.g. "קרמיקה > גלזורות > אבקות") */
export function buildCategoryOptions(
  categories: { id: string; name: string; parentId: string | null }[]
): { value: string; label: string }[] {
  const map = new Map(categories.map((c) => [c.id, c]));

  function getLabel(id: string): string {
    const cat = map.get(id);
    if (!cat) return "";
    if (!cat.parentId) return cat.name;
    return `${getLabel(cat.parentId)} > ${cat.name}`;
  }

  return categories.map((c) => ({
    value: c.id,
    label: getLabel(c.id),
  }));
}
