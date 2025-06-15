import { chromium, Browser, BrowserContext, Page } from 'playwright';

const EMAIL = 'wastenot-user-automation@mailnesia.com';
const PASSWORD = 'Testing123%';
const LOGIN_URL = 'https://admin-staging.wastenot-official.com/';

async function navigateToLoginPage(page: Page) {
  console.log('Navigating to login page...');
  await page.goto(LOGIN_URL);
  await page.waitForSelector(
    'input[type="email"], input[name="email"], input[placeholder*="メールアドレス"]',
    { timeout: 30000 }
  );
  await page.screenshot({ path: 'screenshots/login-page.png' });
}

async function performLogin(page: Page, email: string, password: string) {
  console.log('Filling login credentials...');
  await page.fill(
    'input[type="email"], input[name="email"], input[placeholder*="メールアドレス"]',
    email
  );
  await page.fill(
    'input[type="password"], input[name="password"], input[placeholder*="パスワード"]',
    password
  );

  const loginButton = await page.$(
    'button:has-text("ログイン"), button[type="submit"]'
  );
  if (!loginButton) throw new Error('Login button not found');
  await loginButton.click();

  console.log('Login submitted, waiting for OTP input...');
  await page.waitForSelector(
    'input#otp, input[name="otp"], input[placeholder*="認証"], input[placeholder*="OTP"]',
    { timeout: 30000 }
  );
  await page.screenshot({ path: 'screenshots/otp-input.png' });
}

async function retrieveOtpFromMailnesia(page: Page, mailbox: string, timeoutMs = 60000): Promise<string> {
  const inboxUrl = `https://mailnesia.com/mailbox/${mailbox}`;
  const senderFilter = 'noreply-staging@wastenot-official.com';
  const subjectFilter = '[No-Reply]OTP Login Verification';

  const startTime = Date.now();

  await page.goto(inboxUrl);

  while (Date.now() - startTime < timeoutMs) {
    // Wait for the email table rows to be visible
    try {
      await page.waitForSelector('table.email tbody tr.emailheader', { timeout: 5000 });
    } catch {
      // If no emails yet, reload and retry
      await page.reload();
      continue;
    }

    // Get all email rows
    const emailRows = await page.$$('table.email tbody tr.emailheader');

    for (const row of emailRows) {
      // Extract date text (e.g., "a few seconds ago")
      const dateText = await row.$eval('td:nth-child(1) time', el => el.textContent?.trim() || '');
      // Extract sender text (e.g., "No Reply <noreply-staging@wastenot-official.com>")
      const senderText = await row.$eval('td:nth-child(2) a.email', el => el.textContent?.trim() || '');
      // Extract subject text
      const subjectText = await row.$eval('td:nth-child(4) a.email', el => el.textContent?.trim() || '');

      // Check if email matches criteria
      if (
        senderText.includes(senderFilter) &&
        subjectText === subjectFilter &&
        (dateText === 'a few seconds ago' || dateText === 'just now' || dateText.includes('seconds ago'))
      ) {
        // Click to open the email
        await row.click();

        // Wait for the email body to load
        await page.waitForSelector('#emailbody', { timeout: 5000 });

        // Extract OTP from email body text
        const emailBody = await page.$eval('#emailbody', el => el.textContent || '');

        // Regex to find 4-digit OTP
        const otpMatch = emailBody.match(/\b(\d{4})\b/);
        if (otpMatch) {
          return otpMatch[1];
        } else {
          throw new Error('OTP not found in email body');
        }
      }
    }

    // If no matching email found, reload and retry after a short delay
    await page.waitForTimeout(3000);
    await page.reload();
  }

  throw new Error('Timeout: OTP email not received within the specified time');
}

async function submitOtp(page: Page, otp: string) {
  console.log('Submitting OTP...');
  await page.fill(
    'input#otp, input[name="otp"], input[placeholder*="認証"], input[placeholder*="OTP"]',
    otp
  );

  const verifyButton = await page.$(
    'button:has-text("認証"), button:has-text("確認"), button:has-text("送信")'
  );
  if (!verifyButton) throw new Error('OTP verify button not found');
  await verifyButton.click();

  await page.waitForSelector('#dashboard, .dashboard, text=ダッシュボード', {
    timeout: 30000,
  });
  await page.screenshot({ path: 'screenshots/dashboard.png' });
  console.log('Login with OTP successful!');
}

(async () => {
  const browser: Browser = await chromium.launch({ headless: false });
  const context: BrowserContext = await browser.newContext();

  const loginPage: Page = await context.newPage();
  await navigateToLoginPage(loginPage);
  await performLogin(loginPage, EMAIL, PASSWORD);

  const emailPage: Page = await context.newPage();
  const emailLocalPart = EMAIL.split('@')[0];
  const otp = await retrieveOtpFromMailnesia(emailPage, emailLocalPart);

  await loginPage.bringToFront();
  await submitOtp(loginPage, otp);

  await browser.close();
})();

