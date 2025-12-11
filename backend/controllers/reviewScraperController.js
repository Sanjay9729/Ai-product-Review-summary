// // backend/controllers/reviewScraperController.js

// import axios from "axios";
// import { wrapper } from "axios-cookiejar-support";
// import { CookieJar } from "tough-cookie";
// import * as cheerio from "cheerio";
// import Review from "../../database/Review.js";
// import { connectToDatabase } from "../../database/mongoConnection.js";

// /**
//  * Create an axios client that:
//  * - logs into the storefront password page
//  * - keeps cookies for subsequent requests
//  */
// async function createStorefrontClient(shopDomain, password) {
//   const jar = new CookieJar();
//   const client = wrapper(
//     axios.create({
//       jar,
//       withCredentials: true,
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
//       },
//     })
//   );

//   // 1) Open the password page (gets cookies + authenticity tokens, if any)
//   const passwordPageUrl = `https://${shopDomain}/password`;
//   console.log(`Opening password page: ${passwordPageUrl}`);
//   await client.get(passwordPageUrl, { timeout: 15000 });

//   // 2) Post the password
//   console.log("Submitting storefront password...");

//   const formData = new URLSearchParams();
//   formData.append("form_type", "storefront_password");
//   formData.append("utf8", "✓");
//   formData.append("password", password);

//   await client.post(passwordPageUrl, formData.toString(), {
//     timeout: 15000,
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     maxRedirects: 5,
//   });

//   // 3) Quick check – fetch home page and make sure we are not seeing password form
//   const homeRes = await client.get(`https://${shopDomain}/`, {
//     timeout: 15000,
//   });
//   if (homeRes.data.includes("Enter using password")) {
//     console.warn(
//       "Still seeing password page after login – check SHOP_PASSWORD value."
//     );
//   } else {
//     console.log("Storefront password login seems successful.");
//   }

//   return client;
// }

// /**
//  * MAIN FUNCTION: Scrape Judge.me reviews from password-protected dev store
//  */
// export async function scrapeJudgeMeReviews() {
//   try {
//     console.log("=== Starting Judge.me HTML scraping (password-protected store) ===");

//     const shopDomain =
//       process.env.SHOP_CUSTOM_DOMAIN || process.env.SHOP_DOMAIN;
//     const shopPassword = process.env.SHOP_PASSWORD;

//     if (!shopDomain) {
//       return {
//         success: false,
//         reviewsScraped: 0,
//         error:
//           "Shop domain not configured. Set SHOP_DOMAIN or SHOP_CUSTOM_DOMAIN in .env",
//         needsJudgeMeSetup: true,
//       };
//     }

//     if (!shopPassword) {
//       return {
//         success: false,
//         reviewsScraped: 0,
//         error:
//           "Storefront password not configured. Set SHOP_PASSWORD in .env so scraper can log in.",
//         needsJudgeMeSetup: true,
//       };
//     }

//     // Create logged-in client
//     const client = await createStorefrontClient(shopDomain, shopPassword);

//     // Get products (for handles)
//     const db = await connectToDatabase();
//     const productsCollection = db.collection("products");
//     const products = await productsCollection.find({}).limit(20).toArray();

//     if (!products || products.length === 0) {
//       return {
//         success: false,
//         reviewsScraped: 0,
//         error: "No products found in database. Please sync products first.",
//         needsProducts: true,
//       };
//     }

//     console.log(`Found ${products.length} products to scan for reviews.`);

//     const allRawReviews = [];

//     for (const product of products) {
//       const handle = product.handle;
//       if (!handle) {
//         console.log(`Skipping product without handle: ${product.title}`);
//         continue;
//       }

//       const productUrl = `https://${shopDomain}/products/${handle}`;
//       console.log(`\nScraping product page: ${productUrl}`);

//       try {
//         const response = await client.get(productUrl, {
//           timeout: 20000,
//           headers: { Accept: "text/html" },
//         });

//         const html = response.data;
//         const $ = cheerio.load(html);

//         // If we still see password form, we didn't log in correctly
//         if (html.includes("Enter using password")) {
//           console.warn(
//             "Password page detected while scraping – login may have failed."
//           );
//         }

//         // Judge.me review HTML
//         $(".jdgm-rev").each((index, el) => {
//           const $rev = $(el);

