import { defineConfig } from 'vitepress';
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/impulse_view_components/',
  title: 'Impulse ViewComponents',
  description: 'View components for Ruby on Rails.',
  lastUpdated: true,
  // Architecture decision records and research notes are for maintainers, not part of the published docs.
  srcExclude: ['adr/**', 'research/**'],
  markdown: {
    config(md) {
      md.use(copyOrDownloadAsMarkdownButtons);
    },
  },
  vite: {
    plugins: [
      llmstxt({
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        // Makes the .md links in llms.txt absolute. The plugin already includes the site `base`
        // (/impulse_view_components/) in the paths, so the domain is the bare host without it.
        domain: 'https://ambiki.github.io',
        description: 'View components for Ruby on Rails.',
        details: `\
Impulse ViewComponents is a library of accessible, interactive UI components for Ruby on Rails, built with \
[ViewComponent](https://viewcomponent.org/). Each component renders server-side HTML, and the interactive ones ship \
with a matching custom element, built on [\`@ambiki/impulse\`](https://github.com/Ambiki/impulse), for behavior, so \
you get progressive enhancement without a heavy client framework.

Components include Ajax select, Anchor, Clipboard copy, Date calendar, Dialog, Month calendar, Popover, Select, Sheet, Spinner, Time zone select, Week calendar, and Year calendar. \
JavaScript behavior is exposed through a small JS API (Anchor, Autocomplete, Clipboard copy, Date calendar, Dialog, Month calendar, Popover, Week calendar, Year calendar) and \
reusable hooks (\`useFloatingUI\`, \`useFocusOut\`, \`useOutsideClick\`). Components are imported individually, so you \
only ship what you use.`,
      }),
    ],
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'For AI',
        items: [
          // Build-only static files: 404 on the dev server, work in preview/production.
          // `target: '_blank'` makes VitePress treat these as external, so the
          // `/impulse_view_components/` base is not auto-prepended — include it explicitly.
          { text: 'llms.txt', link: '/impulse_view_components/llms.txt', target: '_blank' },
          { text: 'llms-full.txt', link: '/impulse_view_components/llms-full.txt', target: '_blank' },
        ],
      },
    ],
    outline: 'deep',
    search: {
      provider: 'local',
    },
    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          {
            text: 'Getting started',
            link: '/introduction/getting-started',
          },
        ],
      },
      {
        text: 'Components',
        collapsed: false,
        items: [
          {
            text: 'Ajax select',
            link: '/components/ajax-select',
          },
          {
            text: 'Anchor',
            link: '/components/anchor',
          },
          {
            text: 'Clipboard copy',
            link: '/components/clipboard-copy',
          },
          {
            text: 'Date calendar',
            link: '/components/date-calendar',
          },
          {
            text: 'Dialog',
            link: '/components/dialog',
          },
          {
            text: 'Month calendar',
            link: '/components/month-calendar',
          },
          {
            text: 'Popover',
            link: '/components/popover',
          },
          {
            text: 'Select',
            link: '/components/select',
          },
          {
            text: 'Sheet',
            link: '/components/sheet',
          },
          {
            text: 'Spinner',
            link: '/components/spinner',
          },
          {
            text: 'Time zone select',
            link: '/components/time-zone-select',
          },
          {
            text: 'Toast',
            link: '/components/toast',
          },
          {
            text: 'Week calendar',
            link: '/components/week-calendar',
          },
          {
            text: 'Year calendar',
            link: '/components/year-calendar',
          },
        ],
      },
      {
        text: 'JS API',
        collapsed: false,
        items: [
          {
            text: 'Anchor',
            link: '/js-api/anchor',
          },
          {
            text: 'Autocomplete',
            link: '/js-api/autocomplete',
          },
          {
            text: 'Clipboard copy',
            link: '/js-api/clipboard-copy',
          },
          {
            text: 'Date calendar',
            link: '/js-api/date-calendar',
          },
          {
            text: 'Dialog',
            link: '/js-api/dialog',
          },
          {
            text: 'Month calendar',
            link: '/js-api/month-calendar',
          },
          {
            text: 'Popover',
            link: '/js-api/popover',
          },
          {
            text: 'Toast',
            link: '/js-api/toast',
          },
          {
            text: 'Week calendar',
            link: '/js-api/week-calendar',
          },
          {
            text: 'Year calendar',
            link: '/js-api/year-calendar',
          },
        ],
      },
      {
        text: 'Hooks',
        collapsed: false,
        items: [
          {
            text: 'Introduction',
            link: '/hooks/introduction',
          },
          {
            text: 'useFloatingUI',
            link: '/hooks/use-floating-ui',
          },
          {
            text: 'useFocusOut',
            link: '/hooks/use-focus-out',
          },
          {
            text: 'useOutsideClick',
            link: '/hooks/use-outside-click',
          },
        ],
      },
      {
        text: 'Helpers',
        collapsed: false,
        items: [
          {
            text: 'See all',
            link: '/helpers/',
          },
        ],
      },
    ],
    editLink: {
      pattern: 'https://github.com/Ambiki/impulse_view_components/edit/main/docs/:path',
    },
    footer: {
      message: 'Released under the MIT License.',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Ambiki/impulse_view_components' }],
  },
  sitemap: {
    hostname: 'https://ambiki.github.io/impulse_view_components/',
  },
});
