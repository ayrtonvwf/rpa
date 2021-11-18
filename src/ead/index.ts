import { launch } from 'puppeteer';
import write from 'write';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { extractSubjectDetails } from './extractors/subject-details';
import { extractSubjects } from './extractors/subject';
import { login } from './actions/login';
import { blockThirdParty } from './actions/block-third-party';
import { enterCourse } from './actions/enter-course';

/**
 * @todo definir argumentos
 */
const argv = yargs(hideBin(process.argv)).argv as { user?: string, pass?: string, headless?: boolean };

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
  const browser = await launch({ headless: !!argv.headless });

  const page = await browser.newPage();
  await blockThirdParty(page);

  const loginLoadResponse = await page.goto(`${baseUrl}/login/auth`);
  if (!loginLoadResponse.ok()) {
    console.error({ loginLoadResponse });
    throw new Error('Error on submitting the login form.');
  }

  const loginSubmittingResponse = await login(page, argv.user, argv.pass);
  if (!loginSubmittingResponse?.ok()) {
    console.error({ loginSubmittingResponse });
    throw new Error('Error on submitting the login form.');
  }

  const enteringResponse = await enterCourse(page);
  if (!enteringResponse?.ok()) {
    console.error({ enteringResponse });
    throw new Error('Error on submitting the login form.');
  }

  const subjects = await extractSubjects(page);

  for (const [i, subject] of subjects.entries()) {
    /**
     * @todo cada iteração deve ser executada em uma Cloud Function
     */
    await page.goto(subject.path);
    subjects[i].details = await extractSubjectDetails(page);
  }

  /**
   * @todo gravar em um armazenamento genérico
   */
  await write('output/ead/data/data.json', JSON.stringify(subjects, null, 2));

  // await browser.close();
})();