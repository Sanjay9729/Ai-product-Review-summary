import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "scrape-reviews") {
      // Handle scraping logic directly (mock implementation)
      const result = {
        success: true,
        message: "Reviews scraped successfully",
        productId: "demo-product-123",
        reviewsCount: 25,
      };
      return { result };
    }

    return { success: false, error: "Invalid intent" };
  } catch (error) {
    console.error('Action error:', error);
    return { result: { success: false, error: error.message } };
  }
};

export default function ReviewScraper() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const isScrapingReviews = 
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST" &&
    fetcher.formData?.get("intent") === "scrape-reviews";

  useEffect(() => {
    if (fetcher.data?.result) {
      const result = fetcher.data.result;
      if (result.success) {
        shopify.toast.show(result.message || "Reviews scraped successfully!");
        loadReviews();
      } else {
        shopify.toast.show(`Scraping failed: ${result.error}`);
      }
    }
  }, [fetcher.data, shopify]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews?intent=get-reviews');

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReviews(result.reviews || []);
        } else {
          shopify.toast.show(`Error loading reviews: ${result.error}`);
        }
      } else {
        shopify.toast.show(`Error loading reviews: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading reviews:', error.message);
      shopify.toast.show(`Error loading reviews: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const scrapeReviews = async () => {
    try {
      const formData = new FormData();
      formData.append('intent', 'scrape-reviews');
      
      fetcher.submit(formData, { method: 'POST' });
    } catch (error) {
      shopify.toast.show(`Error scraping reviews: ${error.message}`);
    }
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

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <s-page heading="Review Scraper">
      <s-stack gap="base" direction="block">
        {/* Header with scrape button */}
        <s-stack direction="inline" gap="base" align="center">
          <s-button
            onClick={scrapeReviews}
            {...(isScrapingReviews ? { loading: true } : {})}
            variant="primary"
          >
            {isScrapingReviews ? "Scraping Reviews..." : "Scrape Reviews"}
          </s-button>
          <s-text color="subdued">
            Scrape reviews from external platforms
          </s-text>
        </s-stack>

        {/* Reviews list */}
        {loading ? (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="block" gap="base" align="center">
              <s-text>Loading reviews...</s-text>
            </s-stack>
          </s-box>
        ) : reviews.length > 0 ? (
          <s-stack direction="block" gap="base">
            <s-grid
              template="repeat(auto-fit, minmax(400px, 1fr))"
              gap="base"
            >
              {reviews.map((review) => (
                <s-box
                  key={review.id}
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                  background="surface"
                >
                  <s-stack direction="block" gap="base">
                    {/* Product name and rating */}
                    <s-stack direction="block" gap="small">
                      <s-heading level="h3">{review.productName}</s-heading>
                      <s-stack direction="inline" gap="small" align="center">
                        <s-text variant="strong">{review.rating}⭐</s-text>
                        <s-badge variant="info">Review</s-badge>
                      </s-stack>
                    </s-stack>

                    {/* Review content */}
                    <s-box
                      padding="base"
                      background="surface-secondary"
                      borderRadius="base"
                      borderWidth="base"
                      style={{ borderColor: '#007bff', borderStyle: 'solid' }}
                    >
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" gap="small" align="center">
                          <s-text variant="strong" size="small" style={{ color: '#007bff' }}>
                            📝 Review
                          </s-text>
                        </s-stack>
                        <s-stack direction="block" gap="small">
                          <s-text variant="strong">{review.title}</s-text>
                          <s-text>{review.content}</s-text>
                        </s-stack>
                      </s-stack>
                    </s-box>

                    {/* Author and timestamp */}
                    <s-stack direction="block" gap="small">
                      <s-text color="subdued" size="small">
                        By: {review.author}
                      </s-text>
                      <s-text color="subdued" size="small">
                        Date: {formatDate(review.createdAt)}
                      </s-text>
                    </s-stack>
                  </s-stack>
                </s-box>
              ))}
            </s-grid>
          </s-stack>
        ) : (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="block" gap="base" align="center">
              <s-heading level="h3">No Reviews Found</s-heading>
              <s-paragraph>
                No reviews have been scraped yet. Click "Scrape Reviews" to gather reviews from external platforms.
              </s-paragraph>
              <s-button onClick={scrapeReviews} variant="primary">
                Scrape Reviews
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