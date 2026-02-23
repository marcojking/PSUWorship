/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiRenderCache from "../aiRenderCache.js";
import type * as carts from "../carts.js";
import type * as clothing from "../clothing.js";
import type * as designs from "../designs.js";
import type * as logoVariants from "../logoVariants.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as promptTemplates from "../promptTemplates.js";
import type * as savedDesigns from "../savedDesigns.js";
import type * as settings from "../settings.js";
import type * as storage from "../storage.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiRenderCache: typeof aiRenderCache;
  carts: typeof carts;
  clothing: typeof clothing;
  designs: typeof designs;
  logoVariants: typeof logoVariants;
  orders: typeof orders;
  products: typeof products;
  promptTemplates: typeof promptTemplates;
  savedDesigns: typeof savedDesigns;
  settings: typeof settings;
  storage: typeof storage;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
