// // app/routes/apps.ai-review-summary.jsx

// /**
//  * App Proxy endpoint for fetching AI Judge.me review summaries
//  * Called from theme as:  /apps/ai-review-summary?product=PRODUCT_TITLE
//  */

// import { connectToDatabase } from "../../backend/database/mongoConnection.js";

// export const loader = async ({ request }) => {
//   const url = new URL(request.url);
//   const productTitle = url.searchParams.get("product");

//   if (!productTitle) {
//     return new Response(
//       JSON.stringify({ success: false, error: "Product title required" }),
//       {
//         status: 400,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//   }

//   try {
//     const db = await connectToDatabase();

//     // ✅ This is where your Groq Judge.me AI summaries are stored
//     const summariesCollection = db.collection("review_summaries");

//     // Case-insensitive match on productName
//     const summaryDoc = await summariesCollection.findOne({
//       productName: { $regex: `^${productTitle}$`, $options: "i" },
//     });

//     if (!summaryDoc) {
//       return new Response(
//         JSON.stringify({
//           success: false,
//           message: "No AI review summary found for this product",
//         }),
//         {
//           status: 200,
//           headers: {
//             "Content-Type": "application/json",
//           },
//         }
//       );
//     }

//     return new Response(
//       JSON.stringify({
//         success: true,
//         // 👇 AI summary generated from Judge.me reviews
//         summary: summaryDoc.summary,
//         productName: summaryDoc.productName,
//         reviewCount: summaryDoc.reviewCount || 0,
//         averageRating: summaryDoc.averageRating || 0,
//       }),
//       {
//         status: 200,
//         headers: {
//           "Content-Type": "application/json",
//           "Cache-Control": "public, max-age=3600",
//         },
//       }
//     );
//   } catch (error) {
//     console.error("Error fetching AI Judge.me review summary:", error);
//     return new Response(
//       JSON.stringify({ success: false, error: error.message }),
//       {
//         status: 500,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//   }
// };


import { connectToDatabase } from "../../backend/database/mongoConnection.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productTitle = url.searchParams.get("product");
  const type = url.searchParams.get("type"); // 'summary' or 'review'

  if (!productTitle) {
    return new Response(JSON.stringify({ success: false, error: "Product title required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const db = await connectToDatabase();

    if(type === "summary"){
      const summaryCollection = db.collection("product_summaries");
      const summaryDoc = await summaryCollection.findOne({
        productName: { $regex: `^${productTitle}$`, $options: "i" },
      });

      if(!summaryDoc){
        return new Response(JSON.stringify({ success: false, message: "No AI summary found" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        summary: summaryDoc.summary,
        suggestions: summaryDoc.suggestions,
        productName: summaryDoc.productName
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" }
      });
    }

    if(type === "review"){
      const reviewCollection = db.collection("review_summaries");
      const reviewDoc = await reviewCollection.findOne({
        productName: { $regex: `^${productTitle}$`, $options: "i" },
      });

      if(!reviewDoc){
        return new Response(JSON.stringify({ success: false, message: "No AI review summary found" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        summary: reviewDoc.summary,
        suggestions: reviewDoc.suggestions,
        productName: reviewDoc.productName,
        reviewCount: reviewDoc.reviewCount || 0,
        averageRating: reviewDoc.averageRating || 0,
        reviews: reviewDoc.reviews || []
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" }
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid type parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching AI data:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
