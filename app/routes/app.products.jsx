import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "sync-products") {
    try {
      // Call the backend Express API directly
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intent: 'sync-products' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return { result };
    } catch (error) {
      console.error('Sync error:', error);
      return { result: { success: false, error: error.message } };
    }
  }

  return { success: false, error: "Invalid intent" };
};

export default function ProductsManager() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [summaries, setSummaries] = useState({});

  const isLoading = 
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  const isSyncing = 
    fetcher.formData?.get("intent") === "sync-products";

  useEffect(() => {
    if (fetcher.data?.result) {
      const result = fetcher.data.result;
      if (result.success) {
        shopify.toast.show(result.message);
        // Reload products after sync
        loadProducts();
      } else {
        shopify.toast.show(`Sync failed: ${result.error}`);
      }
    }
  }, [fetcher.data, shopify]);

  const loadProducts = async (page = 1) => {
    try {
      const response = await fetch(`/api/products?intent=get-products&page=${page}&limit=20`);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API server is not responding with JSON');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setProducts(result.products || []);
        setPagination(result.pagination || {});

        // Load AI summaries for the products
        loadSummaries();
      } else {
        shopify.toast.show(`Error loading products: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading products:', error.message);
    }
  };

  const loadSummaries = async () => {
    try {
      const response = await fetch(`/api/summaries?intent=get-summaries&limit=100`);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.summaries) {
          // Create a map of productName -> summary for quick lookup
          // Use product name instead of ID in case products were re-synced
          const summaryMap = {};
          result.summaries.forEach(summary => {
            summaryMap[summary.productName] = summary.aiSummary;
          });
          setSummaries(summaryMap);
        }
      }
    } catch (error) {
      console.error('Error loading summaries:', error.message);
    }
  };

  const searchProducts = async (term) => {
    if (!term.trim()) {
      loadProducts();
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'search-products',
          searchTerm: term,
          page: 1,
          limit: 20
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        shopify.toast.show('API server error - not responding with JSON');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setProducts(result.products || []);
        setPagination(result.pagination || {});
      } else {
        const result = await response.json();
        shopify.toast.show(`Search failed: ${result.error || response.statusText}`);
      }
    } catch (error) {
      shopify.toast.show(`Search error: ${error.message}`);
    }
  };
  
  // Handle fetcher data
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.products) {
        setProducts(fetcher.data.products);
        setPagination(fetcher.data.pagination);
      }
    }
  }, [fetcher.data]);

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    searchProducts(searchTerm);
  };

  const syncProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intent: 'sync-products' })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        shopify.toast.show('API server error - not responding with JSON');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          shopify.toast.show(result.message);
          // Reload products after sync
          loadProducts();
        } else {
          shopify.toast.show(`Sync failed: ${result.error}`);
        }
      } else {
        const result = await response.json();
        shopify.toast.show(`Sync failed: ${result.error || response.statusText}`);
      }
    } catch (error) {
      shopify.toast.show(`Sync error: ${error.message}`);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <s-page heading="Product Manager">
      <s-stack gap="base" direction="block">
        {/* Header with sync button */}
        <s-stack direction="inline" gap="base" align="center">
          <s-button
            onClick={syncProducts}
            {...(isSyncing ? { loading: true } : {})}
            variant="primary"
          >
            {isSyncing ? "Syncing Products..." : "Sync from Shopify"}
          </s-button>
          <s-text color="subdued">
            Store your Shopify products locally in MongoDB
          </s-text>
        </s-stack>

        {/* Search bar */}
        <s-box as="form" onSubmit={handleSearch} padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="inline" gap="base">
            <s-text-field
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <s-button type="submit" variant="secondary">
              Search
            </s-button>
            {searchTerm && (
              <s-button
                type="button"
                variant="tertiary"
                onClick={() => {
                  setSearchTerm("");
                  loadProducts();
                }}
              >
                Clear
              </s-button>
            )}
          </s-stack>
        </s-box>

        {/* Products grid */}
        {products.length > 0 ? (
          <s-stack direction="block" gap="base">
            <s-text>
              Showing {products.length} of {pagination.total} products
            </s-text>
            
            <s-grid
              template="repeat(auto-fit, minmax(300px, 1fr))"
              gap="base"
            >
              {products.map((product) => (
                <s-box
                  key={product._id}
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                  background="surface"
                >
                  <s-stack direction="block" gap="base">
                    {/* Product image */}
                    {product.image && product.image.src && (
                      <s-image
                        source={product.image.src}
                        alt={product.image.alt || product.title}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "8px"
                        }}
                      />
                    )}
                    
                    {/* Product info */}
                    <s-stack direction="block" gap="base">
                      <s-heading level="h3">{product.title}</s-heading>
                      
                      <s-stack direction="inline" gap="base">
                        <s-badge>{product.vendor || 'No Vendor'}</s-badge>
                        <s-badge variant="subdued">{product.productType || 'No Type'}</s-badge>
                      </s-stack>
                      
                      <s-paragraph>
                        {product.bodyHtml ?
                          (product.bodyHtml.length > 100
                            ? product.bodyHtml.substring(0, 100) + '...'
                            : product.bodyHtml
                          )
                          : 'No description'
                        }
                      </s-paragraph>

                      {/* AI Summary */}
                      {summaries[product.title] && (
                        <s-box
                          padding="base"
                          background="surface-secondary"
                          borderRadius="base"
                          borderWidth="base"
                          style={{ borderColor: '#9c6ade', borderStyle: 'solid' }}
                        >
                          <s-stack direction="block" gap="small">
                            <s-stack direction="inline" gap="small" align="center">
                              <s-text variant="strong" size="small" style={{ color: '#9c6ade' }}>
                                ✨ AI Summary
                              </s-text>
                            </s-stack>
                            <s-text size="small">
                              {summaries[product.title]}
                            </s-text>
                          </s-stack>
                        </s-box>
                      )}

                      {/* Variants info */}
                      {product.variants && product.variants.length > 0 && (
                        <s-stack direction="block" gap="base">
                          <s-text>
                            Variants: {product.variants.length} 
                            {product.variants[0]?.price && (
                              <> | Price: {formatPrice(product.variants[0].price)}</>
                            )}
                          </s-text>
                        </s-stack>
                      )}

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <s-stack direction="inline" gap="base" wrap="wrap">
                          {product.tags.slice(0, 3).map((tag, index) => (
                            <s-badge key={index} variant="subdued" size="small">
                              {tag}
                            </s-badge>
                          ))}
                          {product.tags.length > 3 && (
                            <s-text color="subdued" size="small">
                              +{product.tags.length - 3} more
                            </s-text>
                          )}
                        </s-stack>
                      )}

                      {/* Sync date */}
                      <s-text color="subdued" size="small">
                        Last synced: {formatDate(product.syncDate)}
                      </s-text>
                    </s-stack>
                  </s-stack>
                </s-box>
              ))}
            </s-grid>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <s-stack direction="inline" gap="base" align="center" justify="center">
                <s-button
                  variant="secondary"
                  disabled={pagination.page === 1}
                  onClick={() => loadProducts(pagination.page - 1)}
                >
                  Previous
                </s-button>
                
                <s-text>
                  Page {pagination.page} of {pagination.totalPages}
                </s-text>
                
                <s-button
                  variant="secondary"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => loadProducts(pagination.page + 1)}
                >
                  Next
                </s-button>
              </s-stack>
            )}
          </s-stack>
        ) : (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="block" gap="base" align="center">
              <s-heading level="h3">No Products Found</s-heading>
              <s-paragraph>
                {searchTerm 
                  ? "No products match your search criteria." 
                  : "No products stored in MongoDB yet. Click 'Sync from Shopify' to fetch products."
                }
              </s-paragraph>
              <s-button onClick={syncProducts} variant="primary">
                Sync from Shopify
              </s-button>
            </s-stack>
          </s-box>
        )}
      </s-stack>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};