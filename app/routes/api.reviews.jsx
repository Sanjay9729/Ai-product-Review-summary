// routes/api.reviews.jsx
/**
 * API route for review operations
 */

import { authenticate } from "../shopify.server.js";

// In-memory storage for scraped reviews (demo purposes)
let scrapedReviews = [];

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent") || "get-reviews";

    if (intent === "get-reviews") {
      // Return mock reviews plus any scraped reviews
      const baseReviews = [
        {
          id: "1",
          productId: "123",
          productName: "Sample Product",
          rating: 5,
          title: "Great product!",
          content: "I love this product. It's exactly what I was looking for.",
          author: "John Doe",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          productId: "123",
          productName: "Sample Product",
          rating: 4,
          title: "Good quality",
          content: "Good quality product, fast shipping.",
          author: "Jane Smith",
          createdAt: new Date().toISOString(),
        },
      ];
      
      const allReviews = [...baseReviews, ...scrapedReviews];

      return new Response(
        JSON.stringify({
          success: true,
          reviews: allReviews,
          total: allReviews.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid intent" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in reviews API:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const action = async ({ request }) => {
  try {
    await authenticate.admin(request);

    const text = await request.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Could not parse JSON body:", text);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON body in request",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { intent, productId } = body || {};

    if (intent === "scrape-reviews") {
      // Generate some mock scraped reviews
      const mockScrapedReviews = [
        {
          id: `scraped-${Date.now()}-1`,
          productId: productId || "demo-product-123",
          productName: "Demo Product",
          rating: 5,
          title: "Amazing quality!",
          content: "This product exceeded all my expectations. Highly recommended!",
          author: "Scraped User 1",
          createdAt: new Date().toISOString(),
        },
        {
          id: `scraped-${Date.now()}-2`,
          productId: productId || "demo-product-123",
          productName: "Demo Product",
          rating: 4,
          title: "Good value for money",
          content: "Solid product at a reasonable price. Would buy again.",
          author: "Scraped User 2",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: `scraped-${Date.now()}-3`,
          productId: productId || "demo-product-123",
          productName: "Demo Product",
          rating: 3,
          title: "Average experience",
          content: "The product is okay, but I expected better for the price.",
          author: "Scraped User 3",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        }
      ];

      // Add the scraped reviews to storage
      scrapedReviews.push(...mockScrapedReviews);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully scraped ${mockScrapedReviews.length} reviews`,
          productId: productId || "demo-product-123",
          reviewsCount: mockScrapedReviews.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid intent",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in reviews API action:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};