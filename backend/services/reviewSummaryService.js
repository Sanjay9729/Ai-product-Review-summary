// // backend/services/reviewSummaryService.js
// import Groq from "groq-sdk";
// import { connectToDatabase } from "../../database/mongoConnection.js";
// import ReviewSummary from "../../database/ReviewSummary.js";

// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// const GROQ_MODEL =
//   process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

// /**
//  * Build a compact text block from reviews to feed to AI
//  */
// function buildReviewsText(reviews) {
//   return reviews
//     .map((r, index) => {
//       const name = r.reviewerName || "Anonymous";
//       const rating = r.rating || "N/A";
//       const text = (r.reviewText || "").replace(/\s+/g, " ").trim();
//       const date = r.reviewDate
//         ? new Date(r.reviewDate).toISOString().split("T")[0]
//         : "Unknown date";

//       return `#${index + 1}
// Reviewer: ${name}
// Rating: ${rating}/5
// Date: ${date}
// Review: ${text}`;
//     })
//     .join("\n\n---\n\n");
// }

// /**
//  * Call Groq to generate a JSON summary for a product's reviews
//  */
// async function callGroqForSummary({ productName, averageRating, reviewCount, reviewsText }) {
//   const systemPrompt = `
// You are an AI assistant that creates concise, helpful review summaries for online shoppers.
// You will receive multiple customer reviews for ONE product.
// Your job is to summarize them in a clear and honest way.
// Always respond with VALID JSON ONLY. No extra text.
// JSON schema:
// {
//   "headline": "short catchy title (max 10 words)",
//   "summary": "overall summary in 100-150 words, neutral but friendly",
//   "pros": ["bullet point", "..."],
//   "cons": ["bullet point", "..."],
//   "best_for": "one short sentence describing ideal customer",
//   "rating_summary": "short text describing rating pattern (e.g., 'Most customers rate this 4–5 stars for comfort and style.')"
// }
// `;

//   const userPrompt = `
// Product name: ${productName}
// Existing rating info: Average rating ${averageRating.toFixed(
//     1
//   )}/5 from ${reviewCount} review(s).

// Here are the raw customer reviews:

// """ 
// ${reviewsText}
// """`;

//   const completion = await groq.chat.completions.create({
//     model: GROQ_MODEL,
//     temperature: 0.4,
//     max_tokens: 600,
//     messages: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: userPrompt },
//     ],
//   });

//   const content = completion.choices?.[0]?.message?.content?.trim() || "{}";

//   let parsed;
//   try {
//     parsed = JSON.parse(content);
//   } catch (err) {
//     console.warn("Failed to parse Groq JSON, falling back to raw text:", err.message);
//     parsed = {
//       headline: "Customer review summary",
//       summary: content,
//       pros: [],
//       cons: [],
//       best_for: "",
//       rating_summary: "",
//     };
//   }

//   return {
//     headline: parsed.headline || "Customer review summary",
//     summary: parsed.summary || content,
//     pros: Array.isArray(parsed.pros) ? parsed.pros : [],
//     cons: Array.isArray(parsed.cons) ? parsed.cons : [],
//     bestFor: parsed.best_for || "",
//     ratingSummary: parsed.rating_summary || "",
//   };
// }

// /**
//  * Generate (or refresh) summary for a single product
//  */
// export async function generateReviewSummaryForProduct(productId) {
//   const db = await connectToDatabase();
//   const reviewsCollection = db.collection("reviews");
//   const summariesCollection = db.collection("review_summaries");

//   const reviews = await reviewsCollection
//     .find({ productId })
//     .sort({ reviewDate: -1 })
//     .limit(100)
//     .toArray();

//   if (!reviews.length) {
//     return {
//       success: false,
//       productId,
//       error: "No reviews found for this product",
//       hasReviews: false,
//     };
//   }

//   const productName = reviews[0].productName || "Unknown Product";
//   const reviewCount = reviews.length;
//   const averageRating =
//     reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount;

//   const reviewsText = buildReviewsText(reviews);
//   const aiResult = await callGroqForSummary({
//     productName,
//     averageRating,
//     reviewCount,
//     reviewsText,
//   });

//   const summaryModel = new ReviewSummary({
//     productId,
//     productName,
//     reviewCount,
//     averageRating,
//     headline: aiResult.headline,
//     summary: aiResult.summary,
//     pros: aiResult.pros,
//     cons: aiResult.cons,
//     bestFor: aiResult.bestFor,
//     ratingSummary: aiResult.ratingSummary,
//     updatedAt: new Date(),
//   });

//   if (!summaryModel.isValid()) {
//     return {
//       success: false,
//       productId,
//       error: "Generated summary failed validation",
//     };
//   }

