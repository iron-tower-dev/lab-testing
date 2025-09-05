# Lab Testing Application

A modern Angular 20 application for managing laboratory test result entry, with a Node.js/Hono API backend.

## Project Structure

```
lab-testing/
├── src/                          # Angular application code
│   ├── app/                      # Angular components and modules  
│   │   ├── enter-results/        # Main feature module
│   │   ├── home/                 # Home page component
│   │   └── shared-module.ts      # Shared Angular Material modules
│   ├── main.ts                   # Angular bootstrap
│   └── styles.scss               # Global styles
├── server/                       # Node.js API server
│   ├── api/                      # API routes and server setup
│   │   ├── routes/               # API route handlers
│   │   ├── db/                   # Database connection
│   │   ├── app.ts                # Hono app configuration
│   │   └── server.ts             # Server startup
│   ├── db/                       # Database schema and seeds
│   │   ├── seeds/                # Database seeding scripts
│   │   └── schema.ts             # Drizzle ORM schema
│   └── index.ts                  # Server entry point
└── public/                       # Static assets
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
npm install
```

### Running the Application

#### Start Angular Development Server (Port 4200)
```bash
npm start
```

#### Start API Server (Port 3001) 
```bash
npm run api
```

#### Start Both Servers Concurrently
```bash
npm run dev
```

#### Seed the Database
```bash
npm run seed
```

### Available Scripts

- `npm start` - Start Angular development server
- `npm run build` - Build Angular application for production
- `npm run build:server` - Build server TypeScript to JavaScript
- `npm run build:all` - Build both Angular and server
- `npm run test` - Run Angular unit tests
- `npm run api` - Start API server
- `npm run api:dev` - Start API server with hot reload
- `npm run dev` - Start both Angular and API servers
- `npm run seed` - Seed the database with test data

## Architecture

### Frontend (Angular 20)

- **Standalone Components**: Modern Angular architecture without NgModules
- **Signal-based State Management**: Uses Angular signals for reactive state
- **Angular Material**: UI components and theming
- **TypeScript Strict Mode**: Enhanced type safety
- **SCSS Styling**: Component-scoped styles

### Backend (Node.js + Hono)

- **Hono Framework**: Fast, lightweight web framework
- **SQLite Database**: File-based database with Better-SQLite3
- **Drizzle ORM**: Type-safe database queries
- **TypeScript**: Full type safety on server-side
- **CORS Enabled**: Cross-origin requests from Angular dev server

### Key Features

- **Test Type Management**: Support for 24+ laboratory test types
- **Sample Selection**: Dynamic sample ID generation and selection
- **Data Entry Forms**: Type-specific entry forms for different test types
- **Type-Safe API**: Full TypeScript coverage from database to UI
- **Signal-Based Reactivity**: Modern Angular patterns throughout

## API Endpoints

Base URL: `http://localhost:3001`

- `GET /` - API health check
- `GET /api/status` - API status
- `GET /api/tests` - Get all tests (with filtering)
- `GET /api/particle-types` - Get particle type definitions
- `GET /api/test-readings` - Get test readings (with pagination)  
- `GET /api/test-stands` - Get test stands

## Database

Uses SQLite with Drizzle ORM for type-safe database operations. Database file: `lab.db`

### Seeding Data

Run `npm run seed` to populate the database with sample data including:
- Test definitions
- Particle type definitions  
- Test stands
- Sample test readings

## Development Notes

- Angular dev server runs on port 4200 with hot reload
- API server runs on port 3001 with CORS enabled for local development
- Database file is created automatically when first running the API
- TypeScript strict mode is enabled for enhanced type safety
- Uses ESLint and Prettier for code formatting

## Testing

```bash
npm test  # Run Angular unit tests with Karma/Jasmine
```

## Building for Production

```bash
npm run build:all  # Build both Angular and server code
```

This creates:
- `dist/` - Angular production build
- `dist/server/` - Compiled server JavaScript
