import { Page } from "puppeteer";

export type ProviderDetails = {
  phone: string|null;
  email: string|null;
}

export const extractSubjectDetails = (page: Page): Promise<ProviderDetails> => {
  return page.$eval('#box-pagina > div.col-md-9 > div.the_content_custom.produtos', (content) => {
    return {
      phone: content.querySelector<HTMLElement>('p:nth-child(2)')?.innerText || null,
      email: content.querySelector<HTMLElement>('p:nth-child(4)')?.innerText || null,
    }
  });
}
