import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server.js";
import {
  syncProductsFromShopify,
  getAllProducts,
  getProductById,
  searchProducts,
} from "../../backend/controllers/productController.js";

// Dedicated API endpoint for product operations
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  try {
    switch (intent) {
      case "get-products":
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const products = await getAllProducts(limit, page);
        return new Response(JSON.stringify(products), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });

      case "get-product":
        const productId = url.searchParams.get("id");
        if (!productId) {
          return new Response(JSON.stringify({ success: false, error: "Product ID required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const product = await getProductById(productId);
        return new Response(JSON.stringify(product), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });

      case "health":
        return new Response(JSON.stringify({ status: "OK", timestamp: new Date().toISOString() }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });

      default:
        return new Response(JSON.stringify({ success: false, error: "Invalid intent" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
  } catch (error) {
    console.error("API Loader error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    const body = await request.json();
    const { intent } = body;

    switch (intent) {
      case "sync-products":
        const syncResult = await syncProductsFromShopify(admin);
        return new Response(JSON.stringify(syncResult), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });

      case "search-products":
        const { searchTerm, page, limit } = body;
        const searchResult = await searchProducts(searchTerm, limit, page);
        return new Response(JSON.stringify(searchResult), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid intent. Use "sync-products" or "search-products"'
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
  } catch (error) {
    console.error("API Action error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const headers = boundary.headers;