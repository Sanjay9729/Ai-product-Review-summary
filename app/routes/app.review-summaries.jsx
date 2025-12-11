// // app/routes/app.review-summaries.jsx
// import { useEffect, useState } from "react";
// import { useAppBridge } from "@shopify/app-bridge-react";
// import { boundary } from "@shopify/shopify-app-react-router/server";
// import { authenticate } from "../shopify.server";

// export const loader = async ({ request }) => {
//   await authenticate.admin(request);
//   return null;
// };

// export default function ReviewSummariesPage() {
//   const shopify = useAppBridge();
//   const [summaries, setSummaries] = useState([]);
//   const [pagination, setPagination] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [isGeneratingAll, setIsGeneratingAll] = useState(false);

//   const loadSummaries = async (page = 1) => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `/api/review-summaries?intent=get-summaries&page=${page}&limit=20`
//       );

//       if (response.ok) {
//         const result = await response.json();
//         if (result.success) {
//           setSummaries(result.summaries || []);
//           setPagination(result.pagination || {});
//         } else {
//           shopify.toast.show(`Error loading summaries: ${result.error}`);
//         }
//       } else {
//         shopify.toast.show(`Error loading summaries: ${response.statusText}`);
//       }
//     } catch (error) {
//       console.error("Error loading review summaries:", error);
//       shopify.toast.show(`Error loading summaries: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateAllSummaries = async () => {
//     try {
//       setIsGeneratingAll(true);
//       const response = await fetch("/api/review-summaries", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           intent: "generate-all",
//         }),
//       });

//       const result = await response.json();

//       if (response.ok && result.success) {
//         shopify.toast.show(
//           `Generated summaries for ${result.generatedFor}/${result.totalProducts} products`
//         );
//         // reload list
//         loadSummaries();
//       } else {
//         shopify.toast.show(
//           `Generation failed: ${result.error || response.statusText}`
//         );
//       }
//     } catch (error) {
//       console.error("Error generating review summaries:", error);
//       shopify.toast.show(`Error generating summaries: ${error.message}`);
//     } finally {
//       setIsGeneratingAll(false);
//     }
//   };

//   const generateForSingleProduct = async (productId) => {
//     try {
//       const response = await fetch("/api/review-summaries", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           intent: "generate-product",
//           productId,
//         }),
//       });

//       const result = await response.json();

//       if (response.ok && result.success) {
//         shopify.toast.show(
//           `Summary updated for product: ${result.productName || result.productId}`
//         );
//         loadSummaries(pagination.page || 1);
//       } else {
//         shopify.toast.show(
//           `Generation failed: ${result.error || response.statusText}`
//         );
//       }
//     } catch (error) {
//       console.error("Error generating product summary:", error);
//       shopify.toast.show(`Error generating summary: ${error.message}`);
//     }
//   };

//   const formatDateTime = (dateString) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   useEffect(() => {
//     loadSummaries();
//   }, []);

//   return (
//     <s-page heading="AI Review Summaries (Groq)">
//       <s-stack gap="base" direction="block">
//         {/* Header + Generate button */}
//         <s-stack direction="inline" gap="base" align="center">
//           <s-button
//             onClick={generateAllSummaries}
//             variant="primary"
//             {...(isGeneratingAll ? { loading: true } : {})}
//           >
//             {isGeneratingAll
//               ? "Generating Summaries..."
//               : "Generate AI Summaries for All Products"}
//           </s-button>
//           <s-text color="subdued">
//             Uses Groq model meta-llama/llama-4-scout-17b-16e-instruct to
//             analyze all reviews for each product and create a concise summary.
//           </s-text>
//         </s-stack>

//         {/* Stats */}
//         {pagination.total > 0 && (
//           <s-box
//             padding="base"
//             borderWidth="base"
//             borderRadius="base"
//             background="surface"
//           >
//             <s-stack
//               direction="inline"
//               gap="base"
//               align="center"
//               justify="space-between"
//             >
//               <s-text>
//                 <strong>{pagination.total}</strong> product review summaries
//                 stored
//               </s-text>
//               <s-text color="subdued">
//                 Page {pagination.page} of {pagination.totalPages}
//               </s-text>
//             </s-stack>
//           </s-box>
//         )}

