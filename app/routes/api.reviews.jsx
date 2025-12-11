// // routes/api.reviews.jsx
// /**
//  * API route for review operations
//  */

// import { authenticate } from "../shopify.server.js";
// import { getAllReviews, deleteReview } from "../../backend/controllers/reviewScraperController.js";
// import { ObjectId } from "mongodb";

// export const loader = async ({ request }) => {
//   try {
//     await authenticate.admin(request);

//     const url = new URL(request.url);
//     const intent = url.searchParams.get("intent");
//     const page = parseInt(url.searchParams.get("page") || "1");
//     const limit = parseInt(url.searchParams.get("limit") || "20");

//     if (intent === "get-all-reviews") {
//       // Fetch reviews from MongoDB via controller
//       const result = await getAllReviews(limit, page);

//       return new Response(
//         JSON.stringify(result),
//         {
//           status: 200,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     return new Response(
//       JSON.stringify({ success: false, error: "Invalid intent" }),
//       {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   } catch (error) {
//     console.error("Error in reviews API:", error);
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

// export const action = async ({ request }) => {
//   try {
//     await authenticate.admin(request);

//     const text = await request.text();
//     let body = {};
//     try {
//       body = text ? JSON.parse(text) : {};
//     } catch (e) {
//       console.error("Could not parse JSON body:", text);
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: "Invalid JSON body in request",
//         }),
//         {
//           status: 400,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     const { intent, reviewId } = body || {};

//     if (intent === "scrape-reviews") {
//       // Import the scraper function dynamically
//       const { scrapeJudgeMeReviews } = await import(
//         "../../backend/controllers/reviewScraperController.js"
//       );

//       // Call the actual scraper
//       const result = await scrapeJudgeMeReviews();

//       return new Response(
//         JSON.stringify(result),
//         {
//           status: result.success ? 200 : 400,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     if (intent === "delete-review") {
//       if (!reviewId) {
//         return new Response(
//           JSON.stringify({
//             success: false,
//             error: "reviewId is required",
//           }),
//           {
//             status: 400,
//             headers: { "Content-Type": "application/json" },
//           }
//         );
//       }

//       // Convert string ID to ObjectId
//       const objectId = new ObjectId(reviewId);
//       const result = await deleteReview(objectId);

//       return new Response(
//         JSON.stringify(result),
//         {
//           status: result.success ? 200 : 400,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: "Invalid intent",
//       }),
//       {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   } catch (error) {
//     console.error("Error in reviews API action:", error);
//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: error.message || "An unexpected error occurred",
//       }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// };




// app/routes/api.reviews.jsx

import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  scrapeJudgeMeReviews,
  getAllReviews,
  deleteReview,
} from "../../backend/controllers/reviewScraperController";

// GET: used for listing reviews and (optionally) triggering scrape via query
export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent") || "get-all-reviews";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    switch (intent) {
      case "get-all-reviews": {
        // getAllReviews already returns { success, reviews, pagination, error? }
        const result = await getAllReviews(limit, page);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "scrape-reviews": {
        const result = await scrapeJudgeMeReviews();
        // result already contains: success, message, reviewsScraped, needsJudgeMeSetup, etc.
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      default:
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
    }
  } catch (error) {
    console.error("Error in reviews loader:", error);
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

// POST: used for scraping + delete
export const action = async ({ request }) => {
  try {
    await authenticate.admin(request);

    const body = await request.json();
    const { intent, reviewId, page, limit } = body || {};

    switch (intent) {
      case "scrape-reviews": {
        const result = await scrapeJudgeMeReviews();
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "delete-review": {
        if (!reviewId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Review ID is required",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const result = await deleteReview(reviewId);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "get-all-reviews": {
        // Optional: support POST-based fetch if you ever need it
        const pageNum = parseInt(page || "1", 10);
        const limitNum = parseInt(limit || "20", 10);
        const result = await getAllReviews(limitNum, pageNum);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      default:
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
    }
  } catch (error) {
    console.error("Error in reviews action:", error);
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

export const headers = boundary.headers;
