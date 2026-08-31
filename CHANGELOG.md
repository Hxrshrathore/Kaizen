# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.1-beta.1] - 2026-08-31

### Changed
- Redesigned the CTA on the landing page for a more vibrant, interactive, and premium glassmorphism aesthetic. Added glowing hover effects and a dynamic button.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.0-beta.1] - 2026-08-31

### Added
- **Initial Beta Release (v0)**
- Next.js 16 (App Router) integration with Turbopack for lightning-fast builds
- Complete Authentication Firewall via `proxy.ts` (Next.js middleware)
- Google OAuth integration with NextAuth.js
- Prisma ORM setup with Neon Database Serverless PostgreSQL
- Base UI design system utilizing Tailwind CSS and Radix UI primitives
- GitHub Actions CI/CD pipelines for automated releases and deployment to Vercel

### Changed
- Refactored repository structure to remove bulky ML binaries from the main Git tree, dramatically improving clone times and saving space.
- Synchronized all Prisma packages (`@prisma/client`, `prisma`, `@prisma/adapter-neon`) strictly to `6.12.0` for Vercel Serverless stability.

### Fixed
- Resolved Vercel strict TypeScript build issues across API routes and UI components.
- Fixed `notch-nav.tsx` TypeScript interface intersection conflicts by utilizing utility types (`Omit`).
