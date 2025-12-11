// app/routes/app.review-scraper.jsx 
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function ReviewScraper() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  const isScrapingReviews =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST" &&
    fetcher.formData?.get("intent") === "scrape-reviews";

  useEffect(() => {
    if (fetcher.data?.result) {
      const result = fetcher.data.result;
      if (result.success) {
        if (result.needsJudgeMeSetup) {
          shopify.toast.show(result.message || "Judge.me setup required", { duration: 10000 });
        } else {
          shopify.toast.show(result.message || "Reviews scraped successfully!");
          // Reload reviews after scraping
          loadReviews();
        }
      } else {
        shopify.toast.show(`Scraping failed: ${result.error}`);
      }
    }
  }, [fetcher.data, shopify]);

  const loadReviews = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews?intent=get-all-reviews&page=${page}&limit=20`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReviews(result.reviews || []);
          setPagination(result.pagination || {});
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
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'scrape-reviews'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          if (result.needsJudgeMeSetup) {
            shopify.toast.show(result.message || "Judge.me setup required", { duration: 10000 });
          } else {
            shopify.toast.show(result.message || "Reviews scraped successfully!");
            // Reload reviews after scraping
            loadReviews();
          }
        } else {
          shopify.toast.show(`Scraping failed: ${result.error}`);
        }
      } else {
        shopify.toast.show(`Scraping failed: ${response.statusText}`);
      }
    } catch (error) {
      shopify.toast.show(`Error scraping reviews: ${error.message}`);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'delete-review',
          reviewId: reviewId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          shopify.toast.show('Review deleted successfully!');
          loadReviews();
        } else {
          shopify.toast.show(`Delete failed: ${result.error}`);
        }
      } else {
        shopify.toast.show(`Delete failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      shopify.toast.show(`Error deleting review: ${error.message}`);
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

  const renderStars = (rating) => {
    const stars = "⭐".repeat(rating || 0);
    return stars || "N/A";
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <s-page heading="Judge.me Review Scraper">
      <s-stack gap="base" direction="block">
        {/* Header with scrape button */}
        <s-stack direction="inline" gap="base" align="center">
          <s-button
            onClick={scrapeReviews}
            {...(isScrapingReviews ? { loading: true } : {})}
            variant="primary"
          >
            {isScrapingReviews ? "Scraping Reviews..." : "Scrape Judge.me Reviews"}
          </s-button>
          <s-text color="subdued">
            Scrape customer reviews from Judge.me and store them in MongoDB
          </s-text>
        </s-stack>

        {/* Review statistics */}
        {pagination.total > 0 && (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="inline" gap="base" align="center" justify="space-between">
              <s-text>
                <strong>{pagination.total}</strong> reviews stored
              </s-text>
              <s-text color="subdued">
                Page {pagination.page} of {pagination.totalPages}
              </s-text>
            </s-stack>
          </s-box>
        )}

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
                  key={review._id}
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                  background="surface"
                >
                  <s-stack direction="block" gap="base">
                    {/* Product name and rating */}
                    <s-stack direction="block" gap="small">
                      <s-heading level="h3">{review.productName || "Unknown Product"}</s-heading>
                      <s-stack direction="inline" gap="small" align="center">
                        <s-text>{renderStars(review.rating)}</s-text>
                        {review.verifiedPurchase && (
                          <s-badge variant="success">Verified Purchase</s-badge>
                        )}
                      </s-stack>
                    </s-stack>

                    {/* Reviewer info */}
                    <s-stack direction="block" gap="small">
                      <s-text variant="strong">{review.reviewerName || "Anonymous"}</s-text>
                      <s-text color="subdued" size="small">
                        {formatDate(review.reviewDate)}
                      </s-text>
                    </s-stack>

                    {/* Review text */}
                    <s-box
                      padding="base"
                      background="surface-secondary"
                      borderRadius="base"
                    >
                      <s-text>
                        {review.reviewText || "No review text provided."}
                      </s-text>
                    </s-box>

                    {/* Timestamps */}
                    <s-stack direction="block" gap="small">
                      <s-text color="subdued" size="small">
                        Scraped: {formatDate(review.createdAt)}
                      </s-text>
                      {review.updatedAt && review.updatedAt !== review.createdAt && (
                        <s-text color="subdued" size="small">
                          Updated: {formatDate(review.updatedAt)}
                        </s-text>
                      )}
                    </s-stack>

                    {/* Actions */}
                    <s-stack direction="inline" gap="base">
                      <s-button
                        variant="secondary"
                        size="small"
                        onClick={() => deleteReview(review._id)}
                      >
                        Delete
                      </s-button>
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
                  onClick={() => loadReviews(pagination.page - 1)}
                >
                  Previous
                </s-button>

                <s-text>
                  Page {pagination.page} of {pagination.totalPages}
                </s-text>

                <s-button
                  variant="secondary"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => loadReviews(pagination.page + 1)}
                >
                  Next
                </s-button>
              </s-stack>
            )}
          </s-stack>
        ) : (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="block" gap="base" align="center">
              <s-heading level="h3">No Reviews Yet</s-heading>
              <s-paragraph>
                No reviews have been scraped yet. Click "Scrape Judge.me Reviews" to fetch reviews from your Judge.me
              </s-paragraph>
              <s-button onClick={scrapeReviews} variant="primary">
                Scrape Judge.me Reviews
              </s-button>
            </s-stack>
          </s-box>
        )}

        {/* Setup Instructions for Judge.me */}
        {fetcher.data?.result?.needsJudgeMeSetup && (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="block" gap="base">
              <s-heading level="h3">⚠️ Judge.me Setup Required</s-heading>
              <s-paragraph>
                {fetcher.data.result.message || "Judge.me app is not installed or not properly configured."}
              </s-paragraph>
              
              {fetcher.data.result.setupInstructions && (
                <s-stack direction="block" gap="small">
                  <s-heading level="h4">Setup Instructions:</s-heading>
                  {fetcher.data.result.setupInstructions.map((instruction, index) => (
                    <s-text key={index}>{instruction}</s-text>
                  ))}
                </s-stack>
              )}
              
              <s-stack direction="inline" gap="base" align="center">
                <s-button onClick={scrapeReviews} variant="primary">
                  Try Again
                </s-button>
                <s-text color="subdued">
                  Make sure to complete the setup steps above first
                </s-text>
              </s-stack>
            </s-stack>
          </s-box>
        )}

        {/* No Reviews Found Message */}
        {fetcher.data?.result?.needsReviews && (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="block" gap="base" align="center">
              <s-heading level="h3">No Reviews Found</s-heading>
              <s-paragraph>
                {fetcher.data.result.message || "Judge.me is configured but no reviews were found for your products."}
              </s-paragraph>
              
              {fetcher.data.result.suggestions && (
                <s-stack direction="block" gap="small">
                  <s-text variant="strong">Suggestions:</s-text>
                  {fetcher.data.result.suggestions.map((suggestion, index) => (
                    <s-text key={index}>{suggestion}</s-text>
                  ))}
                </s-stack>
              )}
              
              <s-button onClick={scrapeReviews} variant="primary">
                Try Again
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
