# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CLOKA is a Next.js 15 run club application that helps build fitness communities across India. It serves as a comprehensive platform for event management, user registration, merchandise sales, and community engagement.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Database and Setup
- `npm run seed-db` - Seed the database with initial data
- `npm run download-images` - Download placeholder images
- `npm run migrate-users` - Run user migration scripts

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Custom JWT-based auth with cookies
- **Payments**: Razorpay integration
- **Styling**: Tailwind CSS 4
- **UI Components**: Headless UI, Heroicons, Tremor React
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion

## Architecture

### Authentication System
- Custom authentication context (`src/lib/auth-context.tsx`)
- JWT tokens stored in HTTP-only cookies
- Role-based access control (user, admin, super-admin)
- Protected routes via middleware (`src/middleware.ts`)

### Data Models (src/models/)
- **User**: User profiles with roles and crew membership
- **Event**: Run events with registration and check-in
- **UserEvent**: Junction table for user-event relationships
- **Product**: Merchandise items
- **Order**: Payment orders via Razorpay
- **Volunteer**: Event volunteers management
- **WaitlistEntry**: Merchandise waitlist

### API Routes Structure
- `/api/auth/*` - Authentication endpoints
- `/api/admin/*` - Admin-only functionality
- `/api/events/*` - Event management
- `/api/products/*` - Merchandise
- `/api/user/*` - User-specific data

### Key Features
- **Event Management**: Create, register, check-in to runs
- **Admin Dashboard**: User management, event registrations, analytics
- **Merchandise Store**: Product catalog with Razorpay payments
- **User Profiles**: Registration, profile management
- **Volunteer System**: Event volunteer coordination

## Environment Variables

Required environment variables (set in `.env.local`):
- `MONGO_URI` - MongoDB connection string
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Public Razorpay key
- `ADMIN_PASSWORD` - Admin login password
- `ADMIN_AUTH_TOKEN` - Admin session token

## Database Setup

The application uses MongoDB with Mongoose. Connection management is handled in `src/lib/mongodb.ts` with proper caching for serverless environments.

## Authentication Flow

1. Users register/login through `/auth` page
2. JWT tokens are set as HTTP-only cookies
3. Middleware protects routes (`/admin/*`, `/profile/*`, `/my-events/*`)
4. Context provides user state and auth methods

## Admin Features

Admin access is protected by password authentication. Admin users can:
- Manage events and registrations
- View user statistics and analytics
- Handle merchandise and orders
- Manage volunteers
- Approve/deny event registrations

## Key Components

- **AuthProvider**: Global authentication state management
- **LoadingProvider**: Global loading states
- **ErrorBoundary**: Error handling wrapper
- **PageTransition**: Smooth page transitions with Framer Motion

## Development Notes

- Uses App Router architecture with server/client component separation
- Implements proper error handling and loading states
- PWA-ready with manifest and service worker
- SEO optimized with metadata and structured data
- Responsive design with mobile-first approach