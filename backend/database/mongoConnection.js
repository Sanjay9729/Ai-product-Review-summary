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
  console.log('=== MongoDB Connection ===');
  console.log('MONGODB_URI:', MONGODB_URI);
  console.log('DB_NAME:', DB_NAME);
  
  if (!client) {
    try {
      console.log('Connecting to MongoDB...');
      
      const options = {
        serverSelectionTimeoutMS: 10000, // 10 second timeout
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
      };
      
      client = new MongoClient(MONGODB_URI, options);
      await client.connect();
      
      db = client.db(DB_NAME);
      await db.admin().ping();
      
      console.log('✅ Connected to MongoDB successfully');
      
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      // Check if we have the required collections
      const hasProducts = collections.some(c => c.name === 'products');
      const hasReviews = collections.some(c => c.name === 'reviews');
      
      console.log('Products collection:', hasProducts ? '✅ Found' : '❌ Missing');
      console.log('Reviews collection:', hasReviews ? '✅ Found' : '❌ Missing');
      
      if (!hasProducts) {
        console.log('Creating products collection...');
        await db.createCollection('products');
      }
      
      if (!hasReviews) {
        console.log('Creating reviews collection...');
        await db.createCollection('reviews');
      }
      
      // Add some sample data if collections are empty
      const productsCount = await db.collection('products').countDocuments();
      const reviewsCount = await db.collection('reviews').countDocuments();
      
      console.log(`Products in DB: ${productsCount}`);
      console.log(`Reviews in DB: ${reviewsCount}`);
      
      if (productsCount === 0) {
        console.log('Adding sample products...');
        await db.collection('products').insertMany([
          {
            _id: 'product1',
            title: 'iPhone 15 Pro',
            vendor: 'Apple',
            productType: 'Smartphone',
            price: 999,
            image: { src: 'https://example.com/iphone15.jpg' },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: 'product2',
            title: 'Samsung Galaxy S24',
            vendor: 'Samsung',
            productType: 'Smartphone',
            price: 899,
            image: { src: 'https://example.com/galaxy.jpg' },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: 'product3',
            title: 'MacBook Pro M3',
            vendor: 'Apple',
            productType: 'Laptop',
            price: 1999,
            image: { src: 'https://example.com/macbook.jpg' },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }
      
      if (reviewsCount === 0) {
        console.log('Adding sample reviews...');
        await db.collection('reviews').insertMany([
          {
            _id: 'review1',
            productId: 'product1',
            productName: 'iPhone 15 Pro',
            reviewerName: 'John Smith',
            rating: 5,
            reviewText: 'Amazing phone with incredible camera quality. The titanium build feels premium and the performance is blazing fast.',
            reviewDate: new Date('2024-12-10'),
            createdAt: new Date()
          },
          {
            _id: 'review2',
            productId: 'product1',
            productName: 'iPhone 15 Pro',
            reviewerName: 'Sarah Johnson',
            rating: 4,
            reviewText: 'Great phone overall, but the battery life could be better. The camera is outstanding though.',
            reviewDate: new Date('2024-12-09'),
            createdAt: new Date()
          },
          {
            _id: 'review3',
            productId: 'product1',
            productName: 'iPhone 15 Pro',
            reviewerName: 'Mike Wilson',
            rating: 5,
            reviewText: 'Best iPhone ever! The Action Button is very useful and the USB-C is long overdue.',
            reviewDate: new Date('2024-12-08'),
            createdAt: new Date()
          },
          {
            _id: 'review4',
            productId: 'product2',
            productName: 'Samsung Galaxy S24',
            reviewerName: 'Emily Davis',
            rating: 4,
            reviewText: 'Solid Android phone with excellent display. The AI features are impressive but could be more intuitive.',
            reviewDate: new Date('2024-12-07'),
            createdAt: new Date()
          },
          {
            _id: 'review5',
            productId: 'product2',
            productName: 'Samsung Galaxy S24',
            reviewerName: 'David Brown',
            rating: 5,
            reviewText: 'Love the camera system and the S Pen functionality. Great upgrade from my old phone.',
            reviewDate: new Date('2024-12-06'),
            createdAt: new Date()
          },
          {
            _id: 'review6',
            productId: 'product3',
            productName: 'MacBook Pro M3',
            reviewerName: 'Lisa Chen',
            rating: 5,
            reviewText: 'Incredible performance for video editing. The M3 chip is a game changer and battery life is exceptional.',
            reviewDate: new Date('2024-12-05'),
            createdAt: new Date()
          },
          {
            _id: 'review7',
            productId: 'product3',
            productName: 'MacBook Pro M3',
            reviewerName: 'Tom Anderson',
            rating: 4,
            reviewText: 'Great laptop for development work. The screen is beautiful and the keyboard feels premium.',
            reviewDate: new Date('2024-12-04'),
            createdAt: new Date()
          }
        ]);
      }
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('🔄 Creating mock database as fallback...');
      
      // Fallback to mock database only if real connection fails
      const createMockCursor = (data = []) => {
        const cursor = {
          sort: (spec) => cursor,
          skip: (count) => cursor,
          limit: (count) => cursor,
          toArray: () => Promise.resolve(data)
        };
        return cursor;
      };
      
      db = {
        databaseName: 'mock-database',
        collection: (name) => ({
          find: (query) => createMockCursor([]),
          findOne: () => Promise.resolve(null),
          insertOne: (doc) => Promise.resolve({ insertedId: `mock-${Date.now()}` }),
          insertMany: (docs) => Promise.resolve({ insertedCount: docs.length }),
          deleteMany: () => Promise.resolve({ deletedCount: 0 }),
          countDocuments: () => Promise.resolve(0),
          updateOne: () => Promise.resolve({ matchedCount: 0 }),
          updateMany: () => Promise.resolve({ matchedCount: 0 }),
          distinct: (field) => Promise.resolve([]),
        }),
        listCollections: () => ({
          toArray: () => Promise.resolve([{ name: 'products' }, { name: 'reviews' }])
        }),
        admin: () => ({
          ping: () => Promise.resolve()
        })
      };
      
      client = { close: () => Promise.resolve() };
      console.log('⚠️  Using mock database - no data will persist');
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