//   const summaryData = summaryModel.toJSON();
//   const { createdAt, updatedAt, ...dataToSave } = summaryData;

//   await summariesCollection.updateOne(
//     { productId },
//     {
//       $set: {
//         ...dataToSave,
//         updatedAt: new Date(),
//       },
//       $setOnInsert: {
//         createdAt: new Date(),
//       },
//     },
//     { upsert: true }
//   );

//   return {
//     success: true,
//     productId,
//     productName,
//     reviewCount,
//     averageRating,
//     summary: {
//       headline: summaryModel.headline,
//       summary: summaryModel.summary,
//       pros: summaryModel.pros,
//       cons: summaryModel.cons,
//       bestFor: summaryModel.bestFor,
//       ratingSummary: summaryModel.ratingSummary,
//     },
//   };
// }

// /**
//  * Generate summaries for ALL products that have reviews
//  */
// export async function generateReviewSummariesForAllProducts() {
//   const db = await connectToDatabase();
//   const reviewsCollection = db.collection("reviews");

//   const productIds = await reviewsCollection.distinct("productId", {});

//   if (!productIds.length) {
//     return {
//       success: false,
//       generatedFor: 0,
//       error: "No reviews found in database. Scrape reviews first.",
//     };
//   }

//   const results = [];
//   let successCount = 0;

//   for (const productId of productIds) {
//     try {
//       const result = await generateReviewSummaryForProduct(productId);
//       results.push(result);
//       if (result.success) successCount++;
//     } catch (err) {
//       console.error(`Error generating summary for product ${productId}:`, err.message);
//       results.push({
//         success: false,
//         productId,
//         error: err.message,
//       });
//     }

//     // small delay to avoid hammering Groq
//     await new Promise((r) => setTimeout(r, 800));
//   }

//   return {
//     success: true,
//     generatedFor: successCount,
//     totalProducts: productIds.length,
//     results,
//   };
// }

// /**
//  * Paginated fetch for summaries
//  */
// export async function getReviewSummaries(limit = 20, page = 1) {
//   try {
//     const db = await connectToDatabase();
//     const summariesCollection = db.collection("review_summaries");

//     const skip = (page - 1) * limit;

//     const summaries = await summariesCollection
//       .find({})
//       .sort({ updatedAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .toArray();

//     const total = await summariesCollection.countDocuments({});

//     return {
//       success: true,
//       summaries,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit) || 1,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching review summaries:", error);
//     return {
//       success: false,
//       error: error.message,
//       summaries: [],
//     };
//   }
// }


// backend/services/reviewSummaryService.js
import Groq from "groq-sdk";
import { connectToDatabase } from "../database/mongoConnection.js";
import ReviewSummary from "../database/ReviewSummary.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL =
  process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

/**
 * Turn raw reviews into plain text for the AI
 */
function buildReviewsText(reviews) {
  return reviews
    .map((r, index) => {
      const name = r.reviewerName || "Anonymous";
      const rating = r.rating || "N/A";
      const text = (r.reviewText || "").replace(/\s+/g, " ").trim();
      const date = r.reviewDate
        ? new Date(r.reviewDate).toISOString().split("T")[0]
        : "Unknown date";

      return `#${index + 1}
Reviewer: ${name}
Rating: ${rating}/5
Date: ${date}
Review: ${text}`;
    })
    .join("\n\n---\n\n");
}

/**
 * Clean Groq output:
 * - remove ``` ``` code fences
 * - trim spaces
 */
