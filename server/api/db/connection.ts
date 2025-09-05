import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';
import * as schema from '../../db/schema';

// Initialize SQLite database connection
const dbPath = join(process.cwd(), 'lab.db');
const sqlite = new Database(dbPath);

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export the raw SQLite connection for cleanup if needed
export const sqliteConnection = sqlite;

// Utility function to close the database connection
export function closeDatabase() {
  sqlite.close();
}

// Export schema for use in API routes
export { schema };
