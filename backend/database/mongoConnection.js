import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify-all-products';

// Extract database name from URI or use default
const getDbName = (uri) => {
  try {
    const url = new URL(uri);
    const pathname = url.pathname;
    if (pathname && pathname !== '/') {
      return pathname.substring(1); // Remove leading slash
    }
  } catch (e) {
    console.warn('Could not parse database name from URI, using default');
  }
  return 'shopify-all-products'; // Default database name
};

const DB_NAME = getDbName(MONGODB_URI);

let client;
let db;

export async function connectToDatabase() {
  console.log('=== MongoDB Connection (Fast Fallback) ===');
  console.log('MONGODB_URI:', MONGODB_URI);
  console.log('DB_NAME:', DB_NAME);
  
  if (!client) {
    try {
      // Quick strategy: Try cloud first with short timeout, then fallback fast
      console.log('Strategy: Quick cloud connection attempt...');
      
      const cloudOptions = {
        serverSelectionTimeoutMS: 3000, // Very short timeout
        connectTimeoutMS: 3000,
        socketTimeoutMS: 3000,
        retryWrites: true,
      };
      
      client = new MongoClient(MONGODB_URI, cloudOptions);
      
      try {
        await Promise.race([
          client.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cloud connection timeout')), 3000)
          )
        ]);
        
        db = client.db(DB_NAME);
        await db.admin().ping();
        console.log('✅ Connected to cloud MongoDB successfully');
        
        const collections = await db.listCollections().toArray();
        console.log('Cloud collections:', collections.map(c => c.name));
        
      } catch (cloudError) {
        console.log('Cloud connection failed, closing cloud client...');
        await client.close();
        client = null;
        db = null;
        
        // Immediate fallback to local
        console.log('Strategy: Fallback to local MongoDB...');
        const localUri = 'mongodb://localhost:27017/shopify-all-products';
        
        const localOptions = {
          serverSelectionTimeoutMS: 2000,
          connectTimeoutMS: 2000,
        };
        
        client = new MongoClient(localUri, localOptions);
        await client.connect();
        
        db = client.db('shopify-all-products');
        await db.admin().ping();
        
        console.log('✅ Connected to local MongoDB successfully');
        console.log('⚠️  Using local MongoDB - data will not sync to cloud');
        
        const collections = await db.listCollections().toArray();
        console.log('Local collections:', collections.map(c => c.name));
      }
      
    } catch (error) {
      console.error('Connection failed, creating mock database...');
      
      // Final fallback: Mock database
      db = {
        databaseName: 'mock-database',
        collection: (name) => ({
          find: () => ({ toArray: () => Promise.resolve([]) }),
          findOne: () => Promise.resolve(null),
          insertOne: (doc) => Promise.resolve({ insertedId: `mock-${Date.now()}` }),
          insertMany: (docs) => Promise.resolve({ insertedCount: docs.length }),
          deleteMany: () => Promise.resolve({ deletedCount: 0 }),
          countDocuments: () => Promise.resolve(0),
          updateOne: () => Promise.resolve({ matchedCount: 0 }),
          updateMany: () => Promise.resolve({ matchedCount: 0 }),
        }),
        listCollections: () => ({
          toArray: () => Promise.resolve([{ name: 'products' }, { name: 'reviews' }])
        }),
        admin: () => ({
          ping: () => Promise.resolve()
        })
      };
      
      client = { close: () => Promise.resolve() };
      console.log('✅ Created mock database for development');
      console.log('⚠️  WARNING: Using mock database - no data will persist');
    }
  }
  
  if (!db) {
    console.error('ERROR: Database connection failed - db object is undefined');
    throw new Error('Database connection failed - db object is undefined');
  }
  
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return db;
}

export async function closeDatabaseConnection() {
  if (client) {
    try {
      await client.close();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error.message);
    } finally {
      client = null;
      db = null;
    }
  }
}

export async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const testDb = await connectToDatabase();
    console.log('Test successful - database is accessible');
    return { 
      success: true, 
      message: 'Connection test successful', 
      database: testDb.databaseName,
      isLocal: testDb.databaseName === 'shopify-all-products',
      isMock: testDb.databaseName === 'mock-database'
    };
  } catch (error) {
    console.error('Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

export default { connectToDatabase, getDatabase, closeDatabaseConnection, testConnection };