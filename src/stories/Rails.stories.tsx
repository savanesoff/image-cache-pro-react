/**
 * The flagship demo: rails of posters driving the real scheduler — the same
 * workload the engine was built for on set-top boxes. Use the controls to
 * feel the frame budget, priorities and memory pressure.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { BucketProvider, useBucketState } from '../bucket'
import { CachedImage } from '../image'
import { ImageCacheProvider, useController } from '../provider'

type RailsProps = {
  rails: number
  cards: number
  ram: number
  video: number
  frameBudgetBytes: number
}

const CARD = { width: 200, height: 112 }

function Rail({ rail, cards }: { rail: number; cards: number }) {
  const state = useBucketState()

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          color: '#9a9aa8',
          fontFamily: 'monospace',
          fontSize: '12px',
          height: '18px',
        }}
      >
        {`rail ${rail} · load ${Math.round(state.loadProgress * 100)}% · ` +
          `${state.rendered ? 'rendered' : 'rendering…'} · ` +
          `${state.requestCount} requests`}
      </div>
      <div style={{ display: 'flex', overflow: 'hidden' }}>
        {Array.from({ length: cards }, (_, card) => (
          <CachedImage
            key={card}
            url={`https://picsum.photos/seed/r${rail}c${card}/400/224`}
            width={CARD.width}
            height={CARD.height}
            priority={rail === 0 ? 1 : 0}
            className="rail-poster"
            style={{ marginRight: '8px', flexShrink: 0 }}
          />
        ))}
      </div>
    </div>
  )
}

function StatsBar() {
  const controller = useController()
  const [, force] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => force(n => n + 1), 500)
    return () => clearInterval(timer)
  }, [])

  if (!controller) return null
  const ram = controller.ram.getUsedSpace()
  const video = controller.video.getUsedSpace()

  return (
    <div
      style={{
        color: '#4dd68a',
        fontFamily: 'monospace',
        fontSize: '12px',
        height: '20px',
        marginBottom: '8px',
      }}
    >
      {`RAM ${ram.units.toFixed(1)}/${controller.ram.size}MB · ` +
        `VID ${video.units.toFixed(1)}/${controller.video.size}MB · ` +
        `queue ${controller.frameQueue.size} · images ${controller.cache.size}`}
    </div>
  )
}

function Rails({ rails, cards, ram, video, frameBudgetBytes }: RailsProps) {
  return (
    <ImageCacheProvider
      ram={ram}
      video={video}
      units="MB"
      loaders={4}
      frameBudget={{ bytes: frameBudgetBytes }}
    >
      <style>{`
        .rail-poster { opacity: 0.35; transition: opacity 250ms ease-out; }
        .rail-poster[data-state='rendered'] { opacity: 1; }
        .rail-poster[data-state='evicted'] { opacity: 0.15; }
      `}</style>
      <StatsBar />
      {Array.from({ length: rails }, (_, rail) => (
        <BucketProvider key={rail} name={`rail-${rail}`}>
          <Rail rail={rail} cards={cards} />
        </BucketProvider>
      ))}
    </ImageCacheProvider>
  )
}

const meta: Meta<typeof Rails> = {
  title: 'Demo/Rails',
  component: Rails,
  parameters: { layout: 'padded' },
  args: {
    rails: 6,
    cards: 12,
    ram: 200,
    video: 60,
    frameBudgetBytes: 1_048_576,
  },
  argTypes: {
    rails: { control: { type: 'range', min: 1, max: 12 } },
    cards: { control: { type: 'range', min: 4, max: 24 } },
    ram: { control: { type: 'range', min: 10, max: 400 } },
    video: { control: { type: 'range', min: 5, max: 240 } },
    frameBudgetBytes: {
      control: { type: 'range', min: 65_536, max: 8_388_608 },
    },
  },
}

export default meta
type Story = StoryObj<typeof Rails>

export const Scheduled: Story = {}

export const TinyFrameBudget: Story = {
  args: { frameBudgetBytes: 65_536 },
}

export const MemoryPressure: Story = {
  args: { video: 5, rails: 8, cards: 16 },
}
