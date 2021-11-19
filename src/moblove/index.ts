import write from 'write';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { client } from './client';
import cheerio from 'cheerio';

/**
 * @todo definir argumentos
 */
const argv = yargs(hideBin(process.argv)).argv as { headless?: boolean };

(async () => {
  const [home, venda, aluguel] = await Promise.all([
    client.get('/'),
    client.get('/filtro/venda/todos/todas/todos/10000-1500000/todos/todos/1/1'),
    client.get('/filtro/aluguel/todos/todas/todos/10000-1500000/todos/todos/1/1'),
  ]);

  await Promise.all([
    write('output/moblove/html/pacto-001-home.html', home.data),
    write('output/moblove/html/pacto-002-venda.html', venda.data),
    write('output/moblove/html/pacto-003-aluguel.html', aluguel.data),
  ]);

  const $home = cheerio.load(home.data);

  const parseId = (value: string) => value.split('.')[0];
  const parseOptions = (options: cheerio.Element[]) => options
    .map((el) => $home(el))
    .filter((el) => el.prop('value'))
    .map((el) => ({
      id: parseId(el.prop('value')),
      name: el.text(),
    }));

  const categoriesOptions = $home('select[name=cat3] option').toArray();
  const categories = parseOptions(categoriesOptions);

  const citiesOptions = $home('select[name=cidade] option').toArray();
  const cities = parseOptions(citiesOptions);

  const districtsOptions = $home('select[name=bairro] option').toArray();
  const districts = parseOptions(districtsOptions);

  const $venda = cheerio.load(venda.data);
  const vendaPages = $venda(`a[href^='${client.defaults.baseURL}filtro/venda/todos/todas/todos/10000-1500000/todos/todos/1/']`).toArray().map((el) => $venda(el).prop('href'));
  const $aluguel = cheerio.load(aluguel.data);
  const aluguelPages = $aluguel(`a[href^='${client.defaults.baseURL}filtro/aluguel/todos/todas/todos/10000-1500000/todos/todos/1/']`).toArray().map((el) => $aluguel(el).prop('href'));

  await write(
    'output/moblove/data/pacto-001-home.json',
    JSON.stringify({
      categories,
      cities,
      districts,
      vendaPages,
      aluguelPages,
      createdAt: new Date().toISOString(),
    }, null, 2),
  );

})();