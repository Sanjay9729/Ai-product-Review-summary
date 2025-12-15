// routes/api.summaries.jsx
/**
 * API route for AI product summary operations (product_summaries collection)
 * This generates summaries based on product descriptions, features, etc.
 */

import { authenticate } from "../shopify.server.js";
import {
  generateProductSummaryForAllProducts,
  generateProductSummaryForProduct,
  getProductSummaries,
} from "../../backend/services/productSummaryService.js";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent") || "get-summaries";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    if (intent === "get-summaries") {
      const result = await getProductSummaries(limit, page);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid intent" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in summaries API:", error);
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

    const { intent, productId, page, limit } = body || {};

    if (intent === "generate-all-summaries") {
      const result = await generateProductSummaryForAllProducts();
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (intent === "generate-summary") {
      if (!productId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "productId is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const result = await generateProductSummaryForProduct(productId);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (intent === "get-summaries") {
      const pageNum = parseInt(page || "1", 10);
      const limitNum = parseInt(limit || "20", 10);
      const result = await getProductSummaries(limitNum, pageNum);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
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
    console.error("Error in summaries API action:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};