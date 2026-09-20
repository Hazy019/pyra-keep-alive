import type { Page } from '@playwright/test'

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
  }

  async getOverviewHeading() {
    return this.page.locator('h4')
  }

  async targetCount() {
    return await this.page.locator('tbody tr').count()
  }

  async emptyStateVisible() {
    return await this.page.locator('text=No targets yet').isVisible()
  }
}
