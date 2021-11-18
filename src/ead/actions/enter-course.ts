import { Page } from "puppeteer";

export const enterCourse = async (page: Page) => {
  const [enteringResponse] = await Promise.all([
    page.waitForNavigation({ timeout: 0 }),
    page.click('button.entrar'),
  ]);

  return enteringResponse;
}