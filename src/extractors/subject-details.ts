import { Page } from "puppeteer";

export type Task = {
  id: string|null;
  title: string|null;
  subtitle: string|null;
  done: string|null;
  startDate: string|null;
  endDate: string|null;
  files: {
    name: string,
    url: string
  }[];
}

export type SubjectDetails = {
  teacherName: string|null;
  avaEngagement: string|null;
  metrics: Record<string, number>;
  tasks: Task[];
}

export const extractSubjectDetails = (page: Page): Promise<SubjectDetails> => {
  return page.$eval('#conteudo', (content) => {
    /**
     * @todo as datas não estão sendo obtidas corretamente
     */
    const makeDate = (date?: string|null): Date | null => {
      if (!date) {
        return null;
      }

      const [day, month, year] = date.split('/');
      const timestamp = Date.parse(`20${year}-${month}-${day}`);
      return isNaN(timestamp) ? null : new Date(timestamp);
    }

    const extractTaskData = (task: Element): Task => {
      const dates = task.querySelector<HTMLElement>('div.timeline-panel > div > p:nth-child(2) > small > em')?.innerText || null;
      const files = Array.from(task.querySelectorAll<HTMLAnchorElement>('ul a'));

      /**
       * @todo Extrair dados com base no texto e não na posição do elemento
       */
      return {
        id: task.getAttribute("id"),
        title: task.querySelector<HTMLElement>('h4.timeline-title')?.innerText || null,
        subtitle: task.querySelector<HTMLElement>('h4.timeline-title small')?.innerText || null,
        done: task.querySelector<HTMLElement>('.progress-bar small')?.innerText || null,
        startDate: makeDate(dates.split(' - ')[0])?.toISOString() || null,
        endDate: makeDate(dates.split(' - ')[1])?.toISOString() || null,
        files: files.filter((file) => !file.href.startsWith('javascript:')).map((file) => ({
          name: file.innerText,
          url: file.href,
        }))
      }
    }

    const metricNames = Array.from(content.querySelectorAll('svg > text.highcharts-title > tspan')).map((task: any) => task?.textContent || null);
    const metricValues = Array.from(content.querySelectorAll('.highcharts-container > div > div > span > div > span.text-muted')).map((task: any) => task?.textContent || null);

    return {
      teacherName: content.querySelector<HTMLParagraphElement>('div.container-fluid > div > div.col-md-4.col-lg-3 > div:nth-child(2) > div.panel-body.no-padding-top > p')?.innerText || null,
      metrics: Object.fromEntries(metricNames.map(name => [name, parseInt(metricValues.shift(), 10)])),
      avaEngagement: content.querySelector<HTMLHeadingElement>('div.container-fluid > div > div.col-md-8.col-lg-9 > div:nth-child(1) > div > div > div:nth-child(1) > div.col-md-4 > div.panel-body > div:nth-child(3) > div > h3')?.innerText || null,
      tasks: Array.from(content.querySelectorAll('li.atividades')).map((task) => extractTaskData(task)),
    }
  });
}
