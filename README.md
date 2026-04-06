# Wilujeng POS v2

A modern, fast, and feature-rich Point of Sale (POS) system built with Next.js 15. Designed to help small and medium businesses manage their daily transactions, inventory, customers, and financial reports efficiently.

## 🚀 Key Features

- **Modern POS Interface**: Fast and intuitive checkout process with support for barcode scanners.
- **Inventory Management**: Track stock levels, set low-stock alerts, and manage incoming/outgoing items with suppliers.
- **Customer Management**: Track customer points (loyalty program) and manage customer debts (accounts receivable).
- **Comprehensive Reports**: Daily sales, profit & loss (PNL) statements, stock alerts, and supplier summaries.
- **Dynamic Pricing (Tiering)**: Support for wholesale pricing based on quantity (e.g., buy 10 for a cheaper price).
- **Multi-language Support**: Fully translated into English and Bahasa Indonesia.
- **Dark Mode Support**: Built-in light, dark, and system themes.
- **High Performance**: Optimized with Upstash Redis caching for lightning-fast product searches and setting retrievals.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Caching**: [Upstash Redis](https://upstash.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A PostgreSQL database instance
- An Upstash Redis database instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd wilujeng-next-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and configure the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/wilujeng_db"

   # Authentication (Better Auth)
   BETTER_AUTH_SECRET="your-super-secret-auth-key-here"
   BETTER_AUTH_URL="http://localhost:3000"

   # Redis Caching (Upstash)
   UPSTASH_REDIS_REST_URL="https://your-upstash-redis-url.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
   ```

4. **Database Migration**
   Run Drizzle to push the schema to your PostgreSQL database:
   ```bash
   npm run db:push
   # or
   npx drizzle-kit push
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```

6. **Initial Setup**
   Open [http://localhost:3000](http://localhost:3000) in your browser. Upon the first visit, the system will automatically redirect you to the `/setup` page to create the initial Admin account.

## 📚 Project Structure

- `/src/app`: Next.js App Router pages and API route handlers.
- `/src/components`: Reusable UI components (shadcn/ui) and page-specific client components.
- `/src/db`: Drizzle ORM schema definitions and database connection setup.
- `/src/i18n`: Internationalization JSON files (`en.json`, `id.json`) and translation hooks.
- `/src/lib`: Utility functions, Redis client setup, and server-side session helpers.
- `/src/stores`: Zustand global state management (POS cart, UI toggles).

## 📄 License

This project is licensed under the MIT License.
