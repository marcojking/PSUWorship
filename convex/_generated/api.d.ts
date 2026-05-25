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
import type * as donations from "../donations.js";
import type * as eventChecks from "../eventChecks.js";
import type * as eventGear from "../eventGear.js";
import type * as events from "../events.js";
import type * as gearItems from "../gearItems.js";
import type * as leadershipInterest from "../leadershipInterest.js";
import type * as liveSession from "../liveSession.js";
import type * as liveSetlist from "../liveSetlist.js";
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
  donations: typeof donations;
  eventChecks: typeof eventChecks;
  eventGear: typeof eventGear;
  events: typeof events;
  gearItems: typeof gearItems;
  leadershipInterest: typeof leadershipInterest;
  liveSession: typeof liveSession;
  liveSetlist: typeof liveSetlist;
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