//           const rating =
//             parseInt($rev.find(".jdgm-rev__rating").attr("data-score")) || 0;

//           const body = $rev.find(".jdgm-rev__body").text().trim();

//           const author = $rev.find(".jdgm-rev__author").text().trim();

//           const timestampAttr = $rev
//             .find(".jdgm-rev__timestamp")
//             .attr("datetime");
//           const timestampText = $rev
//             .find(".jdgm-rev__timestamp")
//             .text()
//             .trim();
//           const timestamp =
//             timestampAttr || timestampText || new Date().toISOString();

//           const verified =
//             $rev.find(".jdgm-rev__badge--verified-buyer").length > 0;

//           if (!body || body.length < 5) return;

//           const rawReview = {
//             id: $rev.attr("data-review-id") || `${product._id}_${index}`,
//             reviewId: $rev.attr("data-review-id") || `${product._id}_${index}`,
//             product_id: product._id.toString(),
//             productId: product._id.toString(),
//             product_title: product.title,
//             productName: product.title,
//             reviewer: { name: author || "Anonymous" },
//             name: author || "Anonymous",
//             rating,
//             body,
//             reviewText: body,
//             created_at: timestamp,
//             reviewDate: timestamp,
//             verified: verified ? "ok" : "no",
//             verifiedPurchase: verified,
//             source: "judge.me_html",
//           };

//           allRawReviews.push(rawReview);

//           console.log(
//             `  ✓ ${product.title}: ${rawReview.reviewer.name} (${rating}⭐) – "${body.substring(
//               0,
//               60
//             )}..."`
//           );
//         });

//         // small delay so we don't hammer the store
//         await new Promise((r) => setTimeout(r, 1000));
//       } catch (err) {
//         console.error(`  ✗ Failed to fetch ${productUrl}: ${err.message}`);
//       }
//     }

//     if (allRawReviews.length === 0) {
//       console.log("No reviews found in HTML after password login.");
//       return {
//         success: true,
//         reviewsScraped: 0,
//         message:
//           "No reviews found in product HTML even after login. Check that Judge.me widget and reviews are visible on product pages.",
//         needsReviews: true,
//       };
//     }

//     console.log(`\nTotal raw reviews scraped: ${allRawReviews.length}`);

//     // Convert raw data to Review instances
//     const reviewObjects = [];
//     for (const raw of allRawReviews) {
//       try {
//         const review = Review.fromJudgeMeData(raw);
//         if (review.isValid()) reviewObjects.push(review);
//       } catch (err) {
//         console.error(
//           `Error converting raw review ${raw.reviewId || raw.id}:`,
//           err.message
//         );
//       }
//     }

//     if (!reviewObjects.length) {
//       return {
//         success: true,
//         reviewsScraped: 0,
//         message:
//           "Reviews were found in HTML, but none passed validation in Review model.",
//       };
//     }

//     const savedCount = await saveReviewsToDatabase(reviewObjects);

//     console.log(
//       `=== Finished scraping. Saved/updated ${savedCount} reviews in MongoDB ===`
//     );

//     return {
//       success: true,
//       reviewsScraped: savedCount,
//       message: `Successfully scraped and saved ${savedCount} Judge.me reviews`,
//     };
//   } catch (error) {
//     console.error("=== Error in scrapeJudgeMeReviews ===");
//     console.error(error);
//     return {
//       success: false,
//       reviewsScraped: 0,
//       error: error.message || "Failed to scrape reviews",
//     };
//   }
// }

// /**
//  * Save reviews to MongoDB with duplicate prevention
//  */
// async function saveReviewsToDatabase(reviews) {
//   if (!reviews || !reviews.length) return 0;

//   try {
//     console.log(`Saving ${reviews.length} reviews to database...`);
//     const db = await connectToDatabase();
//     const reviewsCollection = db.collection("reviews");

//     let savedCount = 0;

//     for (const review of reviews) {
//       try {
//         const reviewData = review.toJSON();
//         const { createdAt, updatedAt, ...dataToSave } = reviewData;

//         const result = await reviewsCollection.updateOne(
//           { reviewId: review.reviewId },
//           {
//             $set: {
//               ...dataToSave,
//               updatedAt: new Date(),
//             },
//             $setOnInsert: {
//               createdAt: new Date(),
//             },
//           },
//           { upsert: true }
//         );

