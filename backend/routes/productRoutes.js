import express from 'express';
const router = express.Router();
import {
  syncProductsFromShopify,
  getAllProducts,
  getProductById,
  searchProducts,
} from '../controllers/productController.js';

// GET /api/products - Get all products with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await getAllProducts(limit, page);
    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/products/:id - Get specific product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getProductById(id);
    
    if (!result.product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/products - Create new action based on intent
router.post('/', async (req, res) => {
  try {
    const { intent } = req.body;

    switch (intent) {
      case 'sync-products':
        const syncResult = await syncProductsFromShopify();
        return res.json(syncResult);

      case 'search-products':
        const { searchTerm, page, limit } = req.body;
        const searchResult = await searchProducts(searchTerm, limit, page);
        return res.json(searchResult);

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid intent. Use "sync-products" or "search-products"'
        });
    }
  } catch (error) {
    console.error('API Action error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;