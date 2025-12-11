// app/routes/apps.ai-review-summary.jsx

/**
 * App Proxy endpoint for fetching AI Judge.me review summaries
 * Called from theme as:  /apps/ai-review-summary?product=PRODUCT_TITLE
 */

import { connectToDatabase } from "../../database/mongoConnection.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productTitle = url.searchParams.get("product");

  if (!productTitle) {
    return new Response(
      JSON.stringify({ success: false, error: "Product title required" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const db = await connectToDatabase();

    // ✅ This is where your Groq Judge.me AI summaries are stored
    const summariesCollection = db.collection("review_summaries");

    // Case-insensitive match on productName
    const summaryDoc = await summariesCollection.findOne({
      productName: { $regex: `^${productTitle}$`, $options: "i" },
    });

    if (!summaryDoc) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No AI review summary found for this product",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        // 👇 AI summary generated from Judge.me reviews
        summary: summaryDoc.summary,
        productName: summaryDoc.productName,
        reviewCount: summaryDoc.reviewCount || 0,
        averageRating: summaryDoc.averageRating || 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching AI Judge.me review summary:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
