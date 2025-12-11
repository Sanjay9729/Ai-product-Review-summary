import { ObjectId } from 'mongodb';

export default class ProductSummary {
  constructor(data) {
    this._id = data._id || new ObjectId();
    this.productId = data.productId; // Reference to product _id
    this.productName = data.productName;
    this.originalDescription = data.originalDescription;
    this.aiSummary = data.aiSummary;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static fromProduct(product, aiSummary) {
    return new ProductSummary({
      productId: product._id,
      productName: product.title,
      originalDescription: product.bodyHtml,
      aiSummary: aiSummary,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  toJSON() {
    return {
      _id: this._id,
      productId: this.productId,
      productName: this.productName,
      originalDescription: this.originalDescription,
      aiSummary: this.aiSummary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
