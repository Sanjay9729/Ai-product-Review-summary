// import express from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import bodyParser from 'body-parser';
// import 'dotenv/config';

// // Import database and controllers
// import { connectToDatabase } from './database/mongoConnection.js';
// import productRoutes from './routes/productRoutes.js';

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Middleware
// app.use(cors());
// app.use(morgan('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Connect to MongoDB
// await connectToDatabase();

// // API Routes
// app.use('/api/products', productRoutes);

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'OK', timestamp: new Date().toISOString() });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     success: false, 
//     error: 'Something went wrong!',
//     message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Backend server running on port ${PORT}`);
//   console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
// });

// export default app;




// server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import 'dotenv/config';

// Import database and controllers
import { connectToDatabase } from './database/mongoConnection.js';
import productRoutes from './routes/productRoutes.js';
import reviewSummaryRoutes from './routes/reviewSummaryRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import productSummaryRoutes from './routes/productSummaryRoutes.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes (define before server start)
app.use('/api/products', productRoutes);
app.use('/api/review-summaries', reviewSummaryRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/product-summaries', productSummaryRoutes);


// Root route (Welcome message)
app.get('/', (_, res) => {  // Use `_` to indicate unused parameter
  res.send('Welcome to the AI Product Review Summary Service!');
});


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to check environment and database
app.get('/api/debug', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const productsCount = await db.collection('products').countDocuments({});
    const sampleProduct = await db.collection('products').findOne({});

    res.json({
      status: 'OK',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HAS_MONGODB_URI: !!process.env.MONGODB_URI,
        HAS_DATABASE_URL: !!process.env.DATABASE_URL,
        HAS_MONGO_URI: !!process.env.MONGO_URI,
        MONGODB_URI_LENGTH: process.env.MONGODB_URI?.length || 0,
        MONGODB_URI_PREVIEW: process.env.MONGODB_URI?.substring(0, 50) + '...' || 'NOT SET',
      },
      database: {
        connected: !!db,
        databaseName: db?.databaseName,
        productsCount,
        hasSampleProduct: !!sampleProduct,
        sampleProductTitle: sampleProduct?.title || 'No products found'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error handler:', err);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Helper: graceful shutdown
const shutdown = (signal) => {
  return async (code) => {
    console.log(`\nReceived ${signal}. Shutting down (code: ${code})...`);
    try {
      // If your DB driver exposes a close/disconnect, call it here
      if (typeof global.__MONGO_CLIENT__?.close === 'function') {
        await global.__MONGO_CLIENT__.close();
        console.log('Closed Mongo client.');
      }
    } catch (e) {
      console.warn('Error while closing resources', e);
    } finally {
      process.exit(code ?? 0);
    };
  };
};

// Start-up function with defensive checks
async function start() {
  try {
    console.log('Starting server.js', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: PORT,
      MONGO_URI_present: Boolean(process.env.MONGO_URI || process.env.DATABASE_URL)
    });

    // Fail fast with clear message if DB URL missing
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      console.error('Missing Mongo connection string. Please set MONGO_URI or DATABASE_URL env var.');
      process.exit(1);
    }

    // Connect to MongoDB with try/catch inside start to surface errors
    await connectToDatabase(); // ensure connectToDatabase throws on error
    console.log('✅ MongoDB connected');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });

    // Optional: keep server reference for graceful shutdown
    process.on('SIGINT', shutdown('SIGINT'));
    process.on('SIGTERM', shutdown('SIGTERM'));
    server.on('error', (err) => {
      console.error('Server encountered an error:', err);
      process.exit(1);
    });
  } catch (err) {
    // Top-level startup error => log full stack and exit with non-zero
    console.error('Startup error:', err);
    process.exit(1);
  }
}

// Global process-level handlers to capture any leaked errors
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
  // give logs a moment then exit
  setTimeout(() => process.exit(1), 100);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection at:', promise, 'reason:', reason);
  setTimeout(() => process.exit(1), 100);
});

// Start the app
start();

// Export app for testing (same as before)
export default app;
