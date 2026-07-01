-- Seed services table with realistic default offerings
-- Run: psql -d portfolio -p 3305 -f scripts/seed-services.sql

INSERT INTO services (title, description, icon)
SELECT * FROM (VALUES
  ('Full-Stack Web Development', 'What''s Included: Custom web apps built with Next.js, React, TypeScript, and Node.js. Authentication, databases, admin panels, payment integration, and responsive design. | Best For: Startups, small businesses, and founders launching a digital product.', 'Code2'),
  ('API Development & Integration', 'What''s Included: RESTful & GraphQL API design, third-party integrations (Stripe, Twilio, OpenAI, Google), webhook setup, rate limiting, and auto-generated API docs. | Best For: Products that need to connect external services or expose data to partners.', 'Braces'),
  ('E-Commerce Development', 'What''s Included: Custom online stores, payment gateway setup (Stripe, PayPal, GCash), inventory management, shopping cart, order tracking, and checkout optimization. | Best For: Retailers, digital product sellers, and small e-commerce brands.', 'Globe'),
  ('Mobile App Development', 'What''s Included: Cross-platform mobile apps using React Native. Push notifications, offline support, app store deployment (iOS & Android), and real-time features. | Best For: MVPs, startups, and businesses wanting a mobile presence.', 'Smartphone'),
  ('UI/UX Design & Implementation', 'What''s Included: Wireframing, high-fidelity Figma mockups, design systems, responsive layouts, animations, and pixel-perfect implementation in code. | Best For: Early-stage products needing a professional, user-friendly interface.', 'Palette'),
  ('Website Redesign & Migration', 'What''s Included: Legacy site audit, redesign strategy, content migration, SEO preservation, performance improvements, and zero-downtime deployment. | Best For: Businesses stuck on outdated platforms wanting a modern web presence.', 'Layers'),
  ('Performance Optimization', 'What''s Included: Core Web Vitals audit, image optimization, code splitting, caching strategy, CDN setup, bundle size reduction, and Lighthouse score improvement. | Best For: Sites with slow load times, high bounce rates, or poor SEO rankings.', 'Rocket'),
  ('Database Design & Management', 'What''s Included: Schema design (PostgreSQL, MySQL, MongoDB), query optimization, indexing, migration planning, data backup strategies, and replication setup. | Best For: Data-heavy applications and platforms experiencing slow queries.', 'Database'),
  ('Maintenance & Support', 'What''s Included: Bug fixes, dependency updates, security patches, uptime monitoring, performance checks, and priority email support with same-day response. | Best For: Businesses that need their site running smoothly without hiring a full-time developer.', 'Server'),
  ('Technical Consultation & Code Review', 'What''s Included: Architecture review, security audit, code quality assessment, tech stack recommendations, performance analysis, and a detailed improvement roadmap. | Best For: Teams wanting an expert second opinion before or after a major launch.', 'Shield'),
  ('Cloud Deployment & DevOps', 'What''s Included: Vercel, AWS, or DigitalOcean setup. CI/CD pipelines, Docker containerization, SSL configuration, environment management, and deployment automation. | Best For: Developers and teams wanting reliable, automated deployments.', 'Cloud'),
  ('Chat & Real-Time Features', 'What''s Included: WebSocket-based messaging, live notifications, video/voice call integration, typing indicators, read receipts, and scalable real-time infrastructure. | Best For: Platforms needing in-app chat, customer support tools, or collaboration features.', 'GitBranch')
) AS v(title, description, icon)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);
