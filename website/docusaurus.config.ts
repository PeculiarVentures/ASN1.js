import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';
import npm2yarn from '@docusaurus/remark-plugin-npm2yarn';
import packageJSON from '../package.json';

const config: Config = {
  title: 'asn1js',
  tagline: 'asn1.js',
  favicon: 'img/favicon.ico',
  url: 'https://asn1js.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  customFields: {
    description: packageJSON.description,
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          sidebarPath: './sidebars.ts',
          remarkPlugins: [npm2yarn],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        blog: false,
        // TODO: Add gtag trackingID.
        // gtag: {
        //   trackingID: '',
        // },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../src/index.ts'],
        tsconfig: '../tsconfig.json',
        disableSources: true,
        hideInPageTOC: true,
        readme: 'none',
      },
    ],
    'docusaurus-plugin-sass',
  ],

  themeConfig: {
    prism: {
      theme: prismThemes.oneDark,
    },
    image: 'img/card.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      style: 'dark',
      logo: {
        alt: 'asn1.js',
        src: '/img/logo_r2.svg',
        width: 92,
      },
      items: [
        {
          type: 'docSidebar',
          position: 'right',
          sidebarId: 'docs',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          position: 'right',
          sidebarId: 'examples',
          label: 'Examples',
        },
        {
          href: 'https://github.com/PeculiarVentures/ASN1.js',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: 'Made with ❤️ across the globe',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Installation',
              to: '/docs/installation',
            },
            {
              label: 'Examples',
              to: '/docs/examples/create-new-asn-structures-by-calling-constructors-with-parameters',
            },
            {
              label: 'API',
              to: '/docs/api/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/PeculiarVentures/ASN1.js',
            },
            {
              label: 'Contact us',
              href: 'mailto:info@peculiarventures.com',
            }
          ],
        },
        {
          title: `Version: ${packageJSON.version}`,
        },
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;