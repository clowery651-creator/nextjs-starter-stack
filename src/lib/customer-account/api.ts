import "server-only";
import { getCustomerAccountConfig } from "./config";
import { getEndpoints } from "./discovery";
import { getSiteUrl } from "@/lib/site";
import { getCustomerAccessToken } from "./auth";

export class CustomerUnauthorizedError extends Error {
  constructor() {
    super("Customer session expired");
    this.name = "CustomerUnauthorizedError";
  }
}

/** Next aborts in-flight fetches when a (runtime) prerender pass ends; let React handle those. */
export function rethrowIfPrerenderAbort(err: unknown) {
  if ((err as { digest?: string } | null)?.digest === "HANGING_PROMISE_REJECTION") throw err;
}

type GraphQLResponse<T> = { data?: T; errors?: { message: string; extensions?: { code?: string } }[] };

/** Raw request with an explicit token (used right after login, before the cookie exists). */
export async function customerAccountRequest<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const config = getCustomerAccountConfig();
  if (!config) throw new Error("Customer Account API is not configured");
  const { graphqlEndpoint } = await getEndpoints(config);
  const res = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Customer Account API takes the raw access token (no "Bearer").
      Authorization: accessToken,
      Origin: getSiteUrl(),
      "User-Agent": "nextjs-starter-stack",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403) throw new CustomerUnauthorizedError();
  if (!res.ok) throw new Error(`Customer Account API error: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    if (json.errors.some((e) => e.extensions?.code === "UNAUTHORIZED" || e.extensions?.code === "ACCESS_DENIED")) {
      throw new CustomerUnauthorizedError();
    }
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("Customer Account API returned no data");
  return json.data;
}

/** Request as the signed-in customer (reads the session cookie). */
export async function customerAccountFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = await getCustomerAccessToken();
  if (!token) throw new CustomerUnauthorizedError();
  return customerAccountRequest<T>(token, query, variables);
}

// ---------- Types ----------

export type Money = { amount: string; currencyCode: string };

export type OrderSummary = {
  id: string;
  name: string;
  number: number;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  cancelledAt: string | null;
  totalPrice: Money;
  lineItems: { nodes: { name: string; quantity: number; image: { url: string; altText: string | null } | null }[] };
};

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type CustomerProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: { emailAddress: string | null } | null;
  phoneNumber: { phoneNumber: string } | null;
  defaultAddress: { formatted: string[] } | null;
  creationDate: string;
};

export type OrderDetail = {
  id: string;
  name: string;
  number: number;
  confirmationNumber: string | null;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  statusPageUrl: string;
  subtotal: Money | null;
  totalShipping: Money;
  totalTax: Money | null;
  totalPrice: Money;
  totalRefunded: Money;
  shippingAddress: { formatted: string[] } | null;
  lineItems: {
    nodes: {
      id: string;
      name: string;
      title: string;
      variantTitle: string | null;
      quantity: number;
      price: Money | null;
      totalPrice: Money | null;
      image: { url: string; altText: string | null; width: number | null; height: number | null } | null;
    }[];
  };
  fulfillments: {
    nodes: {
      id: string;
      status: string | null;
      latestShipmentStatus: string | null;
      createdAt: string;
      estimatedDeliveryAt: string | null;
      trackingInformation: { company: string | null; number: string | null; url: string | null }[];
    }[];
  };
};

// ---------- Queries ----------

const ORDER_SUMMARY = /* GraphQL */ `
  fragment OrderSummary on Order {
    id
    name
    number
    processedAt
    financialStatus
    fulfillmentStatus
    cancelledAt
    totalPrice { amount currencyCode }
    lineItems(first: 3) { nodes { name quantity image { url altText } } }
  }
`;

const CUSTOMER_FIRST_NAME = /* GraphQL */ `
  query CustomerFirstName { customer { firstName displayName } }
`;

const CUSTOMER_OVERVIEW = /* GraphQL */ `
  query CustomerOverview {
    customer {
      id
      firstName
      lastName
      displayName
      creationDate
      emailAddress { emailAddress }
      phoneNumber { phoneNumber }
      defaultAddress { formatted }
      orders(first: 3, sortKey: PROCESSED_AT, reverse: true) {
        nodes { ...OrderSummary }
      }
    }
  }
  ${ORDER_SUMMARY}
`;

const CUSTOMER_ORDERS = /* GraphQL */ `
  query CustomerOrders($first: Int, $last: Int, $after: String, $before: String) {
    customer {
      orders(first: $first, last: $last, after: $after, before: $before, sortKey: PROCESSED_AT, reverse: true) {
        nodes { ...OrderSummary }
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      }
    }
  }
  ${ORDER_SUMMARY}
`;

const ORDER_DETAIL = /* GraphQL */ `
  query OrderDetail($id: ID!) {
    order(id: $id) {
      id
      name
      number
      confirmationNumber
      processedAt
      financialStatus
      fulfillmentStatus
      cancelledAt
      cancelReason
      statusPageUrl
      subtotal { amount currencyCode }
      totalShipping { amount currencyCode }
      totalTax { amount currencyCode }
      totalPrice { amount currencyCode }
      totalRefunded { amount currencyCode }
      shippingAddress { formatted }
      lineItems(first: 100) {
        nodes {
          id
          name
          title
          variantTitle
          quantity
          price { amount currencyCode }
          totalPrice { amount currencyCode }
          image { url altText width height }
        }
      }
      fulfillments(first: 20) {
        nodes {
          id
          status
          latestShipmentStatus
          createdAt
          estimatedDeliveryAt
          trackingInformation { company number url }
        }
      }
    }
  }
`;

export async function fetchFirstName(accessToken: string): Promise<string | undefined> {
  const data = await customerAccountRequest<{ customer: { firstName: string | null; displayName: string } }>(
    accessToken,
    CUSTOMER_FIRST_NAME,
  );
  const name = data.customer.firstName?.trim() || data.customer.displayName?.split(/[\s@]/)[0];
  return name || undefined;
}

export async function getCustomerOverview() {
  const data = await customerAccountFetch<{
    customer: CustomerProfile & { orders: { nodes: OrderSummary[] } };
  }>(CUSTOMER_OVERVIEW);
  return data.customer;
}

export const ORDERS_PAGE_SIZE = 10;

export async function getCustomerOrders({ after, before }: { after?: string; before?: string }) {
  const variables = before
    ? { last: ORDERS_PAGE_SIZE, before }
    : { first: ORDERS_PAGE_SIZE, ...(after ? { after } : {}) };
  const data = await customerAccountFetch<{
    customer: { orders: { nodes: OrderSummary[]; pageInfo: PageInfo } };
  }>(CUSTOMER_ORDERS, variables);
  return data.customer.orders;
}

/** `id` is the numeric order id from the URL. */
export async function getCustomerOrder(id: string): Promise<OrderDetail | null> {
  if (!/^\d+$/.test(id)) return null;
  const data = await customerAccountFetch<{ order: OrderDetail | null }>(ORDER_DETAIL, {
    id: `gid://shopify/Order/${id}`,
  });
  return data.order;
}

export function orderPathId(gid: string): string {
  return gid.split("/").pop()?.split("?")[0] ?? gid;
}
