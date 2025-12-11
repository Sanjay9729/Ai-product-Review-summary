// // app/routes/api.review-summaries.jsx
// import { boundary } from "@shopify/shopify-app-react-router/server";
// import { authenticate } from "../shopify.server";
// import {
//   generateReviewSummariesForAllProducts,
//   generateReviewSummaryForProduct,
//   getReviewSummaries,
// } from "../../backend/services/reviewSummaryService";

// /**
//  * GET – list summaries
//  * /api/review-summaries?intent=get-summaries&page=1&limit=20
//  */
// export const loader = async ({ request }) => {
//   try {
//     await authenticate.admin(request);

//     const url = new URL(request.url);
//     const intent = url.searchParams.get("intent") || "get-summaries";
//     const page = parseInt(url.searchParams.get("page") || "1", 10);
//     const limit = parseInt(url.searchParams.get("limit") || "20", 10);

//     switch (intent) {
//       case "get-summaries": {
//         const result = await getReviewSummaries(limit, page);
//         return new Response(JSON.stringify(result), {
//           status: result.success ? 200 : 500,
//           headers: { "Content-Type": "application/json" },
//         });
//       }

//       default:
//         return new Response(
//           JSON.stringify({
//             success: false,
//             error: "Invalid intent",
//           }),
//           {
//             status: 400,
//             headers: { "Content-Type": "application/json" },
//           }
//         );
//     }
//   } catch (error) {
//     console.error("Error in review summaries loader:", error);
//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: error.message || "Internal server error",
//       }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// };

// /**
//  * POST – generate summaries
//  * Body JSON:
//  *  { intent: "generate-all" }
//  *  { intent: "generate-product", productId: "..." }
//  */
// export const action = async ({ request }) => {
//   try {
//     await authenticate.admin(request);

//     const body = await request.json();
//     const { intent, productId, page, limit } = body || {};

//     switch (intent) {
//       case "generate-all": {
//         const result = await generateReviewSummariesForAllProducts();
//         return new Response(JSON.stringify(result), {
//           status: result.success ? 200 : 500,
//           headers: { "Content-Type": "application/json" },
//         });
//       }

//       case "generate-product": {
//         if (!productId) {
//           return new Response(
//             JSON.stringify({
//               success: false,
//               error: "productId is required",
//             }),
//             {
//               status: 400,
//               headers: { "Content-Type": "application/json" },
//             }
//           );
//         }

//         const result = await generateReviewSummaryForProduct(productId);
//         return new Response(JSON.stringify(result), {
//           status: result.success ? 200 : 500,
//           headers: { "Content-Type": "application/json" },
//         });
//       }

//       case "get-summaries": {
//         const pageNum = parseInt(page || "1", 10);
//         const limitNum = parseInt(limit || "20", 10);
//         const result = await getReviewSummaries(limitNum, pageNum);
//         return new Response(JSON.stringify(result), {
//           status: result.success ? 200 : 500,
//           headers: { "Content-Type": "application/json" },
//         });
//       }

//       default:
//         return new Response(
//           JSON.stringify({
//             success: false,
//             error: "Invalid intent",
//           }),
//           {
//             status: 400,
//             headers: { "Content-Type": "application/json" },
//           }
//         );
//     }
//   } catch (error) {
//     console.error("Error in review summaries action:", error);
//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: "An unexpected error occurred",
//       }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// };

// export const headers = boundary.headers;


// app/routes/api.review-summaries.jsx
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server.js";
import {
  generateReviewSummariesForAllProducts,
  generateReviewSummaryForProduct,
  getReviewSummaries,
} from "../../backend/services/reviewSummaryService.js";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent") || "get-summaries";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    if (intent === "get-summaries") {
      const result = await getReviewSummaries(limit, page);
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
    console.error("Error in review summaries loader:", error);
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

    // ⚠️ This is where the old "Unexpected token '<'" often comes from.
    // Make it super safe:
    const text = await request.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Could not parse JSON body in /api/review-summaries:", text);
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

    if (intent === "generate-all") {
      const result = await generateReviewSummariesForAllProducts();
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (intent === "generate-product") {
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

      const result = await generateReviewSummaryForProduct(productId);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (intent === "get-summaries") {
      const pageNum = parseInt(page || "1", 10);
      const limitNum = parseInt(limit || "20", 10);
      const result = await getReviewSummaries(limitNum, pageNum);
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
    console.error("Error in review summaries action:", error);
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

export const headers = boundary.headers;