//         {/* List */}
//         {loading ? (
//           <s-box
//             padding="base"
//             borderWidth="base"
//             borderRadius="base"
//             background="surface"
//           >
//             <s-text>Loading summaries...</s-text>
//           </s-box>
//         ) : summaries.length > 0 ? (
//           <s-stack direction="block" gap="base">
//             <s-grid template="repeat(auto-fit, minmax(400px, 1fr))" gap="base">
//               {summaries.map((item) => (
//                 <s-box
//                   key={item._id}
//                   padding="base"
//                   borderWidth="base"
//                   borderRadius="base"
//                   background="surface"
//                 >
//                   <s-stack direction="block" gap="base">
//                     {/* Product info */}
//                     <s-stack direction="block" gap="small">
//                       <s-heading level="h3">
//                         {item.productName || "Unknown Product"}
//                       </s-heading>
//                       <s-text color="subdued" size="small">
//                         Product ID: {item.productId}
//                       </s-text>
//                       <s-text size="small">
//                         Reviews:{" "}
//                         <strong>{item.reviewCount || 0}</strong> • Avg rating:{" "}
//                         <strong>
//                           {item.averageRating
//                             ? item.averageRating.toFixed(1)
//                             : "N/A"}
//                           /5
//                         </strong>
//                       </s-text>
//                     </s-stack>

//                     {/* Headline */}
//                     {item.headline && (
//                       <s-text variant="strong">{item.headline}</s-text>
//                     )}

//                     {/* Summary */}
//                     <s-box
//                       padding="base"
//                       background="surface-secondary"
//                       borderRadius="base"
//                     >
//                       <s-text>{item.summary}</s-text>
//                     </s-box>

//                     {/* Pros / Cons */}
//                     <s-stack
//                       direction="inline"
//                       gap="base"
//                       align="flex-start"
//                     >
//                       <s-stack direction="block" gap="small">
//                         <s-text variant="strong">Pros</s-text>
//                         {Array.isArray(item.pros) && item.pros.length > 0 ? (
//                           item.pros.map((p, idx) => (
//                             <s-text key={idx} size="small">
//                               • {p}
//                             </s-text>
//                           ))
//                         ) : (
//                           <s-text size="small" color="subdued">
//                             No pros listed
//                           </s-text>
//                         )}
//                       </s-stack>

//                       <s-stack direction="block" gap="small">
//                         <s-text variant="strong">Cons</s-text>
//                         {Array.isArray(item.cons) && item.cons.length > 0 ? (
//                           item.cons.map((c, idx) => (
//                             <s-text key={idx} size="small">
//                               • {c}
//                             </s-text>
//                           ))
//                         ) : (
//                           <s-text size="small" color="subdued">
//                             No cons listed
//                           </s-text>
//                         )}
//                       </s-stack>
//                     </s-stack>

//                     {/* Extra info */}
//                     <s-stack direction="block" gap="small">
//                       {item.bestFor && (
//                         <s-text size="small">
//                           <strong>Best for:</strong> {item.bestFor}
//                         </s-text>
//                       )}
//                       {item.ratingSummary && (
//                         <s-text size="small">
//                           <strong>Rating summary:</strong> {item.ratingSummary}
//                         </s-text>
//                       )}
//                       <s-text size="small" color="subdued">
//                         Updated: {formatDateTime(item.updatedAt)}
//                       </s-text>
//                     </s-stack>

//                     {/* Actions */}
//                     <s-stack direction="inline" gap="base">
//                       <s-button
//                         variant="secondary"
//                         size="small"
//                         onClick={() =>
//                           generateForSingleProduct(item.productId)
//                         }
//                       >
//                         Regenerate Summary
//                       </s-button>
//                     </s-stack>
//                   </s-stack>
//                 </s-box>
//               ))}
//             </s-grid>

