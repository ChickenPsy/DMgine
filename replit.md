# DM Generator Application

## Overview

This is a modern React-based web application that generates personalized direct messages using AI. The application allows users to input a target person and select a tone (professional, flirty, or chaos) to generate customized DMs. Built with a modern full-stack architecture using React, Express, and PostgreSQL with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API**: RESTful API design
- **Middleware**: Express middleware for logging, JSON parsing, and error handling
- **Development**: Vite integration for seamless full-stack development

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: @neondatabase/serverless for serverless PostgreSQL connections

## Key Components

### Core Features
1. **DM Generation**: AI-powered message generation with multiple tone options
2. **Tier-Based Access**: Free, Lite, and Premium tiers with different token limits
3. **Premium Features**: Chaos mode restricted as premium feature
4. **Responsive UI**: Mobile-first design with Tailwind CSS
5. **Real-time Feedback**: Toast notifications and loading states

### Database Schema
- **Users Table**: Basic user authentication schema (id, username, password)
- **DM Generations Table**: Stores generated messages with metadata (target, tone, message, timestamp)

### AI Integration
- **OpenAI Integration**: GPT-4.1 (gpt-4-1106-preview) model for message generation
- **Tier-Based Model Selection**: Different token limits based on user subscription
  - Free tier: 150 max tokens
  - Lite tier: 300 max tokens  
  - Premium tier: 500 max tokens (unlimited effectively)
- **Prompt Engineering**: Specialized prompts for different tones (professional, casual, chaos)
- **Error Handling**: Graceful fallbacks and user feedback

### UI Components
- **Component Library**: shadcn/ui with Radix UI primitives
- **Form Components**: Input, Select, Button, Label with consistent styling
- **Feedback Components**: Toast system, loading indicators
- **Layout Components**: Cards, responsive containers

## Data Flow

1. **User Input**: User enters target person and selects tone via form
2. **Client Validation**: Zod schema validation on frontend
3. **API Request**: POST to `/generate` or `/api/generate-dm` with validated data
4. **Tier Detection**: Server determines user tier (Free/Lite/Premium) or defaults to Free
5. **Premium Check**: Server checks for premium features (chaos mode)
6. **Model Configuration**: getModelConfig() helper determines appropriate model and token limits
7. **AI Generation**: OpenAI API call with tier-specific configuration and tone-specific prompts
8. **Response**: Generated message returned to client in { message: string } format
9. **UI Update**: Message displayed with copy functionality

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe SQL query builder
- **openai**: Official OpenAI API client
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI component primitives
- **zod**: Runtime type validation
- **react-hook-form**: Form state management

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Static type checking
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **OPENAI_API_KEY**: OpenAI API key for AI generation
- **NODE_ENV**: Environment flag (development/production)

### Production Setup
- **Server**: Express serves static files in production
- **Database**: PostgreSQL with connection pooling
- **AI Service**: OpenAI API with error handling and fallbacks

### Development Workflow
- **Hot Reload**: Vite HMR for frontend changes
- **Server Restart**: tsx for backend TypeScript execution
- **Database**: Live schema updates with Drizzle push
- **Type Safety**: Shared types between client and server