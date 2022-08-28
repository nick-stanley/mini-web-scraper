"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scraper = void 0;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const readline_1 = __importDefault(require("readline"));
const scraper_schemas_1 = require("./scraper.schemas");
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const scraper = async () => {
    const scraperFiles = await getScraperFiles();
    if (!scraperFiles.length)
        await handleNoFiles();
    const pages = await getPages(scraperFiles);
    const values = await getValues(pages);
    console.log('\n');
    console.log(values.join('\n'));
    promptRunAgain();
};
exports.scraper = scraper;
async function handleNoFiles() {
    console.log('\nNo config files found');
    return promptExit();
}
async function promptRunAgain() {
    const answer = await question('\nRun again? (y/n)');
    if (answer.toLowerCase() === 'y')
        return (0, exports.scraper)();
    process.exit(0);
}
async function promptExit() {
    const answer = await question('\nExit? (y/n)');
    if (answer.toLowerCase() === 'y')
        process.exit(0);
    return promptRunAgain();
}
async function getScraperFiles() {
    try {
        const cwd = process.cwd(); // Unsure if there's a better way to get the root directory in this case
        const scraperConfigFilesPath = path_1.default.join(cwd, 'config');
        const fileNames = await (0, promises_1.readdir)(scraperConfigFilesPath);
        const files = await Promise.all(fileNames.map(async (fileName) => {
            const file = await (0, promises_1.readFile)(path_1.default.join(scraperConfigFilesPath, fileName));
            return {
                name: fileName,
                contents: file.toString(),
            };
        }));
        return files.map(({ contents }) => scraper_schemas_1.ScraperConfigFile.parse(JSON.parse(contents)));
    }
    catch (err) {
        console.log(err);
    }
    return [];
}
async function getPages(scraperConfigFiles) {
    try {
        const browser = await puppeteer_1.default.launch();
        return Promise.all(scraperConfigFiles.flatMap(configs => configs.map(async (config) => {
            const page = await browser.newPage();
            const response = await page.goto(config.url);
            return {
                config,
                response,
                page,
            };
        })));
    }
    catch (error) {
        console.log(error);
    }
    return [];
}
async function getValues(pages) {
    try {
        return await Promise.all(pages.flatMap(async ({ response, page, config: { url, elements } }) => {
            if (!response?.ok)
                return `Had trouble with: ${url}`;
            return await page.evaluate(elements => {
                return elements
                    .map(({ selector, attribute }) => {
                    const el = document.querySelector(selector);
                    if (!el)
                        return `Could not find by selector: ${selector}`;
                    const value = attribute ? el.getAttribute(attribute) : el.textContent;
                    const removeTabsAndNewLines = /[\t\n\r]/gm;
                    return (value?.toString().trim().replace(removeTabsAndNewLines, '') ??
                        `Could not get a value by: ${attribute ?? 'textContent'}`);
                })
                    .join(', ');
            }, elements);
        }));
    }
    catch (error) {
        console.log(error);
    }
    return [];
}
function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}
