-- Seed services table with default offerings
-- Run: psql -d portfolio -f scripts/seed-services.sql

INSERT INTO services (title, description, icon)
SELECT * FROM (VALUES
  (
    'Full-Stack Web Development',
    'What''s Included: End-to-end web applications built with Next.js, React, TypeScript & Node.js. Custom APIs, authentication, real-time features, and responsive UIs designed for performance. | Best For: Startups, SaaS platforms, and businesses needing a modern web presence.',
    'Code2'
  ),
  (
    'Mobile Application Development',
    'What''s Included: Cross-platform mobile apps using React Native with native performance. Push notifications, offline support, app store deployment, and seamless backend integration. | Best For: MVPs, product launches, and businesses expanding to mobile.',
    'Smartphone'
  ),
  (
    'UI/UX Design & Prototyping',
    'What''s Included: User research, wireframing, high-fidelity mockups, interactive prototypes, and design systems. Figma-based collaboration with developer handoff included. | Best For: Early-stage products needing a polished, user-centered design.',
    'Palette'
  ),
  (
    'Cloud Infrastructure & DevOps',
    'What''s Included: AWS/Azure/GCP setup, Docker containerization, CI/CD pipelines, auto-scaling, monitoring with Grafana & Prometheus, and infrastructure as code with Terraform. | Best For: Growing platforms that need reliable, scalable cloud architecture.',
    'Cloud'
  ),
  (
    'API Development & Integration',
    'What''s Included: RESTful & GraphQL API design, third-party integrations (Stripe, Twilio, OpenAI, etc.), webhook systems, API documentation with Swagger/OpenAPI, and rate limiting. | Best For: Products that need to connect multiple services or expose data to partners.',
    'Braces'
  ),
  (
    'Database Architecture & Optimization',
    'What''s Included: Schema design (SQL & NoSQL), query optimization, indexing strategies, migration planning, replication setup, and performance tuning for high-traffic applications. | Best For: Data-heavy applications, analytics platforms, and systems scaling past 1M users.',
    'Database'
  ),
  (
    'Cybersecurity & Compliance',
    'What''s Included: Vulnerability assessments, penetration testing, OWASP Top 10 remediation, SOC 2/PCI-DSS compliance prep, WAF configuration, and security audit documentation. | Best For: Fintech, healthcare, and any application handling sensitive user data.',
    'Shield'
  ),
  (
    'Full-Stack Architecture & Growth',
    'What''s Included: Complete system architecture design, microservices migration, performance optimization, caching strategies (Redis/CDN), load testing, and technical scalability planning. | Best For: Series A+ startups preparing for rapid growth and scale.',
    'Rocket'
  ),
  (
    'Legacy System Modernization',
    'What''s Included: Migration from monolithic to microservices architecture, legacy code refactoring, database migration planning, API extraction, and incremental deployment strategies with zero downtime. | Best For: Established businesses modernizing their tech stack.',
    'Layers'
  ),
  (
    'Server Management & Hosting',
    'What''s Included: VPS/dedicated server setup, Nginx/Apache configuration, SSL/TLS management, backup automation, disaster recovery planning, and 24/7 monitoring with alerting. | Best For: Businesses that need reliable, hands-off server operations.',
    'Server'
  ),
  (
    'E-Commerce Solutions',
    'What''s Included: Custom e-commerce platforms, payment gateway integration (Stripe, PayPal, Square), inventory management systems, shopping cart optimization, and checkout flow UX improvement. | Best For: Retailers, digital product sellers, and subscription-based businesses.',
    'Globe'
  ),
  (
    'DevOps & CI/CD Pipeline Engineering',
    'What''s Included: GitHub Actions/GitLab CI setup, automated testing & deployment, Kubernetes orchestration, blue/green deployments, feature flags, and release management workflows. | Best For: Engineering teams wanting to ship faster with confidence.',
    'GitBranch'
  )
) AS v(title, description, icon)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);
