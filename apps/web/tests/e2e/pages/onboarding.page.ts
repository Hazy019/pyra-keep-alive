import type { Page } from '@playwright/test'

export class OnboardingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/onboarding')
  }

  async fillWorkspaceName(name: string) {
    await this.page.getByLabel('Workspace Name').fill(name)
  }

  async submit() {
    await this.page.getByRole('button', { name: /continue to dashboard/i }).click()
  }

  async getErrorMessage() {
    return await this.page.locator('.form-group + div').textContent()
  }
}
