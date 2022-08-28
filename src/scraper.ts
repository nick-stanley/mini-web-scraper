import { readdir, readFile } from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import readline from 'readline';

import { ScraperConfigFile } from './scraper.schemas';
import { ScraperConfigFiles } from './scraper.types';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const scraper = async () => {
  const scraperFiles = await getScraperFiles();
  if (!scraperFiles.length) await handleNoFiles();
  const pages = await getPages(scraperFiles);
  const values = await getValues(pages);
  console.log('\n');
  console.log(values.join('\n'));
  promptRunAgain();
};

async function handleNoFiles() {
  console.log('\nNo config files found');
  return promptExit();
}

async function promptRunAgain() {
  const answer = await question('\nRun again? (y/n)');
  if (answer.toLowerCase() === 'y') return scraper();
  process.exit(0);
}

async function promptExit() {
  const answer = await question('\nExit? (y/n)');
  if (answer.toLowerCase() === 'y') process.exit(0);
  return promptRunAgain();
}

async function getScraperFiles(): Promise<ScraperConfigFiles> {
  try {
    const cwd = process.cwd(); // Unsure if there's a better way to get the root directory in this case
    const scraperConfigFilesPath = path.join(cwd, 'config');
    const fileNames = await readdir(scraperConfigFilesPath);
    const files = await Promise.all(
      fileNames.map(async fileName => {
        const file = await readFile(path.join(scraperConfigFilesPath, fileName));
        return {
          name: fileName,
          contents: file.toString(),
        };
      }),
    );
    return files.map(({ contents }) => ScraperConfigFile.parse(JSON.parse(contents)));
  } catch (err) {
    console.log(err);
  }
  return [];
}

async function getPages(scraperConfigFiles: ScraperConfigFiles) {
  try {
    const browser = await puppeteer.launch();
    return Promise.all(
      scraperConfigFiles.flatMap(configs =>
        configs.map(async config => {
          const page = await browser.newPage();
          const response = await page.goto(config.url);
          return {
            config,
            response,
            page,
          };
        }),
      ),
    );
  } catch (error) {
    console.log(error);
  }
  return [];
}

async function getValues(pages: Awaited<ReturnType<typeof getPages>>) {
  try {
    return await Promise.all(
      pages.flatMap(async ({ response, page, config: { url, elements } }) => {
        if (!response?.ok) return `Had trouble with: ${url}`;
        return await page.evaluate(elements => {
          return elements
            .map(({ selector, attribute }) => {
              const el = document.querySelector(selector);
              if (!el) return `Could not find by selector: ${selector}`;
              const value = attribute ? el.getAttribute(attribute) : el.textContent;
              const removeTabsAndNewLines = /[\t\n\r]/gm;
              return (
                value?.toString().trim().replace(removeTabsAndNewLines, '') ??
                `Could not get a value by: ${attribute ?? 'textContent'}`
              );
            })
            .join(', ');
        }, elements);
      }),
    );
  } catch (error) {
    console.log(error);
  }
  return [];
}

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}
