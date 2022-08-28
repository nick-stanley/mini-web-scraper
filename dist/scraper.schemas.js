"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperConfigFile = exports.ScraperConfig = exports.ScraperElement = void 0;
const zod_1 = require("zod");
exports.ScraperElement = zod_1.z.object({
    selector: zod_1.z.string({
        required_error: '"selector" is required',
    }),
    attribute: zod_1.z.optional(zod_1.z.string()),
});
exports.ScraperConfig = zod_1.z.object({
    url: zod_1.z
        .string({
        required_error: '"url" is required',
    })
        .url(),
    elements: exports.ScraperElement.array().nonempty({
        message: '"elements" can\'t be empty',
    }),
});
exports.ScraperConfigFile = zod_1.z.array(exports.ScraperConfig);
