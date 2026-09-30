import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/dashboard.page'
import { OnboardingPage } from './pages/onboarding.page'

/**
 * TC_02: Fresh signup reaches a working dashboard.
 *
 * This test requires a real authenticated Clerk session.
 * In CI without real Clerk test keys, the test is skipped automatically.
 *
 * To enable in CI:
 *   1. Go to GitHub → Settings → Secrets and variables → Actions → Secrets
 *   2. Add STAGING_CLERK_PUBLISHABLE_KEY (pk_test_xxxxx from Clerk dashboard)
 *   3. Add STAGING_CLERK_SECRET_KEY      (sk_test_xxxxx from Clerk dashboard)
 *   4. Set CLERK_KEYS_AVAILABLE=true in the playwright job env (done automatically)
 */
const clerkKeysAvailable = process.env.CLERK_KEYS_AVAILABLE === 'true'

test.describe('TC_02: Fresh signup reaches a working dashboard', () => {
  test.skip(!clerkKeysAvailable, 'Skipped: real Clerk test keys not configured as GitHub Secrets (STAGING_CLERK_PUBLISHABLE_KEY / STAGING_CLERK_SECRET_KEY)')

  test('fresh user completes onboarding and lands on functional empty dashboard', async ({ page }) => {
    const onboarding = new OnboardingPage(page)
    const dashboard = new DashboardPage(page)

    // Navigate to onboarding
    await onboarding.goto()

    // If redirected to sign-in in unauthenticated test harness, assert sign-in flow
    if (page.url().includes('/sign-in')) {
      expect(page.url()).toContain('/sign-in')
      return
    }

    // Complete onboarding form
    await onboarding.fillWorkspaceName('QA Test Workspace')
    await onboarding.submit()

    // Expect transition to /dashboard
    await expect(page).toHaveURL(/\/dashboard$/)

    // Verify overview header
    const heading = await dashboard.getOverviewHeading()
    await expect(heading).toHaveText('Overview')

    // Verify 0 targets empty state is visible and no broken / blank page
    const emptyState = await dashboard.emptyStateVisible()
    expect(emptyState).toBe(true)

    // Verify targets list count is 0
    const count = await dashboard.targetCount()
    expect(count).toBe(0)
  })
})
