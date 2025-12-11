# Requirements Document

## Introduction

This feature refactors the existing product API endpoints to use a consistent intent-based query parameter pattern for GET requests. Currently, the API has mixed patterns where some endpoints use path parameters and others use POST with intent in the body. This refactor will standardize all product operations to use GET requests with an `intent` query parameter, making the API more consistent and easier to use.

## Glossary

- **API**: Application Programming Interface - the backend endpoints that handle HTTP requests
- **Intent**: A query parameter that specifies what action the API should perform
- **Query Parameter**: URL parameters passed after the `?` symbol (e.g., `?intent=get-products&page=1`)
- **Product Routes**: The Express router handling `/api/products` endpoints
- **Controller Function**: Backend functions that contain business logic for handling requests

## Requirements

### Requirement 1

**User Story:** As a frontend developer, I want to use GET requests with intent query parameters for all product operations, so that I can have a consistent API pattern across all endpoints.

#### Acceptance Criteria

1. WHEN a client sends a GET request to `/api/products` with `intent=get-products`, THE Product Routes SHALL return a paginated list of all products
2. WHEN a client sends a GET request to `/api/products` with `intent=get-product` and an `id` parameter, THE Product Routes SHALL return a single product matching that ID
3. WHEN a client sends a GET request to `/api/products` without an intent parameter, THE Product Routes SHALL default to returning a paginated list of all products
4. WHEN a client sends a GET request to `/api/products` with an invalid intent value, THE Product Routes SHALL return a 400 error with a descriptive message
5. WHEN a client sends a GET request to `/api/products` with `intent=get-product` but no `id` parameter, THE Product Routes SHALL return a 400 error indicating the ID is required

### Requirement 2

**User Story:** As a frontend developer, I want to search and sync products using GET and POST requests with intent parameters, so that I can perform all product operations through a unified interface.

#### Acceptance Criteria

1. WHEN a client sends a POST request to `/api/products` with `intent=search-products` and a `searchTerm`, THE Product Routes SHALL return matching products based on title, vendor, productType, or tags
2. WHEN a client sends a POST request to `/api/products` with `intent=sync-products`, THE Product Routes SHALL fetch products from Shopify and store them in the database
3. WHEN a client sends a POST request to `/api/products` without an intent parameter, THE Product Routes SHALL return a 400 error indicating intent is required
4. WHEN a client sends a POST request with an unrecognized intent value, THE Product Routes SHALL return a 400 error with available intent options

### Requirement 3

**User Story:** As a developer maintaining the codebase, I want clear error messages and proper HTTP status codes, so that I can quickly debug issues when they occur.

#### Acceptance Criteria

1. WHEN any API endpoint encounters an error, THE Product Routes SHALL return a JSON response with `success: false` and an `error` message
2. WHEN a client provides invalid parameters, THE Product Routes SHALL return a 400 status code
3. WHEN a requested product is not found, THE Product Routes SHALL return a 404 status code
4. WHEN a server error occurs, THE Product Routes SHALL return a 500 status code and log the error details
5. WHEN an API request succeeds, THE Product Routes SHALL return a 200 status code with `success: true` in the response

### Requirement 4

**User Story:** As a frontend developer, I want pagination support on all list endpoints, so that I can efficiently load large product catalogs.

#### Acceptance Criteria

1. WHEN a client requests products with `page` and `limit` query parameters, THE Product Routes SHALL return results for the specified page with the specified limit
2. WHEN a client omits the `page` parameter, THE Product Routes SHALL default to page 1
3. WHEN a client omits the `limit` parameter, THE Product Routes SHALL default to 50 items per page
4. WHEN a client requests products, THE Product Routes SHALL include pagination metadata with `page`, `limit`, `total`, and `totalPages` fields
5. WHEN a client requests search results, THE Product Routes SHALL apply the same pagination logic as the get-products endpoint
