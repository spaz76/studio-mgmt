/**
 * Seed: creates a default studio, owner, and example records for all models.
 * Run: npm run db:seed
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({
  connectionString: process.env["DATABASE_URL"]!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_OWNER_EMAIL ?? "owner@studio.local";
  const password = process.env.SEED_OWNER_PASSWORD ?? "changeme123";
  const studioName = process.env.SEED_STUDIO_NAME ?? "Atnachta Studio";
  const studioSlug = process.env.SEED_STUDIO_SLUG ?? "atnachta";

  // ── Studio ──────────────────────────────────────────────────────────────
  const studio = await prisma.studio.upsert({
    where: { slug: studioSlug },
    create: {
      name: studioName,
      publicName: studioName,
      slug: studioSlug,
      planType: "FREE",
      contactEmail: "hello@atnachta.co.il",
      contactPhone: "050-1234567",
    },
    update: {},
  });

  // ── Owner user ───────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);
  const owner = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Studio Owner",
      passwordHash,
    },
    update: {},
  });

  await prisma.studioMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: owner.id } },
    create: {
      studioId: studio.id,
      userId: owner.id,
      role: "OWNER",
      isActive: true,
      joinedAt: new Date(),
    },
    update: { role: "OWNER" },
  });

  // ── Operator user ────────────────────────────────────────────────────────
  const operatorEmail = "operator@studio.local";
  const operator = await prisma.user.upsert({
    where: { email: operatorEmail },
    create: {
      email: operatorEmail,
      name: "Workshop Operator",
      passwordHash: await bcrypt.hash("operator123", 12),
    },
    update: {},
  });

  await prisma.studioMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: operator.id } },
    create: {
      studioId: studio.id,
      userId: operator.id,
      role: "OPERATOR",
      isActive: true,
      joinedAt: new Date(),
    },
    update: { role: "OPERATOR" },
  });

  // ── Customers ────────────────────────────────────────────────────────────
  const customer1 = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    create: {
      id: "seed-customer-1",
      studioId: studio.id,
      name: "דנה כהן",
      email: "dana@example.com",
      phone: "054-1111111",
    },
    update: {},
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: "seed-customer-2" },
    create: {
      id: "seed-customer-2",
      studioId: studio.id,
      name: "יוסי לוי",
      email: "yossi@example.com",
      phone: "052-2222222",
    },
    update: {},
  });

  // ── Workshop Template ────────────────────────────────────────────────────
  const template = await prisma.workshopTemplate.upsert({
    where: { id: "seed-template-1" },
    create: {
      id: "seed-template-1",
      studioId: studio.id,
      name: "סדנת חרס למתחילים",
      description: "סדנה מבואית לאמנות הקדרות — ניסוח ועיצוב בחומר",
      durationMinutes: 120,
      minParticipants: 4,
      maxParticipants: 10,
      defaultPrice: 180,
      tags: ["מתחילים", "חרס", "קדרות"],
    },
    update: {},
  });

  // ── Workshop Events ──────────────────────────────────────────────────────
  const eventDate1 = new Date("2026-04-10T10:00:00.000Z");
  const eventDate1End = new Date("2026-04-10T12:00:00.000Z");

  const event1 = await prisma.workshopEvent.upsert({
    where: { id: "seed-event-1" },
    create: {
      id: "seed-event-1",
      studioId: studio.id,
      templateId: template.id,
      title: "סדנת חרס — אפריל",
      description: "סדנה פתוחה לציבור הרחב",
      startsAt: eventDate1,
      endsAt: eventDate1End,
      status: "open",
      minParticipants: 4,
      maxParticipants: 10,
      price: 180,
      location: "הסטודיו, תל אביב",
      createdById: owner.id,
    },
    update: {},
  });

  const eventDate2 = new Date("2026-04-24T16:00:00.000Z");
  const eventDate2End = new Date("2026-04-24T18:00:00.000Z");

  const event2 = await prisma.workshopEvent.upsert({
    where: { id: "seed-event-2" },
    create: {
      id: "seed-event-2",
      studioId: studio.id,
      templateId: template.id,
      title: "סדנת חרס — ערב",
      description: "סדנה ערבית למבוגרים",
      startsAt: eventDate2,
      endsAt: eventDate2End,
      status: "confirmed",
      minParticipants: 4,
      maxParticipants: 8,
      price: 200,
      location: "הסטודיו, תל אביב",
      createdById: owner.id,
    },
    update: {},
  });

  // ── Bookings ─────────────────────────────────────────────────────────────
  const booking1 = await prisma.booking.upsert({
    where: { id: "seed-booking-1" },
    create: {
      id: "seed-booking-1",
      studioId: studio.id,
      workshopEventId: event1.id,
      customerId: customer1.id,
      participantCount: 2,
      status: "confirmed",
      publicToken: "tok-booking-1",
    },
    update: {},
  });

  const booking2 = await prisma.booking.upsert({
    where: { id: "seed-booking-2" },
    create: {
      id: "seed-booking-2",
      studioId: studio.id,
      workshopEventId: event2.id,
      customerId: customer2.id,
      participantCount: 1,
      status: "confirmed",
      publicToken: "tok-booking-2",
    },
    update: {},
  });

  // ── Payments ─────────────────────────────────────────────────────────────
  await prisma.payment.upsert({
    where: { id: "seed-payment-1" },
    create: {
      id: "seed-payment-1",
      studioId: studio.id,
      bookingId: booking1.id,
      amount: 360,
      status: "paid",
      paidAt: new Date("2026-04-01T08:00:00.000Z"),
    },
    update: {},
  });

  await prisma.payment.upsert({
    where: { id: "seed-payment-2" },
    create: {
      id: "seed-payment-2",
      studioId: studio.id,
      bookingId: booking2.id,
      amount: 200,
      status: "pending",
    },
    update: {},
  });

  // ── Supplier ─────────────────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-1" },
    create: {
      id: "seed-supplier-1",
      studioId: studio.id,
      name: "חרסנה בע״מ",
      contactName: "מיכל ברק",
      email: "michali@harsana.co.il",
      phone: "03-5556677",
    },
    update: {},
  });

  // ── Materials ────────────────────────────────────────────────────────────
  const clay = await prisma.material.upsert({
    where: { id: "seed-material-1" },
    create: {
      id: "seed-material-1",
      studioId: studio.id,
      name: "חרס לבן",
      description: "חרס לבן לשרפה ב-1260°C",
      unit: "ק\"ג",
      stockQuantity: 50,
      lowStockThreshold: 20,
      orangeThreshold: 30,
      redThreshold: 10,
    },
    update: {},
  });

  const glaze = await prisma.material.upsert({
    where: { id: "seed-material-2" },
    create: {
      id: "seed-material-2",
      studioId: studio.id,
      name: "גלייז שקוף",
      description: "גלייז שקוף לציפוי",
      unit: "ליטר",
      stockQuantity: 8,
      lowStockThreshold: 3,
      orangeThreshold: 6,
      redThreshold: 2,
    },
    update: {},
  });

  // ── MaterialSupplier links ───────────────────────────────────────────────
  await prisma.materialSupplier.upsert({
    where: { materialId_supplierId: { materialId: clay.id, supplierId: supplier.id } },
    create: {
      materialId: clay.id,
      supplierId: supplier.id,
      pricePerUnit: 12.5,
      isPreferred: true,
    },
    update: {},
  });

  await prisma.materialSupplier.upsert({
    where: { materialId_supplierId: { materialId: glaze.id, supplierId: supplier.id } },
    create: {
      materialId: glaze.id,
      supplierId: supplier.id,
      pricePerUnit: 45,
      isPreferred: true,
    },
    update: {},
  });

  // ── Material Stock Logs ──────────────────────────────────────────────────
  await prisma.materialStockLog.createMany({
    data: [
      {
        studioId: studio.id,
        materialId: clay.id,
        action: "purchase",
        quantity: 50,
        notes: "רכישה ראשונית",
        performedById: owner.id,
      },
      {
        studioId: studio.id,
        materialId: clay.id,
        action: "consumption",
        quantity: -5,
        notes: "צריכה בסדנת אפריל",
        performedById: operator.id,
      },
      {
        studioId: studio.id,
        materialId: glaze.id,
        action: "purchase",
        quantity: 8,
        notes: "רכישה ראשונית",
        performedById: owner.id,
      },
    ],
    skipDuplicates: false,
  });

  // ── Products ─────────────────────────────────────────────────────────────
  const product1 = await prisma.product.upsert({
    where: { studioId_skuBase: { studioId: studio.id, skuBase: "MUG" } },
    create: {
      studioId: studio.id,
      name: "ספל קרמיקה",
      description: "ספל קרמיקה עשוי בעבודת יד",
      skuBase: "MUG",
      category: "כלי שתייה",
      isSeasonal: false,
      isActive: true,
    },
    update: {},
  });

  const product2 = await prisma.product.upsert({
    where: { studioId_skuBase: { studioId: studio.id, skuBase: "BOWL-HANUKKAH" } },
    create: {
      studioId: studio.id,
      name: "קערת חנוכה",
      description: "קערת קרמיקה לחנוכה — מהדורה מוגבלת",
      skuBase: "BOWL-HANUKKAH",
      category: "כלי שולחן",
      isSeasonal: true,
      seasonStart: 11,
      seasonEnd: 12,
      isActive: true,
    },
    update: {},
  });

  // ── Product Variants ─────────────────────────────────────────────────────
  await prisma.productVariant.upsert({
    where: { sku: "MUG-WHT" },
    create: {
      studioId: studio.id,
      productId: product1.id,
      name: "לבן",
      sku: "MUG-WHT",
      price: 85,
      stockQuantity: 12,
      lowStockThreshold: 3,
    },
    update: {},
  });

  await prisma.productVariant.upsert({
    where: { sku: "MUG-BLU" },
    create: {
      studioId: studio.id,
      productId: product1.id,
      name: "כחול",
      sku: "MUG-BLU",
      price: 90,
      stockQuantity: 7,
      lowStockThreshold: 3,
    },
    update: {},
  });

  await prisma.productVariant.upsert({
    where: { sku: "BOWL-HANUKKAH-STD" },
    create: {
      studioId: studio.id,
      productId: product2.id,
      name: "סטנדרטי",
      sku: "BOWL-HANUKKAH-STD",
      price: 120,
      stockQuantity: 5,
      lowStockThreshold: 2,
    },
    update: {},
  });

  // ── Reminders ────────────────────────────────────────────────────────────
  await prisma.reminder.upsert({
    where: { id: "seed-reminder-1" },
    create: {
      id: "seed-reminder-1",
      studioId: studio.id,
      title: "לשריין קדר לסדנת אפריל",
      type: "workshop",
      status: "open",
      dueAt: new Date("2026-04-05T09:00:00.000Z"),
      relatedWorkshopEventId: event1.id,
      createdById: owner.id,
    },
    update: {},
  });

  await prisma.reminder.upsert({
    where: { id: "seed-reminder-2" },
    create: {
      id: "seed-reminder-2",
      studioId: studio.id,
      title: "הזמנת חרס — מלאי נמוך",
      type: "material",
      status: "open",
      relatedMaterialId: clay.id,
      createdById: owner.id,
    },
    update: {},
  });

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`✓ Studio:      ${studio.name} (${studio.slug})`);
  console.log(`✓ Owner:       ${owner.email}  /  password: ${password}`);
  console.log(`✓ Operator:    ${operatorEmail}  /  password: operator123`);
  console.log(`✓ Customers:   ${customer1.name}, ${customer2.name}`);
  console.log(`✓ Template:    ${template.name}`);
  console.log(`✓ Events:      ${event1.title}, ${event2.title}`);
  console.log(`✓ Bookings:    2`);
  console.log(`✓ Payments:    2`);
  console.log(`✓ Supplier:    ${supplier.name}`);
  console.log(`✓ Materials:   ${clay.name}, ${glaze.name}`);
  console.log(`✓ Products:    ${product1.name}, ${product2.name}`);
  console.log(`✓ Reminders:   2`);
  console.log("");
  console.log("Done. Change passwords after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
