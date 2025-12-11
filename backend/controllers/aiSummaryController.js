// backend/controllers/aiSummaryController.js
import { Groq } from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock-api-key'
});

class AISummaryController {
  /**
   * Generate AI summary for a product using Groq
   */
  async generateSummary(reviews, productName) {
    try {
      if (!reviews || reviews.length === 0) {
        throw new Error('No reviews provided for summary generation');
      }

      // Prepare review data for AI processing
      const reviewText = reviews.map(review => 
        `Rating: ${review.rating}/5, Title: "${review.title}", Content: "${review.content}"`
      ).join('\n');

      // Create prompt for Groq
      const prompt = `
        Analyze the following product reviews and provide a concise summary of customer feedback:
        
        Product: ${productName}
        
        Reviews:
        ${reviewText}
        
        Please provide:
        1. A brief summary (2-3 sentences) highlighting key points
        2. Overall sentiment (positive/negative/mixed)
        3. Common pros and cons mentioned
        
        Format the response as JSON with keys: summary, sentiment, pros, cons
      `;

      // Make API call to Groq
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes customer reviews and provides concise summaries."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 500
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      // Try to parse JSON response, fallback to text processing
      try {
        const parsed = JSON.parse(responseText);
        return {
          success: true,
          summary: parsed.summary || responseText,
          sentiment: parsed.sentiment || 'mixed',
          pros: parsed.pros || [],
          cons: parsed.cons || [],
          rawResponse: responseText
        };
      } catch (parseError) {
        // Fallback: use the response text as summary
        return {
          success: true,
          summary: responseText,
          sentiment: 'mixed',
          pros: [],
          cons: [],
          rawResponse: responseText
        };
      }

    } catch (error) {
      console.error('Error generating AI summary:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate AI summary',
        summary: `Based on customer reviews, this ${productName} has received mixed feedback from users.`
      };
    }
  }

  /**
   * Generate summaries for multiple products
   */
  async generateBulkSummaries(products) {
    const results = [];
    
    for (const product of products) {
      try {
        const summary = await this.generateSummary(product.reviews, product.name);
        results.push({
          productId: product.id,
          productName: product.name,
          ...summary
        });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        results.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Health check for AI service
   */
  async healthCheck() {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: "Say 'AI service is working' if you can see this message."
          }
        ],
        model: "llama-3.1-8b-instant",
        max_tokens: 10
      });

      return {
        success: true,
        message: 'AI service is operational',
        model: 'llama-3.1-8b-instant',
        response: completion.choices[0]?.message?.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'AI service health check failed'
      };
    }
  }
}

export default new AISummaryController();