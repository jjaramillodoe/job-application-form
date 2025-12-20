import { MongoClient } from 'mongodb';

const options = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Timeout for socket operations
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

function getClientPromise(): Promise<MongoClient> {
  // Check if we're in a build context
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || 
                  process.env.NEXT_PHASE === 'phase-export';
  
  // During build, return a promise that will fail gracefully when awaited
  // but won't crash the build process
  if (!process.env.MONGODB_URI) {
    if (isBuild) {
      // Return a promise that will be rejected when awaited, but not during module load
      // This allows the build to complete, but the route will fail at runtime if env vars aren't set
      return Promise.reject(new Error('MongoDB URI not configured'));
    }
    throw new Error('Please add your Mongo URI to .env.local');
  }

  const uri = process.env.MONGODB_URI;

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function connectToDatabase() {
  try {
    const clientPromise = getClientPromise();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
// Handle build-time gracefully
const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || 
                process.env.NEXT_PHASE === 'phase-export';

let defaultExport: Promise<MongoClient>;
if (isBuild && !process.env.MONGODB_URI) {
  // During build without env vars, return a promise that won't be awaited during build
  // The route handlers with force-dynamic should prevent this from being called
  defaultExport = new Promise(() => {
    // Never resolves - this prevents Next.js from trying to await it during build
  }) as Promise<MongoClient>;
} else {
  try {
    defaultExport = getClientPromise();
  } catch (error) {
    defaultExport = Promise.reject(error);
  }
}

export default defaultExport;

// Graceful shutdown function (for cleanup if needed)
export async function closeConnection() {
  try {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
} 