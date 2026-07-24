import type { Meta, StoryObj } from '@storybook/react-vite'
import { BucketProvider } from '../bucket'
import { CachedImage } from '../image'
import { ImageCacheProvider } from '../provider'

const meta: Meta<typeof CachedImage> = {
  title: 'CachedImage',
  component: CachedImage,
  decorators: [
    Story => (
      <ImageCacheProvider ram={200} video={60} units="MB" loaders={4}>
        <BucketProvider name="storybook">
          <Story />
        </BucketProvider>
      </ImageCacheProvider>
    ),
  ],
  args: {
    url: 'https://picsum.photos/seed/storybook/640/360',
    width: 320,
    height: 180,
  },
  argTypes: {
    fit: { control: 'radio', options: ['fill', 'cover', 'contain'] },
  },
}

export default meta
type Story = StoryObj<typeof CachedImage>

export const Basic: Story = {}

export const CoverFit: Story = {
  args: {
    url: 'https://picsum.photos/seed/cover/800/600',
    fit: 'cover',
  },
}

export const WithOverlay: Story = {
  args: {
    children: (
      <div
        style={{
          width: '64px',
          height: '20px',
          background: '#ff7a00',
          color: '#fff',
          fontFamily: 'sans-serif',
          fontSize: '12px',
          lineHeight: '20px',
          textAlign: 'center',
        }}
      >
        LIVE
      </div>
    ),
  },
}

export const FadeInViaDataState: Story = {
  render: args => (
    <>
      <style>{`
        .fade-poster { opacity: 0.35; transition: opacity 300ms ease-out; }
        .fade-poster[data-state='rendered'] { opacity: 1; }
      `}</style>
      <CachedImage {...args} className="fade-poster" />
    </>
  ),
  args: {
    url: 'https://picsum.photos/seed/fade/640/360',
  },
}
