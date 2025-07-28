import type { Preview } from '@storybook/react-vite'
import './preview.css'

const preview: Preview = {
  parameters: {
    // Actions addon is now built-in
    actions: { argTypesRegex: "^on[A-Z].*" },
    // Controls addon is now built-in
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // Docs configuration
    docs: {
      toc: true,
    },
    // Backgrounds addon is now built-in
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1f2937',
        },
      ],
    },
    // Layout options
    layout: 'centered',
  },
};

export default preview;