import { z } from 'zod';

// interface is now required to allow for a recursive schema
export interface ScraperElement {
  selector: string;
  attribute?: string;
  elements?: ScraperElement[];
  multiple?: boolean;
  before?: string;
  after?: string;
}

export const ScraperElement: z.ZodType<ScraperElement> = z.lazy(() =>
  z.object({
    selector: z.string({
      required_error: '"selector" is required',
    }),
    attribute: z.optional(z.string()),
    elements: z.optional(z.array(ScraperElement)),
    multiple: z.optional(z.boolean()),
    before: z.optional(z.string()),
    after: z.optional(z.string()),
  }),
);

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
