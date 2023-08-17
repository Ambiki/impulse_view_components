import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/impulse_view_components/',
  title: 'Impulse ViewComponents',
  description: 'View components for Ruby on Rails.',
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: 'Home', link: '/' }],
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
            text: 'Select',
            link: '/components/select',
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
        ],
      },
    ],
    footer: {
      message: 'Released under the MIT License.',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Ambiki/impulse_view_components' }],
  },
});
