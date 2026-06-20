import { defineConfig } from 'vitepress';
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/impulse_view_components/',
  title: 'Impulse ViewComponents',
  description: 'View components for Ruby on Rails.',
  lastUpdated: true,
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
[ViewComponent](https://viewcomponent.org/). Each component renders server-side HTML and ships with a matching \
custom element from [\`@ambiki/impulse\`](https://github.com/Ambiki/impulse) for behavior, so you get progressive \
enhancement without a heavy client framework.

Components include Ajax select, Dialog, Popover, Select, Spinner, and Time zone select. JavaScript behavior is \
exposed through a small JS API (Autocomplete, Dialog, Popover) and reusable hooks (\`useFloatingUI\`, \
\`useOutsideClick\`). Components are imported individually for both JS and styles, so you only ship what you use.`,
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
            text: 'Dialog',
            link: '/components/dialog',
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
            text: 'Spinner',
            link: '/components/spinner',
          },
          {
            text: 'Time zone select',
            link: '/components/time-zone-select',
          },
        ],
      },
      {
        text: 'JS API',
        collapsed: false,
        items: [
          {
            text: 'Autocomplete',
            link: '/js-api/autocomplete',
          },
          {
            text: 'Dialog',
            link: '/js-api/dialog',
          },
          {
            text: 'Popover',
            link: '/js-api/popover',
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
            text: 'useOutsideClick',
            link: '/hooks/use-outside-click',
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
