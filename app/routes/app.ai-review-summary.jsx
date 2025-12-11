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

  try {
    if (intent === "generate-all") {
      // Call the API to generate summaries for all products
      const response = await fetch('/api/review-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intent: 'generate-all' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return { result };
    }

    return { success: false, error: "Invalid intent" };
  } catch (error) {
    console.error('Action error:', error);
    return { result: { success: false, error: error.message } };
  }
};

export default function AIReviewSummary() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [summaries, setSummaries] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  const isLoadingSummaries = 
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST" &&
    fetcher.formData?.get("intent") === "generate-all";

  useEffect(() => {
    if (fetcher.data?.result) {
      const result = fetcher.data.result;
      if (result.success) {
        shopify.toast.show(result.message || "Summaries generated successfully!");
        // Reload summaries after generation
        loadSummaries();
      } else {
        shopify.toast.show(`Generation failed: ${result.error}`);
      }
    }
  }, [fetcher.data, shopify]);

  const loadSummaries = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/review-summaries?intent=get-summaries&page=${page}&limit=20`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSummaries(result.summaries || []);
          setPagination(result.pagination || {});
        } else {
          shopify.toast.show(`Error loading summaries: ${result.error}`);
        }
      } else {
        shopify.toast.show(`Error loading summaries: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading summaries:', error.message);
      shopify.toast.show(`Error loading summaries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateAllSummaries = async () => {
    try {
      const formData = new FormData();
      formData.append('intent', 'generate-all');
      
      fetcher.submit(formData, { method: 'POST' });
    } catch (error) {
      shopify.toast.show(`Error generating summaries: ${error.message}`);
    }
  };

  const generateSummaryForProduct = async (productId) => {
    try {
      const response = await fetch('/api/review-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          intent: 'generate-summary',
          productId: productId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          shopify.toast.show('Summary generated successfully!');
          loadSummaries();
        } else {
          shopify.toast.show(`Generation failed: ${result.error}`);
        }
      } else {
        shopify.toast.show(`Generation failed: ${response.statusText}`);
      }
    } catch (error) {
      shopify.toast.show(`Error generating summary: ${error.message}`);
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
    loadSummaries();
  }, []);

  return (
    <s-page heading="AI Review Summary">
      <s-stack gap="base" direction="block">
        {/* Header with generate button */}
        <s-stack direction="inline" gap="base" align="center">
          <s-button
            onClick={generateAllSummaries}
            {...(isLoadingSummaries ? { loading: true } : {})}
            variant="primary"
          >
            {isLoadingSummaries ? "Generating Summaries..." : "Generate All Summaries"}
          </s-button>
          <s-text color="subdued">
            Generate AI-powered summaries for all products using Groq
          </s-text>
        </s-stack>

        {/* Summary statistics */}
        {pagination.total > 0 && (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="inline" gap="base" align="center" justify="space-between">
              <s-text>
                <strong>{pagination.total}</strong> AI summaries generated
              </s-text>
              <s-text color="subdued">
                Page {pagination.page} of {pagination.totalPages}
              </s-text>
            </s-stack>
          </s-box>
        )}

        {/* Summaries list */}
        {loading ? (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="block" gap="base" align="center">
              <s-text>Loading AI summaries...</s-text>
            </s-stack>
          </s-box>
        ) : summaries.length > 0 ? (
          <s-stack direction="block" gap="base">
            <s-grid
              template="repeat(auto-fit, minmax(400px, 1fr))"
              gap="base"
            >
              {summaries.map((summary) => (
                <s-box
                  key={summary._id}
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                  background="surface"
                >
                  <s-stack direction="block" gap="base">
                    {/* Product name */}
                    <s-stack direction="block" gap="small">
                      <s-heading level="h3">{summary.productName}</s-heading>
                      <s-badge variant="success">AI Generated</s-badge>
                    </s-stack>

                    {/* AI Summary */}
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
                        <s-text>
                          {summary.aiSummary}
                        </s-text>
                      </s-stack>
                    </s-box>

                    {/* Timestamps */}
                    <s-stack direction="block" gap="small">
                      <s-text color="subdued" size="small">
                        Created: {formatDate(summary.createdAt)}
                      </s-text>
                      {summary.updatedAt && summary.updatedAt !== summary.createdAt && (
                        <s-text color="subdued" size="small">
                          Updated: {formatDate(summary.updatedAt)}
                        </s-text>
                      )}
                    </s-stack>

                    {/* Actions */}
                    <s-stack direction="inline" gap="base">
                      <s-button
                        variant="secondary"
                        size="small"
                        onClick={() => generateSummaryForProduct(summary.productId)}
                      >
                        Regenerate
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
                  onClick={() => loadSummaries(pagination.page - 1)}
                >
                  Previous
                </s-button>
                
                <s-text>
                  Page {pagination.page} of {pagination.totalPages}
                </s-text>
                
                <s-button
                  variant="secondary"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => loadSummaries(pagination.page + 1)}
                >
                  Next
                </s-button>
              </s-stack>
            )}
          </s-stack>
        ) : (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="surface">
            <s-stack direction="block" gap="base" align="center">
              <s-heading level="h3">No AI Summaries Yet</s-heading>
              <s-paragraph>
                No AI summaries have been generated yet. Click "Generate All Summaries" to create AI-powered summaries for all your products.
              </s-paragraph>
              <s-button onClick={generateAllSummaries} variant="primary">
                Generate All Summaries
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