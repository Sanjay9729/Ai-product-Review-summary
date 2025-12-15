// backend/services/productSummaryService.js
import Groq from "groq-sdk";
import { connectToDatabase } from "../database/mongoConnection.js";
import ProductSummary from "../database/ProductSummary.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL =
  process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

/**
 * Generate AI summary for a single product (description, features, etc.)
 */
export async function generateProductSummaryForProduct(productId) {
  const db = await connectToDatabase();
  const productsCollection = db.collection("products");
  const productSummariesCollection = db.collection("product_summaries");

  // Get product details - convert to string for comparison
  const product = await productsCollection.findOne({ 
    "variants.productId": parseInt(productId) || productId 
  });

  if (!product) {
    return {
      success: false,
      productId,
      error: "Product not found",
      found: false,
    };
  }

  try {
    const productName = product.title || product.productName || "Unknown Product";
    const description = product.bodyHtml || "";
    const tags = product.tags || [];
    const productType = product.productType || "";
    const vendor = product.vendor || "";

    // Build product information for AI
    const productInfo = `
Product Name: ${productName}
Description: ${description}
Tags: ${tags.join(', ')}
Product Type: ${productType}
Vendor: ${vendor}
`;

    const summaryText = await callGroqForProductSummary({
      productName,
      productInfo,
    });

    const productSummaryModel = new ProductSummary({
      productId: productId.toString(),
      productName,
      summary: summaryText,
      updatedAt: new Date(),
    });

    if (!productSummaryModel.isValid()) {
      return {
        success: false,
        productId,
        error: "Generated summary failed validation",
      };
    }

    const summaryData = productSummaryModel.toJSON();
    const { _id, createdAt, updatedAt, ...dataToSave } = summaryData;

    await productSummariesCollection.updateOne(
      { productId: productId.toString() },
      {
        $set: {
          ...dataToSave,
          summary: summaryText,
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
      productId: productId.toString(),
      productName,
      summary: summaryText,
    };
  } catch (error) {
    console.error(`Error generating product summary for ${productId}:`, error);
    return {
      success: false,
      productId,
      error: error.message,
    };
  }
}

/**
 * Generate summaries for ALL products
 */
export async function generateProductSummaryForAllProducts() {
  const db = await connectToDatabase();
  const productsCollection = db.collection("products");

  const products = await productsCollection.find({}).toArray();

  if (!products.length) {
    return {
      success: false,
      generatedFor: 0,
      error: "No products found in database.",
    };
  }

  const results = [];
  let successCount = 0;

  for (const product of products) {
    try {
      // Get the productId from the first variant
      const productId = product.variants?.[0]?.productId;
      if (!productId) {
        throw new Error("Product has no valid productId in variants");
      }
      
      const result = await generateProductSummaryForProduct(productId);
      results.push(result);
      if (result.success) successCount++;
    } catch (err) {
      const productId = product.variants?.[0]?.productId || 'unknown';
      console.error(`Error generating summary for product ${productId}:`, err.message);
      results.push({
        success: false,
        productId: productId,
        error: err.message,
      });
    }

    // small delay to avoid hammering Groq
    await new Promise((r) => setTimeout(r, 800));
  }

  return {
    success: true,
    generatedFor: successCount,
    totalProducts: products.length,
    results,
  };
}

/**
 * Paginated fetch for product summaries
 */
export async function getProductSummaries(limit = 20, page = 1) {
  try {
    const db = await connectToDatabase();
    const productSummariesCollection = db.collection("product_summaries");

    const skip = (page - 1) * limit;

    const summaries = await productSummariesCollection
      .find({})
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await productSummariesCollection.countDocuments({});

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
    console.error("Error fetching product summaries:", error);
    return {
      success: false,
      error: error.message,
      summaries: [],
    };
  }
}

/**
 * Ask Groq for product summary
 */
async function callGroqForProductSummary({ productName, productInfo }) {
  const systemPrompt = `
You are an AI assistant that creates compelling product summaries for e-commerce.
Generate an engaging, informative summary that highlights the key features, benefits, and appeal of the product.
Keep it concise (100-150 words) and persuasive for potential customers.
Do not use bullet points, just write natural flowing text.`;

  const userPrompt = `
Create a product summary for:

${productInfo}

Focus on making this product appealing to customers and highlighting its key selling points.`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.7,
    max_tokens: 400,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  return raw.trim();
}