//             {/* Pagination */}
//             {pagination.totalPages > 1 && (
//               <s-stack
//                 direction="inline"
//                 gap="base"
//                 align="center"
//                 justify="center"
//               >
//                 <s-button
//                   variant="secondary"
//                   disabled={pagination.page === 1}
//                   onClick={() => loadSummaries(pagination.page - 1)}
//                 >
//                   Previous
//                 </s-button>

//                 <s-text>
//                   Page {pagination.page} of {pagination.totalPages}
//                 </s-text>

//                 <s-button
//                   variant="secondary"
//                   disabled={pagination.page === pagination.totalPages}
//                   onClick={() => loadSummaries(pagination.page + 1)}
//                 >
//                   Next
//                 </s-button>
//               </s-stack>
//             )}
//           </s-stack>
//         ) : (
//           <s-box
//             padding="base"
//             borderWidth="base"
//             borderRadius="base"
//             background="surface"
//           >
//             <s-stack direction="block" gap="base" align="center">
//               <s-heading level="h3">No AI Review Summaries Yet</s-heading>
//               <s-text>
//                 Click{" "}
//                 <strong>"Generate AI Summaries for All Products"</strong> to
//                 analyze your Judge.me reviews using Groq and store summaries in
//                 MongoDB.
//               </s-text>
//               <s-button onClick={generateAllSummaries} variant="primary">
//                 Generate AI Summaries
//               </s-button>
//             </s-stack>
//           </s-box>
//         )}
//       </s-stack>
//     </s-page>
//   );
// }

// export const headers = (headersArgs) => {
//   return boundary.headers(headersArgs);
// };

// app/routes/app.review-summaries.jsx
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

