# DM Generator Application

## Overview

This is a modern React-based web application that generates personalized direct messages using AI. The application allows users to input a target person and select a tone (professional, casual, or chaos) to generate customized DMs. Built with a modern full-stack architecture using React, Express, and PostgreSQL with Drizzle ORM.

## Recent Updates (January 2025)

✓ **Production Security Hardening**: Added comprehensive security measures including CORS protection, helmet middleware, rate limiting (10 req/min), and Zod input validation
✓ **Bundle Optimization**: Removed 17 unused Radix UI packages to reduce build size
✓ **OpenAI Streaming**: Implemented real-time streaming responses for faster AI generation perception
✓ **CSRF Protection**: Temporarily disabled due to Replit environment session handling issues - using alternative security via rate limiting and origin validation
✓ **TypeScript Strict Mode**: Enabled full strict mode with forceConsistentCasingInFileNames and noImplicitOverride
✓ **Security Validation**: Added startup environment variable validation and error sanitization
✓ **Drizzle Best Practices**: Updated DATABASE_URL format for secure Neon SSL connections and documented production-ready config
✓ **Session Store Optimization**: Configured PostgreSQL session store for production with memory store fallback for development to prevent memory leaks
✓ **Content Security Policy**: Updated CSP with wildcard domain patterns for Firebase services including 'unsafe-inline'/'unsafe-eval' for full authentication compatibility
✓ **Dark Mode Theme**: Added ThemeProvider with dark mode enabled by default for comfortable viewing experience
✓ **Multi-Language Support**: Added language dropdown with 9 language options for AI-generated content localization
✓ **Enhanced Tone Selection**: Implemented comprehensive tone system with 13 personality modes including 4 premium tones (Bold & Cocky, Flirty & Playful, Chaotic Evil, Whisper Mode)
✓ **Deployment Fixes**: Resolved top-level await compatibility issues for production deployment by updating TypeScript target to ES2020 and fixing Firebase initialization code
✓ **Account Creation Fixes**: Resolved infinite loading state issue with comprehensive timeout handling, request deduplication, enhanced form validation, and proper error handling to prevent UI freezing during authentication
✓ **Firebase WebChannel Fixes**: Completely resolved WebChannel RPC 'Listen' stream transport errors by simplifying Firebase configuration, removing complex retry logic, eliminating emulator connection code, and streamlining CSP policies for stable Firestore connectivity
✓ **Stripe ES Module Fix**: Fixed dynamic require() error by converting Stripe server imports from CommonJS require() to ES module dynamic import, resolving Vite bundling compatibility issues
✓ **Daily Usage Tracking**: Implemented proper daily usage counter for authenticated users (10 DMs/day) that displays correctly after login, replacing the missing usage counter issue
✓ **Package Dependencies Fix**: Resolved missing Radix UI packages by installing all required @radix-ui/* components
✓ **Stripe API Version Update**: Updated Stripe API version from '2024-06-20' to '2025-06-30.basil' to match TypeScript expectations
✓ **Target State Management**: Fixed target state update issue ensuring FreemiumModal retry functionality works with proper recipient information
✓ **Code Quality**: Ensured all files have proper trailing newlines and pass TypeScript compilation

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
3. **Premium Features**: Off the Rails Mode restricted as premium feature
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
- **Advanced Tone System**: 13 specialized prompt templates for different personality modes:
  - Standard: Professional, Friendly, Direct, Empathetic, Assertive
  - Advanced: Funny & Weird, Curious & Intrigued, Fanboy Mode, Apologetic  
  - Premium: Bold & Cocky, Flirty & Playful, Chaotic Evil, Whisper Mode
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
5. **Premium Check**: Server checks for premium features (off the rails mode)
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