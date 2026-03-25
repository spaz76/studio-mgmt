/**
 * Seed: creates a default studio, owner, and example records for all models.
 * Run: npm run db:seed
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env["DATABASE_URL"]!;
const useNeon =
  connectionString.includes("neon.tech") ||
  process.env.USE_NEON_ADAPTER === "true";

const adapter = useNeon
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });

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

  // ── Workshop Templates (one per type) ────────────────────────────────────
  const template = await prisma.workshopTemplate.upsert({
    where: { id: "seed-template-1" },
    create: {
      id: "seed-template-1",
      studioId: studio.id,
      name: "סדנת קרמיקה למתחילים",
      workshopType: "REGULAR",
      description: "סדנה מבואית לאמנות הקרמיקה — ניסוח ועיצוב בחומר. מתאים לכל גיל, ללא ניסיון קודם.",
      marketingText: "🏺 בואו לחוות את קסם הקרמיקה! סדנה ראשונה? הגעתם למקום הנכון. בואו ללכלך ידיים, לצחוק ולצאת עם יצירה משלכם.",
      internalNotes: "לדאוג לחרס לבן — 2 ק\"ג למשתתף. לוודא שהכבשן פנוי שבוע לאחר הסדנה.",
      registrationUrl: "https://atnachta.co.il/register",
      durationMinutes: 120,
      minParticipants: 4,
      maxParticipants: 10,
      defaultPrice: 180,
      tags: ["מתחילים", "קרמיקה", "חד-פעמי"],
      usageCount: 12,
    },
    update: {},
  });

  await prisma.workshopTemplate.upsert({
    where: { id: "seed-template-2" },
    create: {
      id: "seed-template-2",
      studioId: studio.id,
      name: "חוג קרמיקה שבועי",
      workshopType: "RECURRING",
      description: "חוג שבועי קבוע לעמקת הידע ופיתוח טכניקות קרמיקה. קבוצה קטנה ואינטימית.",
      marketingText: "🔄 מחפשים פעילות שבועית מרגיעה? הצטרפו לחוג הקרמיקה השבועי שלנו! קבוצה קטנה, אווירה נהדרת, קרמיקה מרתקת.",
      internalNotes: "לוודא שיש חומרים ל-8 שבועות קדימה. לתאם עם משתתפים קבועים בנוגע לחגים.",
      registrationUrl: "https://atnachta.co.il/register/weekly",
      durationMinutes: 90,
      minParticipants: 3,
      maxParticipants: 8,
      defaultPrice: 220,
      recurrenceFrequency: "WEEKLY",
      recurrenceDayOfWeek: 3, // Wednesday
      recurrenceStartTime: "18:00",
      recurrenceEndTime: "19:30",
      tags: ["חוג", "שבועי", "מתמשך"],
      usageCount: 5,
    },
    update: {},
  });

  await prisma.workshopTemplate.upsert({
    where: { id: "seed-template-3" },
    create: {
      id: "seed-template-3",
      studioId: studio.id,
      name: "קורס קרמיקה מתקדמים",
      workshopType: "CLASS",
      description: "קורס מובנה ל-12 מפגשים המיועד למי שיש לו ניסיון בסיסי ורוצה להתעמק בטכניקות מתקדמות.",
      marketingText: "📋 מוכנים לרמה הבאה? קורס הקרמיקה למתקדמים כולל 12 מפגשים מובנים — מסביבה מחלצת ועד גלייז מקצועי. מספר מקומות מוגבל!",
      internalNotes: "לצלם עבודות בתחילת ובסוף הקורס לתיק עבודות. להכין חומרי לימוד לכל מפגש.",
      registrationUrl: "https://atnachta.co.il/register/advanced",
      durationMinutes: 120,
      minParticipants: 4,
      maxParticipants: 8,
      defaultPrice: 350,
      totalSessions: 12,
      tags: ["מתקדמים", "קורס", "12 מפגשים"],
      usageCount: 3,
    },
    update: {},
  });

  await prisma.workshopTemplate.upsert({
    where: { id: "seed-template-4" },
    create: {
      id: "seed-template-4",
      studioId: studio.id,
      name: "סדנת צלחת פסח",
      workshopType: "SEASONAL",
      description: "סדנה עונתית ליצירת צלחת סדר מקרמיקה. מתנה מושלמת לפסח.",
      marketingText: "🌸 פסח מגיע — צרו צלחת סדר קרמיקה ביד שלכם! סדנה חגיגית ומשמחת לכל המשפחה. גם כמתנה — אין כמו זה.",
      internalNotes: "לפרסם 8 שבועות לפני הפסח. להזמין גלייז צבעוני מיוחד לפסח. לכתוב נוסחי הגדה בחרס — כן אפשרי!",
      registrationUrl: "https://atnachta.co.il/register/passover",
      durationMinutes: 150,
      minParticipants: 4,
      maxParticipants: 12,
      defaultPrice: 220,
      seasonStartMonth: 3,
      seasonEndMonth: 4,
      seasonPublishLeadDays: 56, // 8 weeks
      seasonPrepLeadDays: 28,    // 4 weeks
      seasonOpenRegistrationDays: 42,
      seasonCloseRegistrationDays: 7,
      seasonReminderDays: [56, 28, 14],
      tags: ["פסח", "עונתי", "חג"],
      usageCount: 8,
    },
    update: {},
  });

  await prisma.workshopTemplate.upsert({
    where: { id: "seed-template-5" },
    create: {
      id: "seed-template-5",
      studioId: studio.id,
      name: "יום הולדת בסטודיו",
      workshopType: "EVENT",
      description: "אירוע יום הולדת פרטי בסטודיו. כולל הנחיית סדנת קרמיקה, ציוד וכיבוד קל.",
      marketingText: "🎉 יום הולדת שלא תשכחו! הזמינו חוויה אישית ומיוחדת — סדנת קרמיקה פרטית לחברים ולמשפחה. כל אחד יוצא עם יצירה ביד.",
      internalNotes: "לשלוח תפריט מתנות ולאשר מספר משתתפים שבוע מראש. לבדוק אם יש אלרגיות למשתתפים.",
      registrationUrl: "https://atnachta.co.il/events/birthday",
      durationMinutes: 180,
      minParticipants: 8,
      maxParticipants: 20,
      defaultPrice: 2500,
      eventContactName: "",
      eventContactPhone: "",
      eventPricingModel: "FLAT",
      tags: ["יום הולדת", "אירוע פרטי"],
      usageCount: 15,
    },
    update: {},
  });

  await prisma.workshopTemplate.upsert({
    where: { id: "seed-template-6" },
    create: {
      id: "seed-template-6",
      studioId: studio.id,
      name: "סדנת הורה-ילד",
      workshopType: "PARENT_CHILD",
      description: "סדנת קרמיקה משותפת להורה וילד. יוצרים יחד, זוכרים לנצח.",
      marketingText: "👶 רגע איכות עם הילד שלך! סדנת קרמיקה לזוגות הורה-ילד — מעל גיל 5. תוצאה מוחשית ביד, ובלב.",
      internalNotes: "לוודא שהשולחנות בגובה מתאים לילדים. לדאוג לסינרים קטנים. להכין עיצובים פשוטים מותאמים לילדים.",
      registrationUrl: "https://atnachta.co.il/register/parent-child",
      durationMinutes: 90,
      minParticipants: 4,
      maxParticipants: 10,
      defaultPrice: 150,
      ageRangeMin: 5,
      ageRangeMax: 12,
      requiresAdultSupervision: true,
      tags: ["הורה-ילד", "משפחות", "ילדים"],
      usageCount: 6,
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

  // ── Categories (hierarchical) ─────────────────────────────────────────────
  // Ceramics top-level
  const catCeramics = await prisma.category.upsert({
    where: { id: "seed-cat-ceramics" },
    create: { id: "seed-cat-ceramics", studioId: studio.id, name: "קרמיקה" },
    update: {},
  });
  const catClay = await prisma.category.upsert({
    where: { id: "seed-cat-clay" },
    create: { id: "seed-cat-clay", studioId: studio.id, name: "חימר", parentId: catCeramics.id },
    update: {},
  });
  const catGlazes = await prisma.category.upsert({
    where: { id: "seed-cat-glazes" },
    create: { id: "seed-cat-glazes", studioId: studio.id, name: "גלזורות", parentId: catCeramics.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-glazes-powder" },
    create: { id: "seed-cat-glazes-powder", studioId: studio.id, name: "אבקות", parentId: catGlazes.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-glazes-liquid" },
    create: { id: "seed-cat-glazes-liquid", studioId: studio.id, name: "נוזלים", parentId: catGlazes.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-wonder-colors" },
    create: { id: "seed-cat-wonder-colors", studioId: studio.id, name: "צבעי פלא", parentId: catCeramics.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-engobes" },
    create: { id: "seed-cat-engobes", studioId: studio.id, name: "אנגובים", parentId: catCeramics.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-bisque" },
    create: { id: "seed-cat-bisque", studioId: studio.id, name: "ביסקים", parentId: catCeramics.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-pigments" },
    create: { id: "seed-cat-pigments", studioId: studio.id, name: "צובענים", parentId: catCeramics.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-sculpture-tools" },
    create: { id: "seed-cat-sculpture-tools", studioId: studio.id, name: "ציוד לפיסול", parentId: catCeramics.id },
    update: {},
  });
  // Painting top-level
  const catPainting = await prisma.category.upsert({
    where: { id: "seed-cat-painting" },
    create: { id: "seed-cat-painting", studioId: studio.id, name: "ציור" },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-acrylics" },
    create: { id: "seed-cat-acrylics", studioId: studio.id, name: "צבעי אקריל", parentId: catPainting.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-canvases" },
    create: { id: "seed-cat-canvases", studioId: studio.id, name: "קנבאסים", parentId: catPainting.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-brushes" },
    create: { id: "seed-cat-brushes", studioId: studio.id, name: "מכחולים", parentId: catPainting.id },
    update: {},
  });
  await prisma.category.upsert({
    where: { id: "seed-cat-pointers" },
    create: { id: "seed-cat-pointers", studioId: studio.id, name: "מנקדים", parentId: catPainting.id },
    update: {},
  });

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`✓ Studio:      ${studio.name} (${studio.slug})`);
  console.log(`✓ Owner:       ${owner.email}  /  password: ${password}`);
  console.log(`✓ Operator:    ${operatorEmail}  /  password: operator123`);
  console.log(`✓ Customers:   ${customer1.name}, ${customer2.name}`);
  console.log(`✓ Templates:   6 (REGULAR, RECURRING, CLASS, SEASONAL, EVENT, PARENT_CHILD)`);
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
