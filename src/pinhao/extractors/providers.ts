import { Page } from "puppeteer";
import { ProviderDetails } from "./provider-details";

export type Provider = {
  name: string;
  path: string|null;
  details?: ProviderDetails;
}

export const extractProviders = async (page: Page): Promise<Provider[]> => {
  return page.$$eval('#box-pagina table.contacao_lista.tablesorter tbody tr', (list) => {
    return list.map((listItem) => ({
      name: listItem.textContent,
      path: listItem.querySelector<HTMLAnchorElement>('a')?.href || null,
    }))
  })
}
