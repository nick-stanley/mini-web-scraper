import { readdir, readFile } from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import readline from 'readline';

import { ScraperConfigFile, ScraperElement } from './scraper.schemas';
import { ScraperConfig, ScraperConfigFiles } from './scraper.types';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const scraper = async (input?: string) => {
  const pattern = input ? new RegExp(input, 'i') : null;
  const scraperFiles = await getScraperFiles(pattern);
  if (!scraperFiles.length) return handleNoFiles(input);
  const pages = await getPages(scraperFiles);
  const values = await processPages(pages);
  console.log('\n');
  console.log(values.join('\n'));
  promptRunAgain(input);
};

function handleNoFiles(input?: string) {
  const forInputMessage = input ? ` for input: ${input}` : '';
  console.log(`\nNo config files found${forInputMessage}`);
  process.exit(0);
}

async function promptRunAgain(input?: string) {
  const answer = await question('\nRun again? (y/n)');
  if (answer.toLowerCase() === 'y') return scraper(input);
  process.exit(0);
}

async function getScraperFiles(pattern: RegExp | null): Promise<ScraperConfigFiles> {
  try {
    const cwd = process.cwd(); // Unsure if there's a better way to get the root directory in this case
    const scraperConfigFilesPath = path.join(cwd, 'config');
    const fileNames = await readdir(scraperConfigFilesPath);
    const files = await Promise.all(
      fileNames
        .filter(fileName => !!(pattern ? fileName.match(pattern) : true))
        .map(async fileName => {
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

async function processPages(pages: Awaited<ReturnType<typeof getPages>>) {
  try {
    return await Promise.all(
      pages.flatMap(async ({ response, page, config }) => {
        const { url } = config;
        if (!response?.ok) return `Had trouble with: ${url}`;
        return await page.evaluate(evaluatePage, config);
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

function evaluatePage(config: ScraperConfig) {
  const { elements, url } = config;
  return getValues([], elements, document).join('');

  function getValues(
    currentValues: string[],
    scraperElements: ScraperElement[],
    parentNode: Document | Element,
  ): string[] {
    return scraperElements.reduce((accumulator, scraperElement) => {
      const { selector, elements: childScraperElements, multiple } = scraperElement;
      const hasChildScraperElements = !!childScraperElements?.length;
      const nodes = multiple
        ? Array.from(parentNode.querySelectorAll(selector)).filter(Boolean)
        : ([parentNode.querySelector(selector)].filter(Boolean) as Element[]);
      if (!nodes.length) return accumulator.concat(getFallbackMessage(scraperElement));
      if (hasChildScraperElements) {
        // Has child elements, so get their values instead of a value for the current element
        const newValues = nodes.map(node => getValues(accumulator, childScraperElements, node)).flat();
        return accumulator.concat(newValues);
      } else {
        // No child elements, so get the value for the current element
        const newValues = nodes.map(mapScraperElement(scraperElement));
        return accumulator.concat(newValues);
      }
    }, currentValues);
  }

  function mapScraperElement(scraperElement: ScraperElement) {
    const { attribute, before, after, selector } = scraperElement;
    return (node: Element) => {
      const fallbackMessage = getFallbackMessage(scraperElement);
      const value = [attribute ? node.getAttribute(attribute) : node.textContent];
      const clean = value
        .map(removeTabsAndNewLines)
        .map(convertRelativeLinksToAbsolute(attribute, url))
        .map(provideFallback(fallbackMessage));
      const transformed = clean.map(applyBefore(before)).map(applyAfter(after));
      return transformed.join('');
    };
  }

  function removeTabsAndNewLines(value: string | null): string | null {
    const tabsAndNewLines = /[\t\n\r]/gm;
    return value?.toString().trim().replace(tabsAndNewLines, '') ?? null;
  }

  function convertRelativeLinksToAbsolute(attribute: string | undefined, url: string) {
    return (value: string | null): string | null => {
      if (!value || attribute !== 'href') return value;
      return new URL(value, url).href;
    };
  }

  function applyBefore(before: string | undefined) {
    return (value: string) => {
      if (!before) return value;
      return `${before}${value}`;
    };
  }

  function applyAfter(after: string | undefined) {
    return (value: string | null) => {
      if (!after) return value;
      return `${value}${after}`;
    };
  }

  function provideFallback(fallbackMessage: string) {
    return (value: string | null) => {
      if (!value) return fallbackMessage;
      return value;
    };
  }

  function getFallbackMessage({ selector, attribute }: ScraperElement) {
    return `Could not get a value for ${selector} by ${attribute ?? 'textContent'}`;
  }
}
