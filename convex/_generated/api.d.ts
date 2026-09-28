/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as answers from "../answers.js";
import type * as game from "../game.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_codes from "../lib/codes.js";
import type * as lib_data from "../lib/data.js";
import type * as lib_flow from "../lib/flow.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_scoring from "../lib/scoring.js";
import type * as lib_validators from "../lib/validators.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  answers: typeof answers;
  game: typeof game;
  "lib/auth": typeof lib_auth;
  "lib/codes": typeof lib_codes;
  "lib/data": typeof lib_data;
  "lib/flow": typeof lib_flow;
  "lib/limits": typeof lib_limits;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/scoring": typeof lib_scoring;
  "lib/validators": typeof lib_validators;
  seed: typeof seed;
  sessions: typeof sessions;
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

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
