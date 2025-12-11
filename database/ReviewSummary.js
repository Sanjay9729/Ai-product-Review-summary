// // database/ReviewSummary.js
// import { ObjectId } from "mongodb";

// /**
//  * ReviewSummary Model
//  * Stores AI-generated summary of all reviews for a single product
//  */

// class ReviewSummary {
//   constructor({
//     _id,
//     productId,
//     productName,
//     reviewCount,
//     averageRating,
//     headline,
//     summary,
//     pros = [],
//     cons = [],
//     bestFor = "",
//     ratingSummary = "",
//     createdAt,
//     updatedAt,
//   }) {
//     this._id = _id || new ObjectId();
//     this.productId = productId;
//     this.productName = productName;
//     this.reviewCount = reviewCount;
//     this.averageRating = averageRating;
//     this.headline = headline;
//     this.summary = summary;
//     this.pros = pros;
//     this.cons = cons;
//     this.bestFor = bestFor;
//     this.ratingSummary = ratingSummary;
//     this.createdAt = createdAt || new Date();
//     this.updatedAt = updatedAt || new Date();
//   }

//   toJSON() {
//     return {
//       _id: this._id,
//       productId: this.productId,
//       productName: this.productName,
//       reviewCount: this.reviewCount,
//       averageRating: this.averageRating,
//       headline: this.headline,
//       summary: this.summary,
//       pros: this.pros,
//       cons: this.cons,
//       bestFor: this.bestFor,
//       ratingSummary: this.ratingSummary,
//       createdAt: this.createdAt,
//       updatedAt: this.updatedAt,
//     };
//   }

//   isValid() {
//     if (!this.productId) {
//       console.error("ReviewSummary validation failed: productId is required");
//       return false;
//     }
//     if (!this.summary || this.summary.trim().length === 0) {
//       console.error("ReviewSummary validation failed: summary is required");
//       return false;
//     }
//     return true;
//   }
// }

// export default ReviewSummary;


// database/ReviewSummary.js
import { ObjectId } from "mongodb";

/**
 * Review Summary Model
 * One AI-generated summary per product
 */

class ReviewSummary {
  constructor({
    _id,
    productId,
    productName,
    reviewCount,
    averageRating,
    summary,
    createdAt,
    updatedAt,
  }) {
    this._id = _id || new ObjectId();
    this.productId = productId;
    this.productName = productName;
    this.reviewCount = reviewCount;
    this.averageRating = averageRating;
    this.summary = summary;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  toJSON() {
    return {
      _id: this._id,
      productId: this.productId,
      productName: this.productName,
      reviewCount: this.reviewCount,
      averageRating: this.averageRating,
      summary: this.summary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  isValid() {
    if (!this.productId) {
      console.error("ReviewSummary validation failed: productId is required");
      return false;
    }
    if (!this.summary || this.summary.trim().length === 0) {
      console.error("ReviewSummary validation failed: summary is required");
      return false;
    }
    return true;
  }
}

export default ReviewSummary;
