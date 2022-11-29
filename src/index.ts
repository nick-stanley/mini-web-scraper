import { scraper } from './scraper';

const [, , ...args] = process.argv;
const inputs = args.map(value => value.trim());

scraper(inputs);
