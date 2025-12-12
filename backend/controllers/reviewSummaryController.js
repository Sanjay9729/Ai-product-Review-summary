// backend/controllers/reviewSummaryController.js
import { 
  getReviewSummaries, 
  generateReviewSummaryForProduct, 
  generateReviewSummariesForAllProducts 
} from '../services/reviewSummaryService.js';

/**
 * Get paginated review summaries
 */
async function getAllReviewSummaries(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getReviewSummaries(limit, page);
    res.json(result);
  } catch (error) {
    console.error('Error fetching review summaries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Generate summary for a specific product
 */
async function generateSummaryForProduct(req, res) {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    const result = await generateReviewSummaryForProduct(productId);
    res.json(result);
  } catch (error) {
    console.error('Error generating review summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Generate summaries for all products that have reviews
 */
async function generateAllSummaries(req, res) {
  try {
    const result = await generateReviewSummariesForAllProducts();
    res.json(result);
  } catch (error) {
    console.error('Error generating review summaries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export {
  getAllReviewSummaries,
  generateSummaryForProduct,
  generateAllSummaries
};