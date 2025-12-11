// backend/services/judgeMeScraper.js
const axios = require('axios');

class JudgeMeScraper {
  constructor() {
    this.baseUrl = 'https://judge.me/api/v1';
    this.apiKey = process.env.JUDGEME_API_KEY;
    this.shopDomain = process.env.SHOP_DOMAIN;
  }

  /**
   * Get reviews from JudgeMe API for a specific product
   */
  async getProductReviews(productId, limit = 50) {
    try {
      if (!this.apiKey) {
        throw new Error('JudgeMe API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/reviews`, {
        params: {
          token: this.apiKey,
          product_id: productId,
          per_page: limit,
          order: 'desc'
        },
        timeout: 10000
      });

      return {
        success: true,
        reviews: response.data.reviews || [],
        total: response.data.total || 0
      };

    } catch (error) {
      console.error('Error fetching JudgeMe reviews:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch JudgeMe reviews',
        reviews: [],
        total: 0
      };
    }
  }

  /**
   * Get all products from JudgeMe
   */
  async getProducts(limit = 100) {
    try {
      if (!this.apiKey) {
        throw new Error('JudgeMe API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/products`, {
        params: {
          token: this.apiKey,
          per_page: limit
        },
        timeout: 10000
      });

      return {
        success: true,
        products: response.data.products || []
      };

    } catch (error) {
      console.error('Error fetching JudgeMe products:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch JudgeMe products',
        products: []
      };
    }
  }

  /**
   * Transform JudgeMe review data to our format
   */
  transformReview(review, productId, productName) {
    return {
      id: `judgeme_${review.id}`,
      productId: productId,
      productName: productName,
      rating: review.score || review.rating || 0,
      title: review.title || '',
      content: review.body || review.content || '',
      author: review.author_name || 'Anonymous',
      source: 'judgeme',
      createdAt: review.created_at || review.createdAt,
      verified: review.verified || false,
      helpful_count: review.helpful_count || 0,
      images: review.pictures ? review.pictures.map(pic => pic.url) : []
    };
  }

  /**
   * Scrape reviews for a specific product
   */
  async scrapeProductReviews(productId, productName, limit = 50) {
    try {
      const result = await this.getProductReviews(productId, limit);
      
      if (!result.success) {
        return result;
      }

      const transformedReviews = result.reviews.map(review => 
        this.transformReview(review, productId, productName)
      );

      return {
        success: true,
        productId: productId,
        productName: productName,
        reviews: transformedReviews,
        total: result.total,
        source: 'judgeme'
      };

    } catch (error) {
      console.error(`Error scraping JudgeMe reviews for product ${productId}:`, error);
      return {
        success: false,
        productId: productId,
        productName: productName,
        error: error.message || 'Failed to scrape JudgeMe reviews',
        reviews: []
      };
    }
  }

  /**
   * Bulk scrape reviews for multiple products
   */
  async bulkScrapeProducts(products, limit = 20) {
    const results = [];
    
    for (const product of products.slice(0, limit)) {
      try {
        const result = await this.scrapeProductReviews(product.id, product.name);
        results.push(result);
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error scraping product ${product.id}:`, error);
        results.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: error.message,
          reviews: []
        });
      }
    }
    
    return results;
  }

  /**
   * Health check for JudgeMe API
   */
  async healthCheck() {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'JudgeMe API key not configured'
        };
      }

      // Test API connection with a minimal request
      const response = await axios.get(`${this.baseUrl}/products`, {
        params: {
          token: this.apiKey,
          per_page: 1
        },
        timeout: 5000
      });

      return {
        success: true,
        message: 'JudgeMe API is accessible',
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'JudgeMe API health check failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get review statistics for a product
   */
  async getProductReviewStats(productId) {
    try {
      const result = await this.getProductReviews(productId, 1000); // Get all reviews for stats
      
      if (!result.success) {
        return result;
      }

      const reviews = result.reviews;
      const stats = {
        totalReviews: reviews.length,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedCount: 0,
        withImagesCount: 0
      };

      if (reviews.length > 0) {
        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + (review.score || review.rating || 0), 0);
        stats.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

        // Rating distribution
        reviews.forEach(review => {
          const rating = Math.round(review.score || review.rating || 0);
          if (rating >= 1 && rating <= 5) {
            stats.ratingDistribution[rating]++;
          }
        });

        // Count verified reviews
        stats.verifiedCount = reviews.filter(review => review.verified).length;

        // Count reviews with images
        stats.withImagesCount = reviews.filter(review => 
          review.pictures && review.pictures.length > 0
        ).length;
      }

      return {
        success: true,
        productId: productId,
        stats: stats
      };

    } catch (error) {
      console.error(`Error getting review stats for product ${productId}:`, error);
      return {
        success: false,
        productId: productId,
        error: error.message || 'Failed to get review statistics'
      };
    }
  }
}

module.exports = new JudgeMeScraper();