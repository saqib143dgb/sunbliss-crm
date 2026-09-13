# Sunbliss CRM — iOS foundation

This folder is a separate Expo/React Native client for the existing Sunbliss CRM. It does not replace or modify the production web build in the repository root.

## Phase 1 scope

- Existing Supabase email/password authentication
- Existing `profiles` authorization (`crm_officer` / `manager`)
- Mobile Overview with customer/unit/action/overdue counts
- Units & Customers search
- Customer detail with contact shortcuts, unit/compliance information and payment schedule
- Read-only CRM access in the UI

Write actions such as recording payments, editing transactions, credit notes, installment edits and cancellation are intentionally excluded from this phase until the existing privileged RPC surface has been reviewed.

## Setup

Requires Node.js 22.13+ for Expo SDK 57.

```bash
cd mobile
cp .env.example .env
# Put the Sunbliss CRM publishable key in .env. Never use a secret/service_role key here.
npm install
npx expo-doctor@latest
npx expo start
```

The Supabase project URL is already represented in `.env.example`. Retrieve the active publishable key from Supabase Project Settings > API Keys and set `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` locally or through EAS environment variables.

## iOS internal build

After linking the app to the company's Expo account:

```bash
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile preview
```

The `preview` profile is configured for internal distribution. Production/App Store submission should only be configured after the internal build and CRM data behavior have been reviewed.

## Architecture

- `app/` — Expo Router screens/navigation
- `src/providers/AuthProvider.tsx` — Supabase session + authorized CRM role gate
- `src/services/crm.ts` — read-only data access
- `src/theme.ts` — Sunbliss mobile design tokens

The app uses the same live Supabase database as the web CRM, so Row Level Security remains the source of truth for authorization.
