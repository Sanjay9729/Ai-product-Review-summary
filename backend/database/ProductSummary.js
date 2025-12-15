// backend/database/ProductSummary.js
import { ObjectId } from "mongodb";

/**
 * Product Summary Model
 * One AI-generated summary per product
 */

class ProductSummary {
  constructor({
    _id,
    productId,
    productName,
    summary,
    createdAt,
    updatedAt,
  }) {
    this._id = _id || new ObjectId();
    this.productId = productId;
    this.productName = productName;
    this.summary = summary;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  toJSON() {
    return {
      _id: this._id,
      productId: this.productId,
      productName: this.productName,
      summary: this.summary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  isValid() {
    if (!this.productId) {
      console.error("ProductSummary validation failed: productId is required");
      return false;
    }
    if (!this.summary || this.summary.trim().length === 0) {
      console.error("ProductSummary validation failed: summary is required");
      return false;
    }
    return true;
  }
}

export default ProductSummary;
