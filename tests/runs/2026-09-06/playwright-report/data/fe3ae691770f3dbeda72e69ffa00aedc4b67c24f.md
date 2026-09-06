# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\register.spec.ts >> Authentication - Register >> TC-PW-009: Duplicate email shows error
- Location: e2e\auth\register.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/already exists|in use/i).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/already exists|in use/i).first()

```

```yaml
- heading "Register" [level=1]
- textbox "Full Name": Test User
- textbox "Email Address": testload@suraksha.lk
- textbox "Phone Number"
- combobox:
  - option "Citizen" [selected]
  - option "DMC Officer"
  - option "Volunteer"
- textbox "Region / Jurisdiction (e.g. Region 3)"
- textbox "Password": Password@123
- button "Register"
- paragraph:
  - text: Already have an account?
  - link "Log In":
    - /url: /login
```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/test.fixtures';
  2  | 
  3  | test.describe('Authentication - Register', () => {
  4  |   test('TC-PW-008: Registration form loads', async ({ page }) => {
  5  |     await page.goto('/register');
  6  |     await expect(page.getByRole('heading', { name: /register|sign up/i }).first()).toBeVisible();
  7  |   });
  8  | 
  9  |   test('TC-PW-009: Duplicate email shows error', async ({ page }) => {
  10 |     await page.goto('/register');
  11 |     // Assuming standard fields
  12 |     await page.locator('input[type="text"], input[name="name"]').first().fill('Test User');
  13 |     await page.locator('input[type="email"], input[name="email"]').first().fill(process.env.CITIZEN_EMAIL || 'testload@suraksha.lk');
  14 |     await page.locator('input[type="password"], input[name="password"]').first().fill('Password@123');
  15 |     await page.locator('button[type="submit"]').click();
  16 |     
  17 |     // Should show error about existing user
> 18 |     await expect(page.getByText(/already exists|in use/i).first()).toBeVisible({ timeout: 5000 });
     |                                                                    ^ Error: expect(locator).toBeVisible() failed
  19 |   });
  20 | 
  21 |   // Role-based redirect (TC-PW-010) is complex without creating a new user each time.
  22 |   // We'll skip dynamic creation here to avoid polluting DB in simple tests.
  23 | });
  24 | 
```