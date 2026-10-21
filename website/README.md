# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ npm install
```

### Local Development

```
$ npm run dev
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Examples

Each example in `docs/examples` is a `*.example.ts` script with an `.mdx` page that shows it. Examples:

- import only from `asn1js`;
- print results with `console.log`;
- are typechecked against the library source in the website workflow. To run the check locally, run `npm ci && npx tsc --noEmit -p website/docs/examples` in the repository root.
