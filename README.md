# Mini Web Scraper

Add simple configuration files to scrape data from websites.

Run these configuration files by running `node dist/index.js` from the command line from the project's root directory, or by opening [start.bat](./start.bat) if using Windows.

Requires [Node.js](https://nodejs.org/en/).

## Configuration files

Add configuration files to the [config](./config) directory.

```json
[
  {
    "url": "https://example.com",
    "elements": [
      {
        "selector": "#some-selector"
      }
    ]
  },
  {
    "url": "https://another-example.com",
    "elements": [
      {
        "selector": "[property='og:title']",
        "attribute": "content"
      }
    ]
  }
]
```

Each configuration file contain an array of configurations, each specifying a URL and an array of elements to extract data from.

```typescript
type ScraperConfigFile = ScraperConfig[];

type ScraperConfig = {
  url: string;
  elements: ScraperElement[];
};

type ScraperElement = {
  selector: string;
  attribute?: string;
};
```

Each config must have `url` and `elements`. Each element must have a `selector` but has an optional `attribute`. By default, if an element is found with the provided `selector`, its [textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) is returned. If an attribute is provided, the value for that attribute is returned instead.

## Selectors

[querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) is used to find elements at the specified URL, so any valid selector can be used. See [more about selectors on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors#selectors).

## Run at startup

If you want to run Mini Web Scraper at startup on Windows, create a shortcut to [start.bat](./start.bat), run `shell:startup` to open the startup directory, and place the shortcut in that directory.

## Example configuration files

There are currently some example configuration files in [config](./config/) that should be removed when you have your own. These files may not work when you run them because the the websites they reference can change. A URL may no longer work, or the selector used may no longer exist. Keep this in mind when creating your own config files - you may have to adjust them as the websites you reference change.
