import { ObjectId } from 'mongodb';

export default class Product {
  constructor(data) {
    this._id = data._id || new ObjectId();
    this.shopifyId = data.shopifyId;
    this.title = data.title;
    this.bodyHtml = data.bodyHtml;
    this.vendor = data.vendor;
    this.productType = data.productType;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.publishedAt = data.publishedAt;
    this.templateSuffix = data.templateSuffix;
    this.status = data.status;
    this.publishedScope = data.publishedScope;
    this.tags = data.tags || [];
    this.adminGraphqlApiId = data.adminGraphqlApiId;
    
    // SEO fields
    this.seoTitle = data.seoTitle;
    this.seoDescription = data.seoDescription;
    
    // Variants
    this.variants = data.variants || [];
    
    // Options
    this.options = data.options || [];
    
    // Images
    this.images = data.images || [];
    this.image = data.image || null;
    
    // Additional fields
    this.handle = data.handle;
    this.publishedOnCurrentChannel = data.publishedOnCurrentChannel;
    this.syncDate = data.syncDate || new Date();
  }

  static fromShopifyProduct(shopifyProduct) {
    return new Product({
      shopifyId: shopifyProduct.id,
      title: shopifyProduct.title,
      bodyHtml: shopifyProduct.body_html,
      vendor: shopifyProduct.vendor,
      productType: shopifyProduct.product_type,
      createdAt: new Date(shopifyProduct.created_at),
      updatedAt: new Date(shopifyProduct.updated_at),
      publishedAt: shopifyProduct.published_at ? new Date(shopifyProduct.published_at) : null,
      templateSuffix: shopifyProduct.template_suffix,
      status: shopifyProduct.status,
      publishedScope: shopifyProduct.published_scope,
      tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(tag => tag.trim()) : [],
      adminGraphqlApiId: shopifyProduct.admin_graphql_api_id,
      seoTitle: shopifyProduct.seo ? shopifyProduct.seo.title : null,
      seoDescription: shopifyProduct.seo ? shopifyProduct.seo.description : null,
      variants: shopifyProduct.variants.map(variant => ({
        id: variant.id,
        productId: variant.product_id,
        title: variant.title,
        price: parseFloat(variant.price),
        sku: variant.sku,
        position: variant.position,
        inventoryPolicy: variant.inventory_policy,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        fulfillmentService: variant.fulfillment_service,
        inventoryManagement: variant.inventory_management,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
        createdAt: new Date(variant.created_at),
        updatedAt: new Date(variant.updated_at),
        taxable: variant.taxable,
        barcode: variant.barcode,
        grams: variant.grams,
        imageId: variant.image_id,
        weight: variant.weight,
        weightUnit: variant.weight_unit,
        inventoryItemId: variant.inventory_item_id,
        inventoryQuantity: variant.inventory_quantity,
        oldInventoryQuantity: variant.old_inventory_quantity,
        requiresShipping: variant.requires_shipping,
        adminGraphqlApiId: variant.admin_graphql_api_id
      })),
      options: shopifyProduct.options.map(option => ({
        id: option.id,
        productId: option.product_id,
        name: option.name,
        position: option.position,
        values: option.values
      })),
      images: shopifyProduct.images.map(image => ({
        id: image.id,
        productId: image.product_id,
        position: image.position,
        createdAt: new Date(image.created_at),
        updatedAt: new Date(image.updated_at),
        alt: image.alt,
        width: image.width,
        height: image.height,
        src: image.src,
        variantIds: image.variant_ids,
        adminGraphqlApiId: image.admin_graphql_api_id
      })),
      image: shopifyProduct.image ? {
        id: shopifyProduct.image.id,
        productId: shopifyProduct.image.product_id,
        position: shopifyProduct.image.position,
        createdAt: new Date(shopifyProduct.image.created_at),
        updatedAt: new Date(shopifyProduct.image.updated_at),
        alt: shopifyProduct.image.alt,
        width: shopifyProduct.image.width,
        height: shopifyProduct.image.height,
        src: shopifyProduct.image.src,
        variantIds: shopifyProduct.image.variant_ids,
        adminGraphqlApiId: shopifyProduct.image.admin_graphql_api_id
      } : null,
      handle: shopifyProduct.handle,
      publishedOnCurrentChannel: shopifyProduct.published_on_current_channel,
      syncDate: new Date()
    });
  }

  toJSON() {
    return {
      _id: this._id,
      shopifyId: this.shopifyId,
      title: this.title,
      bodyHtml: this.bodyHtml,
      vendor: this.vendor,
      productType: this.productType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      publishedAt: this.publishedAt,
      templateSuffix: this.templateSuffix,
      status: this.status,
      publishedScope: this.publishedScope,
      tags: this.tags,
      adminGraphqlApiId: this.adminGraphqlApiId,
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription,
      variants: this.variants,
      options: this.options,
      images: this.images,
      image: this.image,
      handle: this.handle,
      publishedOnCurrentChannel: this.publishedOnCurrentChannel,
      syncDate: this.syncDate
    };
  }
}