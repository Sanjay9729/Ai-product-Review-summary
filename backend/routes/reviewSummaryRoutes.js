// backend/routes/reviewSummaryRoutes.js
import express from 'express';
const router = express.Router();
import {
  getAllReviewSummaries,
  generateSummaryForProduct,
  generateAllSummaries,
  getReviewSummaryByProductIdController
} from '../controllers/reviewSummaryController.js';

// GET /api/review-summaries - Get all review summaries with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getAllReviewSummaries(req, res);
    // The controller already sends the response, so we don't need to handle it here
  } catch (error) {
    console.error('Error fetching review summaries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/review-summaries/:productId - Get existing summary for specific product
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    await getReviewSummaryByProductIdController(req, res);
    // The controller already sends the response
  } catch (error) {
    console.error('Error fetching review summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/review-summaries/generate/:productId - Generate summary for specific product
router.get('/generate/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    await generateSummaryForProduct(req, res);
    // The controller already sends the response
  } catch (error) {
    console.error('Error generating review summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/review-summaries/generate-all - Generate summaries for all products
router.get('/generate-all', async (req, res) => {
  try {
    await generateAllSummaries(req, res);
    // The controller already sends the response
  } catch (error) {
    console.error('Error generating review summaries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;