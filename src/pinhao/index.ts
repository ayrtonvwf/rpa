import { launch } from 'puppeteer';
import write from 'write';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { extractSubjectDetails as extractProviderDetails } from './extractors/provider-details';
import { extractProviders } from './extractors/providers';
import { login } from './actions/login';
import { blockThirdParty } from './actions/block-third-party';
import { enterCourse } from './actions/enter-course';

/**
 * @todo definir argumentos
 */
const argv = yargs(hideBin(process.argv)).argv as { headless?: boolean };

const baseUrl = 'https://ceagesp.gov.br/guia-ceagesp/pinhao/';
(async () => {
  const browser = await launch({ headless: !!argv.headless });

  const page = await browser.newPage();
  await blockThirdParty(page);

  const loginLoadResponse = await page.goto(baseUrl);
  if (!loginLoadResponse.ok()) {
    console.error({ loginLoadResponse });
    throw new Error('Error on loading the page.');
  }

  const subjects = await extractProviders(page);

  for (const [i, subject] of subjects.entries()) {
    /**
     * @todo cada iteração deve ser executada em uma Cloud Function
     */
    await page.goto(subject.path);
    subjects[i].details = await extractProviderDetails(page);
  }

  /**
   * @todo gravar em um armazenamento genérico
   */
  await write('output/pinhao/data/data.json', JSON.stringify(subjects, null, 2));

  // await browser.close();
})();