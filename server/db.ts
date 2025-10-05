import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket to accept self-signed certificates in development
class CustomWebSocket extends ws {
  constructor(url: any, protocols?: any) {
    super(url, protocols, {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    });
  }
}

neonConfig.webSocketConstructor = CustomWebSocket as any;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
export const pool = new Pool({ 
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? undefined : false
});
export const db = drizzle({ client: pool, schema });