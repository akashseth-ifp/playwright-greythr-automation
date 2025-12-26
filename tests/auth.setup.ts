import { test as setup, expect } from '@playwright/test';
import { authFile } from '../playwright.config';
import * as fs from 'fs';

const RESULT_FILE = 'result.txt';

setup('authenticate', async ({ page }) => {
    console.log('Authenticate', new Date().toISOString());

    const username = process.env.LOGIN_ID!;
    const password = process.env.PASSWORD!;

    if (!username || !password) {
        throw new Error('LOGIN_ID or PASSWORD environment variables are missing');
    }

    // Clear result.txt if it exists to ensure fresh results for the upcoming tests
    if (fs.existsSync(RESULT_FILE)) {
        fs.unlinkSync(RESULT_FILE);
        console.log('Cleared existing result.txt');
    }

    // 1. Open webpage
    await page.goto('https://infocuspinnovations.greythr.com/uas/portal/auth/login');

    // 2. Enter LOGIN_ID
    await page.fill('input[name="username"]', username);

    // 3. Enter PASSWORD
    await page.fill('input[name="password"]', password);

    // 4. Click on button with text 'Login'
    // Using a locator that matches the button with text 'Login'
    await page.click('button:has-text("Login")');

    // Wait for navigation to the dashboard or home page to ensure login is valid
    // The user says Task 2 visits /v3/portal/ess/home, so we wait for something similar.
    // We can just wait for the URL to contain 'home' or 'ess'.
    // Wait for login to complete.
    // We'll wait for the URL to change implies success, or a dashboard element.
    try {
        await page.waitForURL(/.*home.*/, { timeout: 15000 });
    } catch (e) {
        console.log('URL did not match home, current URL:', page.url());
        // Try waiting for a dashboard element just in case URL pattern is different
        await page.waitForSelector('a.primary-link', { timeout: 10000 });
    }

    // 5. Store the login session
    await page.context().storageState({ path: authFile });
});
