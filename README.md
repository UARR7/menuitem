# Menu Management Service

A production-ready REST API for restaurant menu management built with **Node.js + Express + TypeScript + MySQL**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Project Structure](#project-structure)
4. [API Reference](#api-reference)
5. [Setup & Running](#setup--running)
6. [Key Design Decisions](#key-design-decisions)

---

## Architecture Overview

```
HTTP Request
    │
    ▼
Middleware (helmet, cors, rate-limit, morgan)
    │
    ▼
Route (validate params/body via Joi)
    │
    ▼
Controller  (parse req → call service → send response)
    │
    ▼
Service  (business logic, validation, orchestration)
    │
    ▼
Repository  (pure SQL, no business logic)
    │
    ▼
MySQL (connection pool)
```

---

## Database Schema

### ERD (text)

```
categories                         menu_items
──────────────────────────         ───────────────────────────────────
id            PK  INT UNSIGNED     id            PK  INT UNSIGNED
name          UNIQUE VARCHAR(100)  name              VARCHAR(150)
description   TEXT NULL            description       TEXT NULL
display_order SMALLINT DEFAULT 0   price             DECIMAL(10,2)
is_active     TINYINT(1) DEFAULT 1 availability      ENUM('available','unavailable')
created_at    DATETIME             category_id   FK  INT UNSIGNED NULL ──────────┐
updated_at    DATETIME             created_at        DATETIME                    │
                                   updated_at        DATETIME                    │
                                                                                  │
                              FK: menu_items.category_id → categories.id         │
                              ON DELETE SET NULL ◄────────────────────────────────┘
                              ON UPDATE CASCADE
```

### Key design choices in the schema

| Decision | Reason |
|----------|--------|
| `category_id` is **nullable** | An item can exist without a category. Avoids tight coupling. |
| `ON DELETE SET NULL` | When a category is deleted, items are *not* deleted — they become uncategorized. |
| `ON UPDATE CASCADE` | If category PK changes (rare), items track it automatically. |
| `DECIMAL(10,2)` for price | Avoids floating-point rounding issues with currency. |
| Separate `assignCategory` endpoint | Changing an item's category doesn't require touching other fields. |

---

## Project Structure

```
menu-management/
├── src/
│   ├── config/
│   │   ├── app.ts              # Env config loader
│   │   └── database.ts         # MySQL pool, query helpers, transactions
│   │
│   ├── types/
│   │   └── index.ts            # All interfaces, DTOs, enums
│   │
│   ├── utils/
│   │   ├── logger.ts           # Winston logger
│   │   ├── errors.ts           # Custom error classes (AppError, NotFoundError, etc.)
│   │   ├── response.ts         # API response helpers
│   │   └── validation.ts       # Joi schemas
│   │
│   ├── middlewares/
│   │   ├── validate.middleware.ts   # Joi validation middleware
│   │   └── error.middleware.ts      # Global error handler + 404
│   │
│   ├── repositories/           # DATA ACCESS LAYER — SQL only, no business logic
│   │   ├── category.repository.ts
│   │   └── menuItem.repository.ts
│   │
│   ├── services/               # BUSINESS LOGIC LAYER
│   │   ├── category.service.ts
│   │   └── menuItem.service.ts
│   │
│   ├── controllers/            # HTTP LAYER — parse req, call service, send res
│   │   ├── category.controller.ts
│   │   └── menuItem.controller.ts
│   │
│   ├── routes/
│   │   ├── index.ts
│   │   ├── category.routes.ts
│   │   └── menuItem.routes.ts
│   │
│   ├── migrations/
│   │   ├── 001_create_categories.ts
│   │   ├── 002_create_menu_items.ts
│   │   └── runner.ts
│   │
│   ├── seeders/
│   │   └── runner.ts
│   │
│   ├── app.ts                  # Express app factory
│   └── index.ts                # Server bootstrap + graceful shutdown
│
├── tests/
│   ├── unit/
│   │   ├── category.service.test.ts
│   │   └── menuItem.service.test.ts
│   └── integration/            # (add supertest integration tests here)
│
├── .env.example
├── package.json
├── tsconfig.json
└── jest.config.json
```

---

## API Reference

### Base URL: `http://localhost:3000/api/v1`

---

### Categories

#### `GET /categories`
Returns all categories ordered by display_order.

**Response 200:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    { "id": 1, "name": "Appetizers", "description": null, "display_order": 1, "is_active": true }
  ]
}
```

---

#### `GET /categories/:id`
Get single category.

---

#### `GET /categories/:id/items`
List all menu items belonging to this category.

---

#### `POST /categories`
```json
// Request body
{ "name": "Salads", "description": "Fresh salads", "display_order": 5 }
```

---

#### `PATCH /categories/:id`
```json
// Partial update — any subset of fields
{ "name": "Soups & Salads", "display_order": 3 }
```

---

#### `DELETE /categories/:id`
- Without query param: fails if items are linked → returns `400` with count.
- `?force=true`: deletes category and sets `category_id = NULL` on all linked items.

**Response:**
```json
{ "success": true, "data": { "deleted": true, "unassigned_items": 3 } }
```

---

### Menu Items

#### `GET /menu-items`
Supports filtering and pagination:

| Query Param | Type | Example |
|---|---|---|
| `category_id` | number or `"null"` | `?category_id=1` or `?category_id=null` |
| `availability` | `available` / `unavailable` | `?availability=available` |
| `page` | number | `?page=2` |
| `limit` | number (max 100) | `?limit=10` |

---

#### `POST /menu-items`
```json
{
  "name": "Veggie Burger",
  "description": "Spicy veggie burger with fries",
  "price": 230.00,
  "availability": "available",
  "category_id": 2
}
```
`category_id` is optional — item can be created without a category.

---

#### `PATCH /menu-items/:id`
General update (name, description, price, availability, category_id). All optional.

---

#### `PATCH /menu-items/:id/availability`
Dedicated toggle endpoint — only changes availability.
```json
{ "availability": "unavailable" }
```

---

#### `PATCH /menu-items/:id/category`
Dedicated category (re)assignment — decoupled from general update.
```json
// Assign to category 3
{ "category_id": 3 }

// Remove from all categories
{ "category_id": null }
```

---

#### `DELETE /menu-items/:id`
Returns `204 No Content`.

---

## Setup & Running

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Create the database
```sql
CREATE DATABASE menu_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run migrations
```bash
npm run migrate
```

### 5. (Optional) Seed sample data
```bash
npm run seed
```

### 6. Start the server
```bash
# Development (with hot reload)
npm run dev

# Production
npm run build && npm start
```

### 7. Run tests
```bash
npm test
npm run test:coverage
```

---

## Key Design Decisions

### Loose coupling between items and categories

Items and categories are **independent entities**. The `category_id` on a menu item is nullable — items are not required to belong to a category. This means:

- You can add items first, then categorize them later.
- Deleting a category does **not** delete its items (they become "uncategorized").
- Reassigning an item to a different category uses a dedicated endpoint (`PATCH /menu-items/:id/category`) that only touches `category_id`, leaving all other fields untouched.

### Layered architecture

Each layer has a single responsibility:

| Layer | Responsibility |
|---|---|
| Router | URL routing + middleware chaining |
| Controller | Parsing HTTP request → calling service → formatting response |
| Service | Business rules, validation, orchestration |
| Repository | Raw SQL queries, no business logic |
| Database | Connection pool, transactions |

### Transaction support

The `withTransaction` helper in `database.ts` wraps any async operation in a MySQL transaction with automatic rollback on error, used for operations that need atomicity.

### Error handling

All errors flow through a single global error handler middleware. Custom error classes (`NotFoundError`, `ConflictError`, `BadRequestError`) carry their own HTTP status codes, so controllers never manually set error status codes.
# menuitem
