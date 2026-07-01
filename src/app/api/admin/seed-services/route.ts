import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureServicesTable } from "@/lib/schema";

const services = [
  {
    title: "Full-Stack Web Development",
    description: "What's Included: Custom web apps built with Next.js, React, TypeScript, and Node.js. Authentication, databases, admin panels, payment integration, and responsive design. | Best For: Startups, small businesses, and founders launching a digital product.",
    icon: "Code2",
  },
  {
    title: "API Development & Integration",
    description: "What's Included: RESTful & GraphQL API design, third-party integrations (Stripe, Twilio, OpenAI, Google), webhook setup, rate limiting, and auto-generated API docs. | Best For: Products that need to connect external services or expose data to partners.",
    icon: "Braces",
  },
  {
    title: "E-Commerce Development",
    description: "What's Included: Custom online stores, payment gateway setup (Stripe, PayPal, GCash), inventory management, shopping cart, order tracking, and checkout optimization. | Best For: Retailers, digital product sellers, and small e-commerce brands.",
    icon: "Globe",
  },
  {
    title: "Mobile App Development",
    description: "What's Included: Cross-platform mobile apps using React Native. Push notifications, offline support, app store deployment (iOS & Android), and real-time features. | Best For: MVPs, startups, and businesses wanting a mobile presence.",
    icon: "Smartphone",
  },
  {
    title: "UI/UX Design & Implementation",
    description: "What's Included: Wireframing, high-fidelity Figma mockups, design systems, responsive layouts, animations, and pixel-perfect implementation in code. | Best For: Early-stage products needing a professional, user-friendly interface.",
    icon: "Palette",
  },
  {
    title: "Website Redesign & Migration",
    description: "What's Included: Legacy site audit, redesign strategy, content migration, SEO preservation, performance improvements, and zero-downtime deployment. | Best For: Businesses stuck on outdated platforms wanting a modern web presence.",
    icon: "Layers",
  },
  {
    title: "Performance Optimization",
    description: "What's Included: Core Web Vitals audit, image optimization, code splitting, caching strategy, CDN setup, bundle size reduction, and Lighthouse score improvement. | Best For: Sites with slow load times, high bounce rates, or poor SEO rankings.",
    icon: "Rocket",
  },
  {
    title: "Database Design & Management",
    description: "What's Included: Schema design (PostgreSQL, MySQL, MongoDB), query optimization, indexing, migration planning, data backup strategies, and replication setup. | Best For: Data-heavy applications and platforms experiencing slow queries.",
    icon: "Database",
  },
  {
    title: "Maintenance & Support",
    description: "What's Included: Bug fixes, dependency updates, security patches, uptime monitoring, performance checks, and priority email support with same-day response. | Best For: Businesses that need their site running smoothly without hiring a full-time developer.",
    icon: "Server",
  },
  {
    title: "Technical Consultation & Code Review",
    description: "What's Included: Architecture review, security audit, code quality assessment, tech stack recommendations, performance analysis, and a detailed improvement roadmap. | Best For: Teams wanting an expert second opinion before or after a major launch.",
    icon: "Shield",
  },
  {
    title: "Cloud Deployment & DevOps",
    description: "What's Included: Vercel, AWS, or DigitalOcean setup. CI/CD pipelines, Docker containerization, SSL configuration, environment management, and deployment automation. | Best For: Developers and teams wanting reliable, automated deployments.",
    icon: "Cloud",
  },
  {
    title: "Chat & Real-Time Features",
    description: "What's Included: WebSocket-based messaging, live notifications, video/voice call integration, typing indicators, read receipts, and scalable real-time infrastructure. | Best For: Platforms needing in-app chat, customer support tools, or collaboration features.",
    icon: "GitBranch",
  },
  {
    title: "Portfolio & Brand Websites",
    description: "What's Included: Custom portfolio sites, business landing pages, agency websites, and personal brand pages with CMS integration, SEO optimization, and contact forms. | Best For: Freelancers, creatives, and businesses needing a professional online presence.",
    icon: "Palette",
  },
  {
    title: "SaaS Product Development",
    description: "What's Included: Full SaaS architecture — multi-tenant databases, subscription billing (Stripe), user roles & permissions, onboarding flows, usage analytics, and admin dashboards. | Best For: Founders and product teams building subscription-based software platforms.",
    icon: "Code2",
  },
  {
    title: "Payment & Subscription Systems",
    description: "What's Included: Stripe/PayPal/Lemon Squeezy integration, recurring billing, invoicing, refund handling, webhook event processing, tax calculation, and subscription management dashboards. | Best For: SaaS products, membership sites, and digital marketplaces.",
    icon: "Globe",
  },
  {
    title: "Authentication & User Systems",
    description: "What's Included: OAuth login (Google, GitHub, Facebook), magic link auth, multi-factor authentication, session management, passwordless login, and role-based access control. | Best For: Any platform needing secure, flexible user authentication flows.",
    icon: "Shield",
  },
  {
    title: "Data Visualization & Dashboards",
    description: "What's Included: Interactive charts, real-time dashboards, CSV/API data connectors, exportable reports, filterable tables, and key metric displays using Chart.js, Recharts, or D3. | Best For: Analytics platforms, admin panels, and business intelligence tools.",
    icon: "Braces",
  },
  {
    title: "Content Management Systems",
    description: "What's Included: Custom CMS integration (Sanity, Contentful, Strapi), headless CMS setup, rich text editing, media libraries, version history, and preview workflows. | Best For: Content-heavy sites, blogs, news platforms, and marketing websites.",
    icon: "Database",
  },
  {
    title: "Testing & Quality Assurance",
    description: "What's Included: Unit tests (Jest/Vitest), integration tests, end-to-end testing (Playwright/Cypress), API testing, visual regression testing, CI pipeline integration, and coverage reports. | Best For: Teams wanting reliable code with fewer production bugs.",
    icon: "GitBranch",
  },
  {
    title: "Search & Discovery Features",
    description: "What's Included: Full-text search (PostgreSQL/Elasticsearch), filtered search with faceted navigation, autocomplete suggestions, relevance ranking, and search analytics. | Best For: E-commerce stores, directories, and content platforms with large inventories.",
    icon: "Layers",
  },
];

export async function POST() {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureServicesTable();
    const existing = await queryAll("SELECT title FROM services");
    const existingTitles = new Set(existing.map((r: any) => r.title));
    let added = 0;
    for (const s of services) {
      if (existingTitles.has(s.title)) continue;
      await queryOne(
        "INSERT INTO services (title, description, icon) VALUES ($1, $2, $3) RETURNING id",
        [s.title, s.description, s.icon]
      );
      added++;
    }
    if (added === 0) {
      return NextResponse.json({ message: `All ${services.length} services already exist — nothing to add.` });
    }
    return NextResponse.json({ message: `Added ${added} new service${added > 1 ? "s" : ""}. Total in database: ${existing.length + added}.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
