import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly emailRequiredError: Locator;
  readonly passwordRequiredError: Locator;
  readonly incorrectEmailPassword: Locator;
  readonly authenticationCode: Locator;
  readonly incorrectVerificationCode: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[placeholder="メールアドレスを入力"]');
    this.passwordInput = page.locator('input[placeholder="パスワードを入力"]');
    this.emailRequiredError = page.locator(
      'text=メールアドレスを入力してください' // Enter your Email Address
    );
    this.passwordRequiredError = page.locator(
      'text=パスワードを入力してください' // Please enter your password
    );
    this.incorrectEmailPassword = page.locator(
      'text=メールアドレスまたはパスワードが正しくありません' // Incorrect email address or password
    );
    this.authenticationCode = page.locator(
      'text=認証コードのご入力' // Enter your authentication code
    );
    this.incorrectVerificationCode = page.locator(
      'text=認証コードが正しくありません' // Incorrect verification code
    );
    this.loginButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/sign-in?redirect=%2F');
  }

  async waitForLoginForm() {
    await this.page.waitForSelector(
      'form[class*="flex w-full flex-col gap-[24px]"]',
      { timeout: 10000 }
    );
  }

  async enterEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async enterPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.loginButton.click();
  }
}
