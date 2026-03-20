# CLAUDE CODE MASTER SPEC — ATNACHTA STUDIO APP (FINAL)

You are a senior full-stack product engineer and system architect.

Build a production-ready, mobile-first but desktop-optimized, Hebrew RTL, multi-tenant SaaS web application for creative studios (starting with a ceramics studio).

Do not output a plan — build the actual system step by step.

---

## 1. PRODUCT OVERVIEW

This system is a unified studio management platform including:
- Workshop management
- Customer management
- Product and inventory management
- Material inventory and purchasing
- Kiln tracking
- Reminder system
- Reports and analytics
- Customer-facing dynamic pages
- External payment via Morning (redirect only)

---

## 2. CORE ARCHITECTURE

Single system with two layers:

**Internal Admin App**
- Authenticated
- Operational
- Mobile-first + desktop optimized

**Customer-facing Pages**
- Public (token-based)
- Clean UI
- Branded per studio

---

## 3. TECH STACK
- Next.js (App Router)
- TypeScript
- Tailwind + shadcn/ui
- PostgreSQL + Prisma
- NextAuth
- Neon (serverless PostgreSQL)
- Google Calendar API
- Mobile barcode scanning
- Vercel deployment

---

## 4. UI PRINCIPLES
- Mobile-first
- Desktop-enhanced layouts:
  - mobile: stacked, accordions
  - desktop: multi-column, panels
- Minimal typing
- Smart defaults

---

## 5. SaaS MODEL

Each Studio has:
- planType
- limits:
  - maxUsers
  - maxWorkshopsPerMonth
  - maxProducts
- usage tracking

Do NOT hard block in MVP — show warnings instead.

---

## 6. ROLES SYSTEM

Roles:
- Owner
- Manager
- Operator
- Viewer

**Owner** — Full control:
- manageUsers
- changePlan
- editStudioSettings
- all actions

**Manager**
- full operations
- cannot manage users or plan

**Operator**
- operational only
- cannot:
  - delete workshops
  - edit products
  - update payment (default)

**Viewer**
- read-only

---

## 7. PERMISSIONS SYSTEM

Use action-based permissions.

Actions include:
- createWorkshop
- editWorkshop
- deleteWorkshop
- manageBookings
- createProduct
- editProduct
- updateProductStock
- createMaterial
- consumeMaterial
- updatePaymentStatus
- viewReports
- exportReports
- manageUsers

Owner can override selected permissions per user.

---

## 8. STUDIO BRANDING

Studio must include:
- logoUrl
- publicStudioName
- brand colors (optional)

Used in:
- customer pages
- headers

---

## 9. WORKSHOP SYSTEM

**WorkshopTemplate** — Reusable configuration

**WorkshopEvent** — Actual instance

Statuses:
- draft
- open
- pending_minimum
- confirmed
- full
- cancelled
- postponed
- completed

Auto transitions where possible.

---

## 10. WORKSHOP MANAGEMENT
- multiple bookings per event
- capacity tracking
- payment status manual
- warnings on overflow

---

## 11. CUSTOMER-FACING PAGE

Supports:
- confirmation
- registration

Must include:
- studio logo
- workshop details
- participant count
- payment button
- contact info for support

---

## 12. PAYMENTS (Morning)
- redirect only
- no API integration
- manual payment status

---

## 13. PRODUCTS SYSTEM
- products + variants
- auto SKU generation
- stock tracking
- seasonal fields

---

## 14. MATERIALS SYSTEM
- inventory
- suppliers (multiple per material)
- barcode scanning
- shopping list
- stock alerts (red/orange/yellow)

---

## 15. REMINDERS SYSTEM
- manual + automatic
- never auto-dismiss
- statuses:
  - open
  - in_progress
  - done

Includes:
- workshop reminders
- seasonal reminders
- material alerts

---

## 16. REPORTS

MVP:
- workshops status
- low stock
- payments

Advanced (web):
- sales analytics
- product performance
- seasonal insights

Export:
- CSV required
- Excel optional
- PDF optional

---

## 17. GOOGLE CALENDAR
- create/update events
- store eventId

---

## 18. VALIDATION
- enforce logical constraints
- warn on limits
- confirm destructive actions

---

## 19. IMPLEMENTATION ORDER
1. project setup
2. auth + studio
3. database
4. workshop templates
5. workshop events
6. workshop management
7. customer pages
8. products
9. materials
10. reminders
11. dashboard
12. reports
13. polish

---

## 20. FINAL INSTRUCTION

Build the full MVP system.

Do not:
- overcomplicate
- skip flows
- replace external payments

Do:
- build clean architecture
- keep SaaS-ready
- ensure usability on mobile and desktop
