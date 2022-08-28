import { z } from 'zod';

export const ScraperElement = z.object({
  selector: z.string({
    required_error: '"selector" is required',
  }),
  attribute: z.optional(z.string()),
});

export const ScraperConfig = z.object({
  url: z
    .string({
      required_error: '"url" is required',
    })
    .url(),
  elements: ScraperElement.array().nonempty({
    message: '"elements" can\'t be empty',
  }),
});

export const ScraperConfigFile = z.array(ScraperConfig);
