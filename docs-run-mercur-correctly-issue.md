## Summary

The generated `templates/basic` project and the Mercur monorepo use different package-manager/script surfaces, which makes it easy to run the wrong command when switching between:

1. contributing to `mercurjs/mercur`, and
2. developing a generated Mercur marketplace project.

This issue asks for the docs/template guide to explicitly state the correct run commands for both contexts.

## What I compared

### Mercur monorepo root: `package.json`

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "oxlint --quiet",
    "test:integration:http": "cd integration-tests && bun run test:integration:http"
  },
  "packageManager": "bun@1.3.8",
  "workspaces": ["apps/*", "packages/*", "packages/providers/*", "integration-tests"]
}
```

### Mercur monorepo API app: `apps/api/package.json`

```json
{
  "scripts": {
    "build": "bunx @mercurjs/cli build",
    "seed": "medusa exec ./src/scripts/seed.ts",
    "start": "mercurjs start",
    "dev": "medusa develop"
  }
}
```

### Generated basic template root: `templates/basic/package.json`

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "check-types": "turbo run check-types"
  },
  "packageManager": "yarn@4.5.0",
  "workspaces": ["packages/*", "apps/*"]
}
```

### Generated basic template API package: `templates/basic/packages/api/package.json`

```json
{
  "scripts": {
    "build": "medusa build",
    "seed": "medusa exec ./src/scripts/seed.ts",
    "start": "medusa start",
    "dev": "medusa develop"
  }
}
```

### Generated basic template apps

```json
// templates/basic/apps/admin/package.json
{
  "scripts": {
    "dev": "vite --port 7000",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 7000"
  }
}

// templates/basic/apps/vendor/package.json
{
  "scripts": {
    "dev": "vite --port 7001",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 7001"
  }
}
```

## Current ambiguity

The monorepo uses Bun and has an API app at `apps/api`; the generated template uses Yarn and has the API package at `packages/api`.

That means the correct command depends on context:

| Context | Expected package manager | Correct root command | Backend-only command | Notes |
|---|---|---|---|---|
| Contributing to `mercurjs/mercur` monorepo | Bun | `bun run dev` | `cd apps/api && bun run dev` | Uses local workspace packages and Mercur CLI scripts. |
| Generated `templates/basic` marketplace project | Yarn 4 | `yarn dev` | `cd packages/api && yarn dev` | Backend uses vanilla Medusa scripts: `medusa develop`, `medusa build`, `medusa start`. |

## Requested docs/template change

Please add a short “Which command should I run?” section to the generated template README / docs, for example:

```md
### Running a generated Mercur marketplace project

From the generated project root:

```bash
yarn install
yarn dev
```

This starts:

- Backend API: http://localhost:9000
- Admin panel: http://localhost:7000
- Vendor panel: http://localhost:7001

Backend only:

```bash
cd packages/api
yarn dev       # medusa develop
yarn build     # medusa build
yarn start     # medusa start, after build
```

When contributing to the Mercur monorepo itself, use Bun from the monorepo root:

```bash
bun install
bun run dev
```
```

## Why this matters

When debugging Mercur locally, it is easy to mix up the monorepo command surface with the generated-template command surface. That can lead to running the wrong script, misdiagnosing build/start behavior, or assuming a generated project should use `@mercurjs/cli build` / `mercurjs start` when the template actually uses Medusa’s standard `medusa build` / `medusa start`.

Clarifying this in the template/docs would reduce install/run confusion for users and contributors.
