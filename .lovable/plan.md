

## Plan: Fix Build Errors, Performance, and Broken Features

### Problem Summary
1. **Build errors**: `Profile` type requires `userId` but sample data in `profiles.ts` doesn't include it
2. **Slow loading**: Splash screen forces a 2.8s+ delay on every app open; `isInitialLoad` redirect adds overhead
3. **Missing asset imports**: `profiles.ts` imports from `@/assets/` which likely don't exist

### Changes

#### 1. Fix build error — add `userId` to sample profiles
**File: `src/data/profiles.ts`**
- Add `userId: "sample-1"` through `userId: "sample-4"` to each profile object
- Remove the image imports (assets likely don't exist) and use placeholder URLs instead

#### 2. Speed up splash screen
**File: `src/pages/Splash.tsx`**
- Reduce phase 1 delay from 300ms to 200ms
- Reduce phase 2 delay from 2800ms to 1500ms (splash still plays but much faster)
- Reduce exit timeout from 600ms to 300ms

#### 3. Fix initial load redirect logic
**File: `src/components/AnimatedRoutes.tsx`**
- Use `sessionStorage` instead of module-level `isInitialLoad` variable to track splash shown status — prevents re-triggering on hot reload but still works per browser session
- Only redirect to splash if it hasn't been shown this session

#### 4. Lazy-load route pages for faster initial bundle
**File: `src/components/AnimatedRoutes.tsx`**
- Wrap non-critical pages (Explore, Matches, Messages, Chat, EditProfile, Settings, Subscription, HoroscopeMatch, SuccessStories, NotificationPreferences) in `React.lazy()` with `Suspense` fallback
- Keep Splash, Login, Register, Index eagerly loaded since they're critical path

### Technical Details
- The `Profile` type in `src/types/index.ts` has `userId: string` as required — the sample data was never updated to match
- The splash animation currently takes ~3.4s minimum before any navigation happens — cutting to ~1.8s total
- Lazy loading splits the bundle so only the splash/login/home code loads initially

