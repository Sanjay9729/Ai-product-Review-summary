// database/Review.js 

import { ObjectId } from 'mongodb';

/**
 * Review Model
 * Represents a customer review from Judge.me
 */

class Review {
  constructor({
    _id,
    reviewId,
    productId,
    productName,
    reviewerName,
    rating,
    reviewText,
    reviewDate,
    verifiedPurchase = false,
    source = "judge.me",
    createdAt,
    updatedAt,
  }) {
    this._id = _id || new ObjectId();
    this.reviewId = reviewId;
    this.productId = productId;
    this.productName = productName;
    this.reviewerName = reviewerName;
    this.rating = rating;
    this.reviewText = reviewText;
    this.reviewDate = reviewDate;
    this.verifiedPurchase = verifiedPurchase;
    this.source = source;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Factory method to create Review from Judge.me API data
   * @param {Object} judgeReviewData - Raw review data from Judge.me
   * @returns {Review}
   */
  static fromJudgeMeData(judgeReviewData) {
    return new Review({
      reviewId: judgeReviewData.id || judgeReviewData.reviewId,
      productId: judgeReviewData.product_id || judgeReviewData.productId,
      productName: judgeReviewData.product_title || judgeReviewData.productName || "Unknown Product",
      reviewerName: judgeReviewData.reviewer?.name || judgeReviewData.name || "Anonymous",
      rating: parseInt(judgeReviewData.rating) || 5,
      reviewText: this.cleanReviewText(judgeReviewData.body || judgeReviewData.reviewText || ""),
      reviewDate: new Date(judgeReviewData.created_at || judgeReviewData.reviewDate || Date.now()),
      verifiedPurchase: judgeReviewData.verified === "ok" || judgeReviewData.verifiedPurchase || false,
      source: "judge.me",
    });
  }

  /**
   * Clean HTML tags and extra whitespace from review text
   * @param {string} text - Raw review text
   * @returns {string}
   */
  static cleanReviewText(text) {
    if (!text) return "";
    
    return text
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Convert Review instance to JSON for MongoDB storage
   * @returns {Object}
   */
  toJSON() {
    return {
      _id: this._id,
      reviewId: this.reviewId,
      productId: this.productId,
      productName: this.productName,
      reviewerName: this.reviewerName,
      rating: this.rating,
      reviewText: this.reviewText,
      reviewDate: this.reviewDate,
      verifiedPurchase: this.verifiedPurchase,
      source: this.source,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validate review data
   * @returns {boolean}
   */
  isValid() {
    if (!this.reviewId) {
      console.error("Review validation failed: reviewId is required");
      return false;
    }
    
    if (!this.rating || this.rating < 1 || this.rating > 5) {
      console.error("Review validation failed: rating must be between 1 and 5");
      return false;
    }
    
    if (!this.reviewText || this.reviewText.trim().length === 0) {
      console.error("Review validation failed: reviewText is required");
      return false;
    }
    
    return true;
  }

  /**
   * Get a unique identifier for this review
   * @returns {string}
   */
  getUniqueIdentifier() {
    return `${this.reviewId}_${this.source}`;
  }
}

export default Review;