function cleanAIText(text) {
  if (!text) return "";
  let t = text.trim();

  // Remove markdown code fences if present
  if (t.startsWith("```")) {
    // Remove first line ``` or ```json
    t = t.replace(/^```[a-zA-Z0-9]*\s*/, "");
    // Remove ending ```
    t = t.replace(/```$/, "").trim();
  }

  return t;
}

/**
 * Ask Groq for ONE plain-text summary paragraph (no JSON, no pros/cons)
 */
async function callGroqForSummary({ productName, averageRating, reviewCount, reviewsText }) {
  const systemPrompt = `
You summarize customer reviews for a single product.
Return ONE plain English paragraph (80–120 words) describing overall sentiment.
Do NOT use bullet points.
Do NOT return JSON or code blocks.
Return only normal human-readable text.`;

  const userPrompt = `
Product name: ${productName}
Existing rating: ${averageRating.toFixed(1)}/5 from ${reviewCount} review(s).

Customer reviews:

"""
${reviewsText}
"""`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.4,
    max_tokens: 400,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  return cleanAIText(raw);
}

/**
 * Ask Groq to generate suggestions about who the product is best suited for
 */
async function callGroqForSuggestions({ productName, averageRating, reviewCount, reviewsText }) {
  const systemPrompt = `
You are an AI assistant that analyzes customer reviews and generates concise product recommendations.
Based on the reviews, describe what type of user or customer this product is best suited for.
Keep your response to 2-3 sentences maximum.
Focus on who would benefit most from this product based on the reviews.
Do NOT use bullet points or markdown formatting.
Return only plain English text.`;

  const userPrompt = `
Product name: ${productName}
Existing rating: ${averageRating.toFixed(1)}/5 from ${reviewCount} review(s).

Customer reviews:

"""
${reviewsText}
"""

Based on these reviews, who is this product best suited for?`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.4,
    max_tokens: 200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  return cleanAIText(raw);
}

/**
 * Generate (or refresh) summary for ONE product
 */
export async function generateReviewSummaryForProduct(productId) {
  const db = await connectToDatabase();
  const reviewsCollection = db.collection("reviews");
  const summariesCollection = db.collection("review_summaries");

  const reviews = await reviewsCollection
    .find({ productId })
    .sort({ reviewDate: -1 })
    .limit(100)
    .toArray();

  if (!reviews.length) {
    return {
      success: false,
      productId,
      error: "No reviews found for this product",
      hasReviews: false,
    };
  }

  const productName = reviews[0].productName || "Unknown Product";
  const reviewCount = reviews.length;
  const averageRating =
    reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount;

  const reviewsText = buildReviewsText(reviews);

  // Generate both summary and suggestions
  const summaryText = await callGroqForSummary({
    productName,
    averageRating,
    reviewCount,
    reviewsText,
  });

  const suggestionsText = await callGroqForSuggestions({
    productName,
    averageRating,
    reviewCount,
    reviewsText,
  });

  const summaryModel = new ReviewSummary({
    productId,
    productName,
    reviewCount,
    averageRating,
    summary: summaryText,
    updatedAt: new Date(),
  });

  if (!summaryModel.isValid()) {
    return {
      success: false,
      productId,
      error: "Generated summary failed validation",
    };
  }

  const summaryData = summaryModel.toJSON();
  const { _id, createdAt, updatedAt, ...dataToSave } = summaryData;

  await summariesCollection.updateOne(
    { productId },
    {
      $set: {
        ...dataToSave,
        summary: summaryText,
        suggestions: suggestionsText,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return {
    success: true,
    productId,
    productName,
    reviewCount,
    averageRating,
    summary: summaryText,
    suggestions: suggestionsText,
  };
}

/**
 * Generate summaries for ALL products that have reviews
 */
export async function generateReviewSummariesForAllProducts() {
  const db = await connectToDatabase();
  const reviewsCollection = db.collection("reviews");

  const productIds = await reviewsCollection.distinct("productId", {});

  if (!productIds.length) {
    return {
      success: false,
      generatedFor: 0,
      error: "No reviews found in database. Scrape reviews first.",
    };
  }

  const results = [];
  let successCount = 0;

  for (const productId of productIds) {
    try {
      const result = await generateReviewSummaryForProduct(productId);
      results.push(result);
      if (result.success) successCount++;
    } catch (err) {
      console.error(`Error generating summary for product ${productId}:`, err.message);
      results.push({
        success: false,
        productId,
        error: err.message,
      });
    }

    // small delay to avoid hammering Groq
    await new Promise((r) => setTimeout(r, 800));
  }

  return {
    success: true,
    generatedFor: successCount,
    totalProducts: productIds.length,
    results,
  };
}

/**
 * Paginated fetch for summaries
 */
export async function getReviewSummaries(limit = 20, page = 1) {
  try {
    const db = await connectToDatabase();
    const summariesCollection = db.collection("review_summaries");

    const skip = (page - 1) * limit;

    const summaries = await summariesCollection
      .find({})
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await summariesCollection.countDocuments({});

    return {
      success: true,
      summaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error) {
    console.error("Error fetching review summaries:", error);
    return {
      success: false,
      error: error.message,
      summaries: [],
    };
  }
}

/**
 * Get single review summary by product ID
 */
export async function getReviewSummaryByProductId(productId) {
  try {
    const db = await connectToDatabase();
    const summariesCollection = db.collection("review_summaries");

    const summary = await summariesCollection.findOne({ productId });

    if (!summary) {
      return {
        success: false,
        error: "Review summary not found for this product",
        found: false,
      };
    }

    return {
      success: true,
      summary,
      found: true,
    };
  } catch (error) {
    console.error("Error fetching review summary:", error);
    return {
      success: false,
      error: error.message,
      found: false,
    };
  }
}