// Clean up any old data formats (```json ... ``` OR { "headline": ... })
function extractSummaryText(raw) {
  if (!raw) return "No summary generated yet.";

  let text = String(raw).trim();

  // Strip ``` ``` blocks if they exist
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z0-9]*\s*/, "").replace(/```$/, "").trim();
  }

  // If it's JSON, try to pick .summary
  if (text.startsWith("{")) {
    try {
      const obj = JSON.parse(text);
      if (obj.summary) return String(obj.summary).trim();
    } catch (e) {
      // ignore parse error, just return raw text
    }
  }

  return text;
}

export default function ReviewSummariesPage() {
  const shopify = useAppBridge();
  const [summaries, setSummaries] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const loadSummaries = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/review-summaries?intent=get-summaries&page=${page}&limit=20`
      );

      const contentType = response.headers.get("content-type") || "";
      let result;

      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response from GET /api/review-summaries:", text);
        shopify.toast.show(
          "API did not return JSON. Check console for full HTML error."
        );
        return;
      }

      if (result.success) {
        setSummaries(result.summaries || []);
        setPagination(result.pagination || {});
      } else {
        shopify.toast.show(`Error loading summaries: ${result.error}`);
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
      setIsGeneratingAll(true);
      const response = await fetch("/api/review-summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "generate-all",
        }),
      });

      // Read raw text first so we don't crash on HTML
      const rawText = await response.text();
      let result;

      try {
        result = JSON.parse(rawText);
      } catch (e) {
        console.error(
          "Non-JSON response from POST /api/review-summaries:\n",
          rawText
        );
        shopify.toast.show(
          "API returned HTML / non-JSON. See console for details."
        );
        return;
      }

      if (response.ok && result.success) {
        shopify.toast.show(
          `Generated summaries for ${result.generatedFor}/${result.totalProducts} products`
        );
        loadSummaries();
      } else {
        shopify.toast.show(
          `Generation failed: ${result.error || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error generating review summaries:", error);
      shopify.toast.show(`Error generating summaries: ${error.message}`);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const generateForSingleProduct = async (productId) => {
    try {
      const response = await fetch("/api/review-summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "generate-product",
          productId,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let result;

      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response from POST /api/review-summaries:", text);
        shopify.toast.show(
          "API did not return JSON. Check console for full HTML error."
        );
        return;
      }

      if (response.ok && result.success) {
        shopify.toast.show(
          `Summary updated for product: ${result.productName || result.productId}`
        );
        loadSummaries(pagination.page || 1);
      } else {
        shopify.toast.show(
          `Generation failed: ${result.error || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error generating product summary:", error);
      shopify.toast.show(`Error generating summary: ${error.message}`);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    loadSummaries();
  }, []);

  return (
    <s-page heading="Review Summaries">
      <s-stack gap="base" direction="block">
        {/* Header + Generate button */}
        <s-stack direction="inline" gap="base" align="center">
          <s-button
            onClick={generateAllSummaries}
            variant="primary"
            {...(isGeneratingAll ? { loading: true } : {})}
          >
            {isGeneratingAll
              ? "Generating Summaries..."
              : "Generate AI Summaries for All Products"}
          </s-button>
          <s-text color="subdued">
            Uses Groq model meta-llama/llama-4-scout-17b-16e-instruct to
            analyze all reviews for each product and create a concise summary.
          </s-text>
        </s-stack>

        {/* Stats */}
        {pagination.total > 0 && (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="surface"
          >
            <s-stack
              direction="inline"
              gap="base"
              align="center"
              justify="space-between"
            >
              <s-text>
                <strong>{pagination.total}</strong> product review summaries
                stored
              </s-text>
              <s-text color="subdued">
                Page {pagination.page} of {pagination.totalPages}
              </s-text>
            </s-stack>
          </s-box>
        )}

        {/* List */}
        {loading ? (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="surface"
          >
            <s-text>Loading summaries...</s-text>
          </s-box>
        ) : summaries.length > 0 ? (
          <s-stack direction="block" gap="base">
            <s-grid template="repeat(auto-fit, minmax(400px, 1fr))" gap="base">
              {summaries.map((item) => (
                <s-box
                  key={item._id}
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                  background="surface"
                >
                  <s-stack direction="block" gap="base">
                    {/* Product info */}
                    <s-stack direction="block" gap="small">
                      <s-heading level="h3">
                        {item.productName || "Unknown Product"}
                      </s-heading>
                      <s-text color="subdued" size="small">
                        Product ID: {item.productId}
                      </s-text>
                      <s-text size="small">
                        Reviews:{" "}
                        <strong>{item.reviewCount || 0}</strong> • Avg rating:{" "}
                        <strong>
                          {item.averageRating
                            ? item.averageRating.toFixed(1)
                            : "N/A"}
                          /5
                        </strong>
                      </s-text>
                    </s-stack>

                    {/* Clean AI summary only */}
                    <s-box
                      padding="base"
                      background="surface-secondary"
                      borderRadius="base"
                    >
                      <s-text>{extractSummaryText(item.summary)}</s-text>
                    </s-box>

                    {/* Meta info */}
                    <s-stack direction="block" gap="small">
                      <s-text size="small" color="subdued">
                        Updated: {formatDateTime(item.updatedAt)}
                      </s-text>
                    </s-stack>

                    {/* Actions */}
                    <s-stack direction="inline" gap="base">
                      <s-button
                        variant="secondary"
                        size="small"
                        onClick={() =>
                          generateForSingleProduct(item.productId)
                        }
                      >
                        Regenerate Summary
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-box>
              ))}
            </s-grid>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <s-stack
                direction="inline"
                gap="base"
                align="center"
                justify="center"
              >
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
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="surface"
          >
            <s-stack direction="block" gap="base" align="center">
              <s-heading level="h3">No AI Review Summaries Yet</s-heading>
              <s-text>
                Click{" "}
                <strong>"Generate AI Summaries for All Products"</strong> to
                analyze your Judge.me reviews using Groq and store summaries in
                MongoDB.
              </s-text>
              <s-button onClick={generateAllSummaries} variant="primary">
                Generate AI Summaries
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
