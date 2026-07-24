import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'tv',
      values: [{ name: 'tv', value: '#14141c' }],
    },
    controls: { expanded: true },
  },
}

export default preview
