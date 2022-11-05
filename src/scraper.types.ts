import { z } from 'zod';

import { ScraperConfig, ScraperConfigFile } from './scraper.schemas';

export type ScraperConfigFiles = z.infer<typeof ScraperConfigFile>[];

export type ScraperConfig = z.infer<typeof ScraperConfig>;
