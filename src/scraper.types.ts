import { z } from 'zod';

import { ScraperConfigFile } from './scraper.schemas';

export type ScraperConfigFiles = z.infer<typeof ScraperConfigFile>[];
