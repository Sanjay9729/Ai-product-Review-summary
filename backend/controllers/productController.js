import { connectToDatabase } from '../database/mongoConnection.js';
import Product from '../database/Product.js';

async function syncProductsFromShopify(admin) {
  try {
    console.log('Starting product sync from Shopify...');
    
    // Check if admin context is available
    if (!admin) {
      throw new Error('Admin context not provided. Please ensure you are authenticated.');
    }

    // Fetch real products from Shopify store
    console.log('Connecting to database...');
    const db = await connectToDatabase();
    
    if (!db) {
      throw new Error('Failed to connect to database. Please check your MongoDB configuration.');
    }
    
    console.log('Getting products collection...');
    const productsCollection = db.collection('products');
    
    if (!productsCollection) {
      throw new Error('Failed to access products collection in database.');
    }

    console.log('Syncing products from your Shopify store...');

    // Fetch products using Shopify Admin GraphQL API
    const shopifyProducts = await fetchShopifyProducts(admin);

    if (!shopifyProducts || shopifyProducts.length === 0) {
      console.log('No products found in your Shopify store');
      return {
        success: true,
        message: 'No products found in your Shopify store',
        count: 0
      };
    }

    console.log(`Found ${shopifyProducts.length} products from Shopify. Clearing existing products...`);
    
    // Clear existing products
    const deleteResult = await productsCollection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing products`);

    // Convert Shopify products to our format using the existing Product.fromShopifyProduct method
    console.log('Converting products to database format...');
    const productDocuments = shopifyProducts.map(shopifyProduct => {
      try {
        return new Product(Product.fromShopifyProduct(shopifyProduct)).toJSON();
      } catch (error) {
        console.error('Error converting product:', error.message);
        return null;
      }
    }).filter(product => product !== null);

    if (productDocuments.length === 0) {
      throw new Error('No valid products could be processed from Shopify data.');
    }

    console.log(`Inserting ${productDocuments.length} products into database...`);
    // Insert the products
    const insertResult = await productsCollection.insertMany(productDocuments);
    
    console.log(`Successfully inserted ${insertResult.insertedCount} products`);

    return {
      success: true,
      message: `Successfully synced ${insertResult.insertedCount} products from your Shopify store`,
      count: insertResult.insertedCount
    };

  } catch (error) {
    console.error('Error syncing products:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.message.includes('collection')) {
      errorMessage = 'Database collection error: ' + errorMessage;
    } else if (error.message.includes('connect')) {
      errorMessage = 'Database connection error: ' + errorMessage;
    } else if (error.message.includes('authenticate')) {
      errorMessage = 'Authentication error: ' + errorMessage;
    }
    
    return {
      success: false,
      error: errorMessage,
      details: {
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name
      }
    };
  }
}

// Helper function to fetch products from Shopify using Admin API
async function fetchShopifyProducts(admin) {
  try {
    if (!admin) {
      console.log('No admin context provided, returning empty array');
      return [];
    }

    console.log('Fetching products from Shopify Admin API...');

    // GraphQL query to fetch products
    const response = await admin.graphql(
      `#graphql
      query getProducts {
        products(first: 250) {
          edges {
            node {
              id
              title
              descriptionHtml
              vendor
              productType
              createdAt
              updatedAt
              publishedAt
              status
              tags
              handle
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                    barcode
                    taxable
                  }
                }
              }
              options {
                id
                name
                position
                values
              }
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }`
    );

    const data = await response.json();

    if (!data || !data.data || !data.data.products) {
      console.log('No products data received from Shopify');
      return [];
    }

    // Convert GraphQL response to REST API format for compatibility
    const products = data.data.products.edges.map(({ node }) => {
      const firstImage = node.images.edges[0]?.node;

      return {
        id: node.id,
        title: node.title,
        body_html: node.descriptionHtml,
        vendor: node.vendor,
        product_type: node.productType,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        published_at: node.publishedAt,
        status: node.status.toLowerCase(),
        tags: Array.isArray(node.tags) ? node.tags.join(', ') : node.tags || '',
        handle: node.handle,
        variants: node.variants.edges.map(({ node: variant }, index) => ({
          id: parseInt(variant.id.split('/').pop()),
          product_id: parseInt(node.id.split('/').pop()),
          title: variant.title,
          price: parseFloat(variant.price),
          sku: variant.sku || '',
          position: index + 1,
          inventory_policy: 'deny',
          compare_at_price: null,
          fulfillment_service: 'manual',
          inventory_management: 'shopify',
          option1: variant.title.split(' / ')[0] || null,
          option2: variant.title.split(' / ')[1] || null,
          option3: variant.title.split(' / ')[2] || null,
          taxable: variant.taxable || false,
          barcode: variant.barcode || null,
          grams: 0,
          weight: 0,
          weight_unit: 'kg',
          inventory_quantity: 0,
          requires_shipping: true,
          created_at: node.createdAt,
          updated_at: node.updatedAt
        })),
        options: node.options.map(option => ({
          id: parseInt(option.id.split('/').pop()),
          product_id: parseInt(node.id.split('/').pop()),
          name: option.name,
          position: option.position,
          values: option.values
        })),
        images: node.images.edges.map(({ node: image }, index) => ({
          id: parseInt(image.id.split('/').pop()),
          product_id: parseInt(node.id.split('/').pop()),
          position: index + 1,
          created_at: node.createdAt,
          updated_at: node.updatedAt,
          alt: image.altText,
          width: image.width,
          height: image.height,
          src: image.url,
          variant_ids: null,
          admin_graphql_api_id: null
        })),
        image: firstImage ? {
          id: parseInt(firstImage.id.split('/').pop()),
          product_id: parseInt(node.id.split('/').pop()),
          position: 1,
          created_at: node.createdAt,
          updated_at: node.updatedAt,
          alt: firstImage.altText,
          width: firstImage.width,
          height: firstImage.height,
          src: firstImage.url,
          variant_ids: null,
          admin_graphql_api_id: null
        } : null
      };
    });

    console.log(`Successfully fetched ${products.length} products from Shopify`);
    return products;

  } catch (error) {
    console.error('Error fetching from Shopify:', error);
    throw error;
  }
}


async function getAllProducts(limit = 50, page = 1) {
  try {
    const db = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    const skip = (page - 1) * limit;
    const products = await productsCollection
      .find({})
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalCount = await productsCollection.countDocuments({});
    
    return {
      success: true,
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getProductById(id) {
  try {
    const db = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    const product = await productsCollection.findOne({ _id: id });
    
    return {
      success: true,
      product
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function searchProducts(searchTerm, limit = 50, page = 1) {
  try {
    const db = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    const skip = (page - 1) * limit;
    const query = {
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { vendor: { $regex: searchTerm, $options: 'i' } },
        { productType: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    };
    
    const products = await productsCollection
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalCount = await productsCollection.countDocuments(query);
    
    return {
      success: true,
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export {
  syncProductsFromShopify,
  getAllProducts,
  getProductById,
  searchProducts
};