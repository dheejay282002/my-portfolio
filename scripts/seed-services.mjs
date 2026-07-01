// Run: node scripts/seed-services.mjs
// Seeds the services table with default offerings

import pg from "pg";
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/portfolio";

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

const services = [
  {
    title: "Full-Stack Web Development",
    description: "What's Included: End-to-end web applications built with Next.js, React, TypeScript & Node.js. Custom APIs, authentication, real-time features, and responsive UIs designed for performance. | Best For: Startups, SaaS platforms, and businesses needing a modern web presence.",
    icon: "Code2",
  },
  {
    title: "Mobile Application Development",
    description: "What's Included: Cross-platform mobile apps using React Native with native performance. Push notifications, offline support, app store deployment, and seamless backend integration. | Best For: MVPs, product launches, and businesses expanding to mobile.",
    icon: "Smartphone",
  },
  {
    title: "UI/UX Design & Prototyping",
    description: "What's Included: User research, wireframing, high-fidelity mockups, interactive prototypes, and design systems. Figma-based collaboration with developer handoff included. | Best For: Early-stage products needing a polished, user-centered design.",
    icon: "Palette",
  },
  {
    title: "Cloud Infrastructure & DevOps",
    description: "What's Included: AWS/Azure/GCP setup, Docker containerization, CI/CD pipelines, auto-scaling, monitoring with Grafana & Prometheus, and infrastructure as code with Terraform. | Best For: Growing platforms that need reliable, scalable cloud architecture.",
    icon: "Cloud",
  },
  {
    title: "API Development & Integration",
    description: "What's Included: RESTful & GraphQL API design, third-party integrations (Stripe, Twilio, OpenAI, etc.), webhook systems, API documentation with Swagger/OpenAPI, and rate limiting. | Best For: Products that need to connect multiple services or expose data to partners.",
    icon: "Braces",
  },
  {
    title: "Database Architecture & Optimization",
    description: "What's Included: Schema design (SQL & NoSQL), query optimization, indexing strategies, migration planning, replication setup, and performance tuning for high-traffic applications. | Best For: Data-heavy applications, analytics platforms, and systems scaling past 1M users.",
    icon: "Database",
  },
  {
    title: "Cybersecurity & Compliance",
    description: "What's Included: Vulnerability assessments, penetration testing, OWASP Top 10 remediation, SOC 2/PCI-DSS compliance prep, WAF configuration, and security audit documentation. | Best For: Fintech, healthcare, and any application handling sensitive user data.",
    icon: "Shield",
  },
  {
    title: "Full-Stack Architecture & Growth",
    description: "What's Included: Complete system architecture design, microservices migration, performance optimization, caching strategies (Redis/CDN), load testing, and technical scalability planning. | Best For: Series A+ startups preparing for rapid growth and scale.",
    icon: "Rocket",
  },
  {
    title: "Legacy System Modernization",
    description: "What's Included: Migration from monolithic to microservices architecture, legacy code refactoring, database migration planning, API extraction, and incremental deployment strategies with zero downtime. | Best For: Established businesses modernizing their tech stack.",
    icon: "Layers",
  },
  {
    title: "Server Management & Hosting",
    description: "What's Included: VPS/dedicated server setup, Nginx/Apache configuration, SSL/TLS management, backup automation, disaster recovery planning, and 24/7 monitoring with alerting. | Best For: Businesses that need reliable, hands-off server operations.",
    icon: "Server",
  },
  {
    title: "E-Commerce Solutions",
    description: "What's Included: Custom e-commerce platforms, payment gateway integration (Stripe, PayPal, Square), inventory management systems, shopping cart optimization, and checkout flow UX improvement. | Best For: Retailers, digital product sellers, and subscription-based businesses.",
    icon: "Globe",
  },
  {
    title: "DevOps & CI/CD Pipeline Engineering",
    description: "What's Included: GitHub Actions/GitLab CI setup, automated testing & deployment, Kubernetes orchestration, blue/green deployments, feature flags, and release management workflows. | Best For: Engineering teams wanting to ship faster with confidence.",
    icon: "GitBranch",
  },
];

async function main() {
  const exists = await pool.query("SELECT COUNT(*)::int AS cnt FROM services");
  if (exists.rows[0].cnt > 0) {
    console.log(`Services table already has ${exists.rows[0].cnt} entries — skipping seed.`);
    await pool.end();
    return;
  }

  for (const s of services) {
    await pool.query(
      "INSERT INTO services (title, description, icon) VALUES ($1, $2, $3)",
      [s.title, s.description, s.icon]
    );
  }
  console.log(`Seeded ${services.length} services successfully.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
