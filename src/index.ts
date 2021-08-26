import { launch } from 'puppeteer';
import write from 'write';
import slugify from 'slugify';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
const argv = yargs(hideBin(process.argv)).argv as { user?: string, pass?: string };

if (!argv.user) {
  console.error('You must provide an user');
  process.exit();
}

if (!argv.pass) {
  console.error('You must provide a password');
  process.exit();
}

const baseUrl = 'https://www.colaboraread.com.br';
(async () => {
  const browser = await launch({ headless: false });

  const page = await browser.newPage();

  const loginLoadResponse = await page.goto(`${baseUrl}/login/auth`);

  await write('output/pages/001-login.html', await page.content());
  if (!loginLoadResponse.ok()) {
    console.error({ loginLoadResponse });
    throw new Error('Error on submitting the login form.');
  }

  await page.type('form#loginForm input[name=username]', argv.user);

  await page.type('form#loginForm input[name=password]', argv.pass);

  await page.screenshot({ path: 'output/screenshots/001-login.png' });

  const [loginSubmittingResponse] = await Promise.all([
    page.waitForNavigation({ timeout: 0 }),
    page.click('form#loginForm button'),
  ]);

  await page.screenshot({ path: 'output/screenshots/002-home.png' });

  await write('output/pages/002-home.html', await page.content());
  if (!loginSubmittingResponse?.ok()) {
    console.error({ loginSubmittingResponse });
    throw new Error('Error on submitting the login form.');
  }

  const [enteringResponse] = await Promise.all([
    page.waitForNavigation({ timeout: 0 }),
    page.click('button.entrar'),
  ]);

  await page.screenshot({ path: 'output/screenshots/003-course.png' });

  await write('output/pages/003-course.html', await page.content());
  if (!enteringResponse?.ok()) {
    console.error({ enteringResponse });
    throw new Error('Error on submitting the login form.');
  }

  type SubjectDetails = {
    teacherName: string|null;
    avaEngagement: string|null;
    metrics: Record<string, number>;
    tasks: {
      id: string|null;
      title: string|null;
      subtitle: string|null;
    }[]
  }
  type Subject = {
    name: string|null;
    path: string|null;
    nextExpiration: string|null;
    almostExpiring: string|null;
    details: SubjectDetails|null;
  }

  const subjects = (await page.$$eval('#navbar-content-aluno-pda li.atividadesCronograma', (list) => (
    list.map((listItem): Subject => ({
      name: listItem.querySelector<HTMLAnchorElement>('a.atividadeNome')?.innerText || null,
      path: listItem.querySelector<HTMLAnchorElement>('a.atividadeNome')?.href || null,
      nextExpiration: listItem.querySelector<HTMLParagraphElement>('td.atividadesCronogramaTableDatas p')?.innerText || null,
      almostExpiring: listItem.querySelector<HTMLElement>('td.atividadesCronogramaTableAtencao i')?.innerText || null,
      details: null,
    }))
  ))) as unknown as Subject[];

  for (const [i, subject] of subjects.entries()) {
    await page.goto(subject.path);
    const name = `${(4 + i).toString().padStart(3, '0')}-${slugify(subject.name)}`;
    await write(`output/pages/${name}.html`, await page.content());
    await page.screenshot({ path: `output/screenshots/${name}.png` });

    subjects[i].details = (await page.$eval('#conteudo', (content): SubjectDetails => {
      const metricNames = Array.from(content.querySelectorAll('svg > text.highcharts-title > tspan')).map((task: any) => task?.textContent || null);
      const metricValues = Array.from(content.querySelectorAll('.highcharts-container > div > div > span > div > span.text-muted')).map((task: any) => task?.textContent || null);

      return {
        teacherName: content.querySelector<HTMLParagraphElement>('div.container-fluid > div > div.col-md-4.col-lg-3 > div:nth-child(2) > div.panel-body.no-padding-top > p')?.innerText || null,
        metrics: Object.fromEntries(metricNames.map(name => [name, parseInt(metricValues.shift(), 10)])),
        avaEngagement: content.querySelector<HTMLHeadingElement>('#conteudo > div.container-fluid > div > div.col-md-8.col-lg-9 > div:nth-child(1) > div > div > div:nth-child(1) > div.col-md-4 > div.panel-body > div:nth-child(3) > div > h3')?.innerText || null,
        tasks: Array.from(content.querySelectorAll('li.atividades')).map((task: any) => ({
          id: task.getAttribute("id"),
          title: task.querySelector('h4.timeline-title')?.innerText || null,
          subtitle: task.querySelector('h4.timeline-title small')?.innerText || null,
        }))
      }
    })) as unknown as SubjectDetails;
  }

  await write('output/data/data.json', JSON.stringify(subjects, null, 2));

// 
  // await browser.close();
})();