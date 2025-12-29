import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';

const RESULT_FILE = 'result.txt';

// Helper to append to file safely
async function appendResult(text: string) {
    // Simple append. In a high-concurrency real-world scenario we might need better locking,
    // but for 2 parallel tests, fs.appendFile is generally atomic enough for small writes or we accept minor interleaving.
    await fs.appendFile(RESULT_FILE, text + '\n');
}

test.describe('Greythr Automation', () => {
    test.describe.configure({ mode: 'parallel' });

    test('Task 2: Find Reporting Manager', async ({ page }) => {
        console.log('Task 2: Find Reporting Manager', new Date().toISOString())

        const employeeName = process.env.EMPLOYEE_NAME;
        if (!employeeName) throw new Error('EMPLOYEE_NAME env var missing');

        await test.step('Navigate to Home', async () => {
            await page.goto('https://infocuspinnovations.greythr.com/v3/portal/ess/home');
        });

        await test.step('Navigate to People', async () => {
            // Click on anchor tag with class="primary-link" containing span with "People"
            await page.locator('a.primary-link span.primary-title', { hasText: 'People' }).nth(0).click();
        });

        await test.step('Search for Employee', async () => {
            // Click on "Everyone" tab
            await page.click('button:has-text("Everyone")');

            // Enter EMPLOYEE_NAME in search
            await page.fill('input[name=\"searchKey\"]', employeeName);

            // Wait for typeahead results to load
            await page.waitForSelector('typeahead-container button', { timeout: 5000 }).catch(() => { });

            // Click on the result
            // Use filter to find the exact button containing the employee name to avoid partial matches
            // Note: typeahead-container is a tag, so no dot prefix.
            // Try employeeName first, then 'Me', and log if neither is found
            let employeeBtn = page.locator('typeahead-container button').filter({ has: page.getByText(employeeName, { exact: true }) }).first();

            if (await employeeBtn.count() === 0) {
                console.log(`Employee "${employeeName}" not found, trying "Me"...`);
                employeeBtn = page.locator('typeahead-container button').filter({ has: page.getByText('Me', { exact: true }) }).first();
            }

            if (await employeeBtn.count() === 0) {
                console.error(`Employee not found: Neither "${employeeName}" nor "Me" was found in the search results.`);
                throw new Error(`Employee not found: Neither "${employeeName}" nor "Me" was found in the search results.`);
            }

            // Ensure the element is in view (handles list scrolling)
            await employeeBtn.scrollIntoViewIfNeeded();
            await employeeBtn.click();
            await page.waitForTimeout(2000); // "wait for little" - better to wait for a selector but timeout is explicit request
        });

        await test.step('Extract Reporting Manager', async () => {
            // Wait for the list to be present
            const listItems = page.locator('li');
            await expect(listItems.first()).toBeVisible();


            // find an LI that has "Reporting To" in it, then get the 2nd div.
            const reportingManagerItem = page.locator('li').filter({ hasText: 'Reporting To' });

            let managerName = '';
            if (await reportingManagerItem.count() > 0) {
                managerName = await reportingManagerItem.locator('div').nth(1).innerText();
            } else {
                // Fallback: Just grab 2nd div of the first LI?
                // "Go the list li tag element"
                managerName = await page.locator('li div').nth(1).innerText();
            }

            const result = `Reporting Manager: ${managerName}`;
            console.log(result);
            await appendResult(result);
        });
    });

    test('Task 3: Calculate Leave Balance', async ({ page }) => {
        console.log('Task 3: Calculate Leave Balance', new Date().toISOString())
        await test.step('Navigate to Leave Balances', async () => {
            // Navigate to home first or direct? User says "Use the existing login session and visit page... home"
            await page.goto('https://infocuspinnovations.greythr.com/v3/portal/ess/home');

            // Click on anchor tag with class="primary-link" containing span with "Leave"
            await page.locator('a.primary-link span.primary-title', { hasText: 'Leave' }).nth(0).click();

            // Click "Leave Balances" anchor
            await page.locator('a.secondary-link', { hasText: 'Leave Balances' }).nth(0).click();

            // Wait for navigation
            await page.waitForURL(/.*leave.*|.*info.*/); // broadly wait for change
            await page.waitForSelector('.leave-balance-card');
        });

        await test.step('Sum Balances', async () => {
            // "Inside div elements with class="leave-balance-card" go to div with class="card-current""
            const balanceCards = page.locator('.leave-balance-card .card-current');
            const count = await balanceCards.count();
            let totalBalance = 0;

            for (let i = 0; i < count; i++) {
                const text = await balanceCards.nth(i).innerText();
                // Parse number. Text might be "10" or "10 Days" etc.
                const value = parseFloat(text);
                if (!isNaN(value)) {
                    totalBalance += value;
                }
            }

            const result = `Total Leave Balance: ${totalBalance}`;
            console.log(result);
            await appendResult(result);
        });
    });

});