//         if (result.upsertedId || result.modifiedCount > 0) {
//           savedCount++;
//         }
//       } catch (err) {
//         console.error(`Error saving review ${review.reviewId}:`, err.message);
//       }
//     }

//     console.log(`Saved/updated ${savedCount} reviews.`);
//     return savedCount;
//   } catch (error) {
//     console.error("Error in saveReviewsToDatabase:", error);
//     throw new Error(`Failed to save reviews: ${error.message}`);
//   }
// }

// /**
//  * Get all reviews with pagination
//  */
// export async function getAllReviews(limit = 20, page = 1) {
//   try {
//     const db = await connectToDatabase();
//     const reviewsCollection = db.collection("reviews");

//     const skip = (page - 1) * limit;

//     const reviews = await reviewsCollection
//       .find({})
//       .sort({ reviewDate: -1 })
//       .skip(skip)
//       .limit(limit)
//       .toArray();

//     const total = await reviewsCollection.countDocuments({});

//     return {
//       success: true,
//       reviews,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit) || 1,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching all reviews:", error);
//     return {
//       success: false,
//       error: error.message,
//       reviews: [],
//     };
//   }
// }

// /**
//  * Get review by _id
//  */
// export async function getReviewById(reviewId) {
//   try {
//     const db = await connectToDatabase();
//     const reviewsCollection = db.collection("reviews");

//     const review = await reviewsCollection.findOne({ _id: reviewId });

//     if (!review) {
//       return { success: false, error: "Review not found" };
//     }

//     return { success: true, review };
//   } catch (error) {
//     console.error("Error fetching review by ID:", error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Delete a review
//  */
// export async function deleteReview(reviewId) {
//   try {
//     const db = await connectToDatabase();
//     const reviewsCollection = db.collection("reviews");

//     const result = await reviewsCollection.deleteOne({ _id: reviewId });

//     if (result.deletedCount === 0) {
//       return { success: false, error: "Review not found" };
//     }

//     return { success: true, message: "Review deleted successfully" };
//   } catch (error) {
//     console.error("Error deleting review:", error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Get reviews for a specific product
//  */
// export async function getReviewsByProduct(productId) {
//   try {
//     const db = await connectToDatabase();
//     const reviewsCollection = db.collection("reviews");

//     const reviews = await reviewsCollection
//       .find({ productId })
//       .sort({ reviewDate: -1 })
//       .toArray();

//     return reviews;
//   } catch (error) {
//     console.error("Error fetching reviews by product:", error);
//     throw new Error(`Failed to fetch product reviews: ${error.message}`);
//   }
// }

// /**
//  * Get average rating for a product
//  */
// export async function getAverageRating(productId) {
//   try {
//     const reviews = await getReviewsByProduct(productId);
//     if (!reviews.length) return 0;

//     const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
//     return total / reviews.length;
//   } catch (error) {
//     console.error("Error calculating average rating:", error);
//     return 0;
//   }
// }


// backend/controllers/reviewScraperController.js

import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import * as cheerio from "cheerio";
import Review from "../database/Review.js";
import { connectToDatabase } from "../database/mongoConnection.js";

/**
 * Create an axios client that:
 * - logs into the storefront password page
 * - keeps cookies for subsequent requests
 */
async function createStorefrontClient(shopDomain, password) {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
  );

  // 1) Open the password page (gets cookies + authenticity tokens, if any)
  const passwordPageUrl = `https://${shopDomain}/password`;
  console.log(`Opening password page: ${passwordPageUrl}`);
  await client.get(passwordPageUrl, { timeout: 15000 });

  // 2) Post the password
  console.log("Submitting storefront password...");

  const formData = new URLSearchParams();
  formData.append("form_type", "storefront_password");
  formData.append("utf8", "✓");
  formData.append("password", password);

  await client.post(passwordPageUrl, formData.toString(), {
    timeout: 15000,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    maxRedirects: 5,
  });

  // 3) Quick check – fetch home page and make sure we are not seeing password form
  const homeRes = await client.get(`https://${shopDomain}/`, {
    timeout: 15000,
  });
  if (homeRes.data.includes("Enter using password")) {
    console.warn(
      "Still seeing password page after login – check SHOP_PASSWORD value."
    );
  } else {
    console.log("Storefront password login seems successful.");
  }

  return client;
}

