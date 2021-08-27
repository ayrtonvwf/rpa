import { Page } from "puppeteer";
import { SubjectDetails } from "./subject-details"

export type Subject = {
  name: string|null;
  path: string|null;
  nextExpiration: string|null;
  almostExpiring: string|null;
  details: SubjectDetails|null;
}

export const extractSubjects = async (page: Page): Promise<Subject[]> => {
  return page.$$eval('#navbar-content-aluno-pda li.atividadesCronograma', (list) => {
    return list.map((listItem) => ({
      name: listItem.querySelector<HTMLAnchorElement>('a.atividadeNome')?.innerText || null,
      path: listItem.querySelector<HTMLAnchorElement>('a.atividadeNome')?.href || null,
      nextExpiration: listItem.querySelector<HTMLParagraphElement>('td.atividadesCronogramaTableDatas p')?.innerText || null,
      almostExpiring: listItem.querySelector<HTMLElement>('td.atividadesCronogramaTableAtencao i')?.innerText || null,
      details: null,
    }))
  })
}
