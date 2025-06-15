import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { validUser, invalidUser } from '../utils/testdata.util';

test.describe('Login Page - UI & Functional Tests', () => {
	let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
	  await loginPage.waitForLoginForm();
    });

	test('should display correct UI elements and styles', async () => {
		await expect(loginPage.emailInput).toHaveAttribute('placeholder', 'メールアドレスを入力'); // Enter your email address
		await expect(loginPage.passwordInput).toHaveAttribute('placeholder', 'パスワードを入力'); // Enter your email password
		await expect(loginPage.loginButton).toBeEnabled();
		await expect(loginPage.loginButton).toHaveClass(/bg-primary/);
	});

	test('should show validation errors on empty submit', async () => {
		await loginPage.loginButton.click();

		await expect(loginPage.emailInput).toHaveClass(/border.*error/);
		await expect(loginPage.passwordInput).toHaveClass(/border.*error/);
		await expect(loginPage.emailRequiredError).toBeVisible();
		await expect(loginPage.passwordRequiredError).toBeVisible();
	});

	test('should fail with invalid credentials', async ({ page }) => {
		await loginPage.enterEmail(invalidUser.email);
		await loginPage.enterPassword(invalidUser.password);
		await loginPage.submit();

		await expect(loginPage.incorrectEmailPassword).toHaveClass(/text-.*error/);
    	await expect(loginPage.incorrectEmailPassword).toBeVisible();
		
		await expect(loginPage.emailInput).toBeVisible();
		await expect(loginPage.emailInput).toHaveClass(/border.*error/);
		await loginPage.emailInput.boundingBox();

		await expect(loginPage.passwordInput).toBeVisible();
    	await expect(loginPage.passwordInput).toHaveClass(/border.*error/);
		await loginPage.passwordInput.boundingBox();

		await expect(page.locator('button:has-text("進む")')).toBeDisabled(); // Move on
		await loginPage.enterEmail(validUser.email);
		await expect(page.locator('button:has-text("進む")')).toBeEnabled(); // Move on
	});

	test('should login successfully with valid credentials', async ({ page }) => {
		await loginPage.enterEmail(validUser.email);
		await loginPage.enterPassword(validUser.password);
		await loginPage.submit();
		
		// Wait for the OTP request and extract the OTP value
		const response = await page.waitForResponse(res =>
			res.url().includes('/member/auth/otp/request') && res.request().method() === 'POST'
		);

		const json = await response.json();
		const otp = json?.data?.result?.otp;

		// await expect(page.locator('text=認証コードのご入力')).toBeVisible();
		
		// Input wrong OTP
		await page.fill('input[name="otp"]', '1111');
		await loginPage.submit();
		await expect(loginPage.incorrectVerificationCode).toBeVisible();;
		
		// Input valid OTP
		await page.fill('input[name="otp"]', otp);
		await loginPage.submit();
		await expect(loginPage.incorrectVerificationCode).toBeVisible();

		await expect(loginPage.authenticationCode).toBeVisible();
	});
	
});
