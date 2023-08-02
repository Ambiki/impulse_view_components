import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
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
            text: 'Select',
            link: '/components/select',
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
