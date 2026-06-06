# SSE subscriptions

The website uses tRPC's `httpSubscriptionLink`, which is implemented with Server-Sent Events (`EventSource`).

When `connectionParams` are used, tRPC serializes them into the EventSource URL. Native EventSource reconnects can reuse the original URL, so a reconnect can keep using the bearer token that was valid when the subscription first opened. If that access token expires while the page is open, the browser can reconnect with stale authentication even though the app could refresh the token for normal queries and mutations.

For this reason, prefer `publicProcedure` for SSE subscriptions whose data is safe to expose without a user context. If a subscription really needs authentication, do not assume the normal request retry path will refresh it; add an explicit transport-level renewal strategy for that subscription.

Public subscriptions should also have matching public snapshot queries when the same UI first loads data with a query and then keeps it updated with a subscription.

Before making an SSE subscription public, verify that the handler and everything it calls does not use `useUser()`, `getPermissions()`, or user-specific side effects.
