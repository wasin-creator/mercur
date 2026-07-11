# Feature request: support disabling selected core API routes in Medusa v2

## Summary

Medusa v2 currently does not appear to provide a supported way for plugins/applications to disable selected built-in core API routes at the same path.

For marketplace frameworks built on top of Medusa, such as Mercur, this makes it difficult to safely replace or hide default admin product routes without mutating Medusa's built output in `node_modules`.

A supported route-disable mechanism would help projects extend Medusa without relying on startup-time patches.

## Use case

Mercur is a marketplace framework built on Medusa v2. It needs to replace or hide default Medusa admin product-related routes so that product management goes through Mercur's marketplace-aware product flows.

The relevant routes are primarily:

```text
/admin/products/**
/admin/product-variants/**
```

Today, Mercur has startup code that patches Medusa's built route files under `node_modules/@medusajs/medusa/dist/api/admin/...` to disable those core routes.

That approach works, but it is brittle because it mutates installed package files at runtime/startup.

## What we tried

We investigated whether this could be replaced with supported Medusa v2 extension mechanisms.

### 1. Application/plugin middleware blocker

A middleware blocker can work for some simple paths, for example returning `404` for:

```text
/admin/product-variants*
```

However, it does not reliably work for nested product routes such as:

```text
/admin/products/:id/options
/admin/products/:id/variants
/admin/products/batch
```

Those requests hit Medusa core product route policies/middlewares before application/plugin middleware can block them.

### 2. Plugin/application route files at the same path

We tried adding route stubs under matching paths such as:

```text
src/api/admin/products/**/route.ts
```

These did not cleanly shadow the Medusa core handlers. Requests still reached core Medusa product handlers or policies.

### 3. Plugin/application `products/middlewares.ts`

We also tried a plugin-level middleware override:

```text
src/api/admin/products/middlewares.ts
```

This generated successfully but did not disable the Medusa core product middlewares.

## Current behavior / limitation

From the documented route-loader behavior, API layers are registered in this order:

```text
Core → Plugins → Application
```

This means:

- Core route middlewares/policies run before plugin/application route middlewares.
- Exact-path core route handlers cannot be cleanly overridden by plugin/application handlers.
- `AUTHENTICATE = false` and `CORS = false` are useful route-level controls for custom route files, but they do not provide a way to disable built-in core routes.
- The recommended pattern appears to be "Replicate, Don't Override", which works for adding new routes under a different path, but not for hiding or replacing core routes at the same path.

## Requested feature

Please consider adding a supported way to disable selected core API routes before route and policy registration.

For example, a configuration option such as:

```ts
// medusa-config.ts
export default defineConfig({
  projectConfig: {
    // ...
  },
  api: {
    disabledCoreRoutes: [
      "/admin/products*",
      "/admin/product-variants*",
    ],
  },
})
```

Or a plugin/application hook such as:

```ts
export default defineRouteConfig({
  disableCoreRoutes: [
    "/admin/products*",
    "/admin/product-variants*",
  ],
})
```

The exact API shape is not important. The important behavior is:

1. It runs before core routes and their middlewares/policies are registered.
2. It supports selected route/method matching.
3. It can be used from an application or plugin without patching `node_modules`.
4. It works for both route handlers and associated route middlewares/policies.

## Why this matters

Marketplace frameworks and heavily customized Medusa applications often need to replace selected default admin/store behaviors while keeping the rest of Medusa core intact.

Without a supported disable mechanism, projects must choose between:

- exposing default core routes that should be hidden,
- creating new routes under different paths while leaving the original core routes available,
- forking Medusa,
- or patching installed Medusa route files at runtime.

A route-disable hook/config would make this extension point explicit, safer, and easier to maintain across Medusa upgrades.

## Related prior discussion / evidence

Related upstream reports/discussions that seem to touch the same limitation:

- https://github.com/medusajs/medusa/issues/12448 — route override behavior stopped working after v2.7.1, closed as not planned.
- https://github.com/medusajs/medusa/discussions/12622 — question about customizing existing core API routes such as `POST /admin/products`.
- https://github.com/medusajs/medusa/discussions/8682 — users asking for built-in auth/middleware to be overridable or disableable.

## Expected outcome

A documented, supported extension point for disabling selected built-in core API routes and their associated route middlewares/policies, without requiring package mutation or a fork.
