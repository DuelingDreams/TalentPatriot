# Project Overview

This is a full-stack web application built with React frontend and Express backend, featuring a modern dashboard interface with user management capabilities. The application uses TypeScript throughout and implements a clean, component-based architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Component Library**: Shadcn/ui component system
- **State Management**: TanStack React Query for server state
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Development**: Hot reload with tsx
- **API Structure**: RESTful endpoints with `/api` prefix
- **Request Handling**: JSON and URL-encoded body parsing
- **Error Handling**: Centralized error middleware

### Data Storage
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (via Neon Database serverless)
- **Migrations**: Drizzle-kit for schema migrations
- **Development Storage**: In-memory storage interface for development

### Authentication & Session Management
- **Provider**: Supabase integration prepared
- **Session Storage**: PostgreSQL session store (connect-pg-simple)
- **User Management**: Basic user schema with username/password

## Key Components

### Frontend Components
- **Layout System**: Dashboard layout with responsive sidebar and top navigation
- **UI Components**: Complete set of Radix UI-based components (buttons, forms, dialogs, etc.)
- **Pages**: Dashboard, Users, Projects, Analytics, Settings with placeholder content
- **Routing**: File-based routing with 404 handling

### Backend Components
- **Routes**: Modular route registration system
- **Storage Interface**: Abstracted storage layer with in-memory implementation
- **Development Server**: Vite integration for development mode
- **Logging**: Request/response logging with timing

### Database Schema
- **Users Table**: Basic user model with id, username, password fields
- **Validation**: Zod schemas for type validation
- **Types**: Fully typed with Drizzle's type inference

## Data Flow

1. **Client Requests**: React components make API calls using TanStack Query
2. **API Layer**: Express routes handle requests with error handling
3. **Storage Layer**: Abstract storage interface allows for different implementations
4. **Database**: Drizzle ORM manages PostgreSQL interactions
5. **Response**: JSON responses with proper error handling and logging

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL serverless)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **Icons**: Lucide React icons
- **Date Handling**: date-fns for date utilities

### Development Tools
- **Build**: Vite with React plugin
- **Database Tools**: Drizzle Kit for migrations
- **Type Checking**: TypeScript with strict configuration
- **Replit Integration**: Custom plugins for development environment

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle pushes schema changes to PostgreSQL

### Environment Configuration
- **Development**: Uses tsx for hot reload and Vite dev server
- **Production**: Serves static files and runs bundled Express server
- **Database**: Requires `DATABASE_URL` environment variable

### File Structure
- **Client**: Frontend code in `client/` directory
- **Server**: Backend code in `server/` directory  
- **Shared**: Common schemas and types in `shared/` directory
- **Configuration**: Root-level config files for tools

The application is designed to be easily extensible with a clear separation of concerns between frontend, backend, and data layers. The storage interface pattern allows for easy switching between development and production database implementations.