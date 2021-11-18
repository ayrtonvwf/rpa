import { Page } from "puppeteer";

export const login = async (page: Page, username: string, password: string) => {
  await page.type('form#loginForm input[name=username]', username);
  await page.type('form#loginForm input[name=password]', password);

  const [loginSubmittingResponse] = await Promise.all([
    page.waitForNavigation({ timeout: 0 }),
    page.click('form#loginForm button'),
  ]);

  return loginSubmittingResponse;
}