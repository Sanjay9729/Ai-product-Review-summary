// backend/routes/summaryRoutes.js
// This handles AI Product Summaries (from product_summaries collection)
import express from 'express';
const router = express.Router();
import {
  generateProductSummaryForAllProducts,
  generateProductSummaryForProduct,
  getProductSummaries,
} from '../services/productSummaryService.js';

// GET /api/summaries - Get all summaries with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const intent = req.query.intent || 'get-summaries';

    if (intent === 'get-summaries') {
      const result = await getProductSummaries(limit, page);
      return res.status(result.success ? 200 : 500).json(result);
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid intent for GET request'
    });
  } catch (error) {
    console.error('Error in summaries API (GET):', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/summaries - Handle summary generation requests
router.post('/', async (req, res) => {
  try {
    const { intent, productId, page, limit } = req.body || {};

    if (intent === 'generate-all-summaries') {
      const result = await generateProductSummaryForAllProducts();
      return res.status(result.success ? 200 : 500).json(result);
    }

    if (intent === 'generate-summary') {
      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'productId is required'
        });
      }

      const result = await generateProductSummaryForProduct(productId);
      return res.status(result.success ? 200 : 500).json(result);
    }

    if (intent === 'get-summaries') {
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '20', 10);
      const result = await getProductSummaries(limitNum, pageNum);
      return res.status(result.success ? 200 : 500).json(result);
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid intent'
    });
  } catch (error) {
    console.error('Error in summaries API (POST):', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;