/**
 * MAIN FUNCTION: Scrape Judge.me reviews from password-protected dev store
 */
export async function scrapeJudgeMeReviews() {
  try {
    console.log("=== Starting Judge.me HTML scraping (password-protected store) ===");

    const shopDomain =
      process.env.SHOP_CUSTOM_DOMAIN || process.env.SHOP_DOMAIN;
    const shopPassword = process.env.SHOP_PASSWORD;

    if (!shopDomain) {
      return {
        success: false,
        reviewsScraped: 0,
        error:
          "Shop domain not configured. Set SHOP_DOMAIN or SHOP_CUSTOM_DOMAIN in .env",
        needsJudgeMeSetup: true,
      };
    }

    if (!shopPassword) {
      return {
        success: false,
        reviewsScraped: 0,
        error:
          "Storefront password not configured. Set SHOP_PASSWORD in .env so scraper can log in.",
        needsJudgeMeSetup: true,
      };
    }

    // Create logged-in client
    const client = await createStorefrontClient(shopDomain, shopPassword);

    // Get products (for handles)
    const db = await connectToDatabase();
    const productsCollection = db.collection("products");
    const products = await productsCollection.find({}).limit(20).toArray();

    if (!products || products.length === 0) {
      return {
        success: false,
        reviewsScraped: 0,
        error: "No products found in database. Please sync products first.",
        needsProducts: true,
      };
    }

    console.log(`Found ${products.length} products to scan for reviews.`);

    const allRawReviews = [];

    for (const product of products) {
      const handle = product.handle;
      if (!handle) {
        console.log(`Skipping product without handle: ${product.title}`);
        continue;
      }

      const productUrl = `https://${shopDomain}/products/${handle}`;
      console.log(`\nScraping product page: ${productUrl}`);

      try {
        const response = await client.get(productUrl, {
          timeout: 20000,
          headers: { Accept: "text/html" },
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // If we still see password form, we didn't log in correctly
        if (html.includes("Enter using password")) {
          console.warn(
            "Password page detected while scraping – login may have failed."
          );
        }

        // Judge.me review HTML
        $(".jdgm-rev").each((index, el) => {
          const $rev = $(el);

          const rating =
            parseInt($rev.find(".jdgm-rev__rating").attr("data-score")) || 0;

          const body = $rev.find(".jdgm-rev__body").text().trim();

          const author = $rev.find(".jdgm-rev__author").text().trim();

          const timestampAttr = $rev
            .find(".jdgm-rev__timestamp")
            .attr("datetime");
          const timestampText = $rev
            .find(".jdgm-rev__timestamp")
            .text()
            .trim();
          const timestamp =
            timestampAttr || timestampText || new Date().toISOString();

          const verified =
            $rev.find(".jdgm-rev__badge--verified-buyer").length > 0;

          if (!body || body.length < 5) return;

          const rawReview = {
            id: $rev.attr("data-review-id") || `${product._id}_${index}`,
            reviewId: $rev.attr("data-review-id") || `${product._id}_${index}`,
            product_id: product._id.toString(),
            productId: product._id.toString(),
            product_title: product.title,
            productName: product.title,
            reviewer: { name: author || "Anonymous" },
            name: author || "Anonymous",
            rating,
            body,
            reviewText: body,
            created_at: timestamp,
            reviewDate: timestamp,
            verified: verified ? "ok" : "no",
            verifiedPurchase: verified,
            source: "judge.me_html",
          };

          allRawReviews.push(rawReview);

          console.log(
            `  ✓ ${product.title}: ${rawReview.reviewer.name} (${rating}⭐) – "${body.substring(
              0,
              60
            )}..."`
          );
        });

        // small delay so we don't hammer the store
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.error(`  ✗ Failed to fetch ${productUrl}: ${err.message}`);
      }
    }

    if (allRawReviews.length === 0) {
      console.log("No reviews found in HTML after password login.");
      return {
        success: true,
        reviewsScraped: 0,
        message:
          "No reviews found in product HTML even after login. Check that Judge.me widget and reviews are visible on product pages.",
        needsReviews: true,
      };
    }

    console.log(`\nTotal raw reviews scraped: ${allRawReviews.length}`);

    // Convert raw data to Review instances
    const reviewObjects = [];
    for (const raw of allRawReviews) {
      try {
        const review = Review.fromJudgeMeData(raw);
        if (review.isValid()) reviewObjects.push(review);
      } catch (err) {
        console.error(
          `Error converting raw review ${raw.reviewId || raw.id}:`,
          err.message
        );
      }
    }

    if (!reviewObjects.length) {
      return {
        success: true,
        reviewsScraped: 0,
        message:
          "Reviews were found in HTML, but none passed validation in Review model.",
      };
    }

    const savedCount = await saveReviewsToDatabase(reviewObjects);

    console.log(
      `=== Finished scraping. Saved/updated ${savedCount} reviews in MongoDB ===`
    );

    return {
      success: true,
      reviewsScraped: savedCount,
      message: `Successfully scraped and saved ${savedCount} Judge.me reviews`,
    };
  } catch (error) {
    console.error("=== Error in scrapeJudgeMeReviews ===");
    console.error(error);
    return {
      success: false,
      reviewsScraped: 0,
      error: error.message || "Failed to scrape reviews",
    };
  }
}

/**
 * Save reviews to MongoDB with duplicate prevention
 */
async function saveReviewsToDatabase(reviews) {
  if (!reviews || !reviews.length) return 0;

  try {
    console.log(`Saving ${reviews.length} reviews to database...`);
    const db = await connectToDatabase();
    const reviewsCollection = db.collection("reviews");

    let savedCount = 0;

    for (const review of reviews) {
      try {
        const reviewData = review.toJSON();
        const { createdAt, updatedAt, ...dataToSave } = reviewData;

        const result = await reviewsCollection.updateOne(
          { reviewId: review.reviewId },
          {
            $set: {
              ...dataToSave,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );

        if (result.upsertedId || result.modifiedCount > 0) {
          savedCount++;
        }
      } catch (err) {
        console.error(`Error saving review ${review.reviewId}:`, err.message);
      }
    }

    console.log(`Saved/updated ${savedCount} reviews.`);
    return savedCount;
  } catch (error) {
    console.error("Error in saveReviewsToDatabase:", error);
    throw new Error(`Failed to save reviews: ${error.message}`);
  }
}

/**
 * Get all reviews with pagination
 */
export async function getAllReviews(limit = 20, page = 1) {
  try {
    const db = await connectToDatabase();
    const reviewsCollection = db.collection("reviews");

    const skip = (page - 1) * limit;

    const reviews = await reviewsCollection
      .find({})
      .sort({ reviewDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await reviewsCollection.countDocuments({});

    return {
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return {
      success: false,
      error: error.message,
      reviews: [],
    };
  }
}

/**
 * Get review by _id
 */
export async function getReviewById(reviewId) {
  try {
    const db = await connectToDatabase();
    const reviewsCollection = db.collection("reviews");

    const review = await reviewsCollection.findOne({ _id: reviewId });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    return { success: true, review };
  } catch (error) {
    console.error("Error fetching review by ID:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId) {
  try {
    const db = await connectToDatabase();
    const reviewsCollection = db.collection("reviews");

    const result = await reviewsCollection.deleteOne({ _id: reviewId });

    if (result.deletedCount === 0) {
      return { success: false, error: "Review not found" };
    }

    return { success: true, message: "Review deleted successfully" };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get reviews for a specific product
 */
export async function getReviewsByProduct(productId) {
  try {
    const db = await connectToDatabase();
    const reviewsCollection = db.collection("reviews");

    const reviews = await reviewsCollection
      .find({ productId })
      .sort({ reviewDate: -1 })
      .toArray();

    return reviews;
  } catch (error) {
    console.error("Error fetching reviews by product:", error);
    throw new Error(`Failed to fetch product reviews: ${error.message}`);
  }
}

/**
 * Get average rating for a product
 */
export async function getAverageRating(productId) {
  try {
    const reviews = await getReviewsByProduct(productId);
    if (!reviews.length) return 0;

    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return total / reviews.length;
  } catch (error) {
    console.error("Error calculating average rating:", error);
    return 0;
  }
}
