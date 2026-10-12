import { useRef, useState, type FC } from 'react'
import gsap from 'gsap'
import { useAuth } from '@/app/providers'
import {
  REACTION_EMOJIS,
  summarizeReactions,
  useAddReaction,
  useReactions,
  useRemoveReaction,
} from '@/entities/reaction'
import { EmojiPicker } from './EmojiPicker'

interface EmojiReactionBarProps {
  photoId: string
}

/**
 * Barra de reacciones con los emojis más usados y un botón "+" que abre
 * el selector completo. Al reaccionar, el emoji "salta" con GSAP
 * (escala 0 → 1.2 → 1) acompañado de partículas sutiles.
 */
export const EmojiReactionBar: FC<EmojiReactionBarProps> = ({ photoId }) => {
  const { user } = useAuth()
  const { data: reactions = [] } = useReactions(photoId)
  const addReaction = useAddReaction()
  const removeReaction = useRemoveReaction()
  const [pickerOpen, setPickerOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const summary = summarizeReactions(reactions, photoId, user?.id)
  const isPending = addReaction.isPending || removeReaction.isPending

  const animateReaction = (emoji: string) => {
    const bar = barRef.current
    if (!bar) return

    // Emoji flotante que "salta": escala 0 → 1.2 → 1 mientras sube
    const burst = document.createElement('span')
    burst.textContent = emoji
    burst.className = 'pointer-events-none absolute left-1/2 top-0 text-3xl'
    bar.appendChild(burst)

    gsap.fromTo(
      burst,
      { scale: 0, xPercent: -50, y: 0, opacity: 1 },
      {
        scale: 1.2,
        y: -56,
        duration: 0.35,
        ease: 'back.out(2.5)',
        onComplete: () => {
          gsap.to(burst, {
            scale: 1,
            y: -80,
            opacity: 0,
            duration: 0.3,
            onComplete: () => burst.remove(),
          })
        },
      },
    )

    // Partículas sutiles alrededor del emoji
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('span')
      particle.textContent = '✦'
      particle.className = 'pointer-events-none absolute left-1/2 top-0 text-xs text-accent-romantic'
      bar.appendChild(particle)

      const angle = (Math.PI * 2 * i) / 6
      gsap.fromTo(
        particle,
        { xPercent: -50, x: 0, y: 0, opacity: 0.9, scale: 0.5 },
        {
          x: Math.cos(angle) * 34,
          y: Math.sin(angle) * 34 - 20,
          opacity: 0,
          scale: 1,
          duration: 0.55,
          ease: 'power2.out',
          onComplete: () => particle.remove(),
        },
      )
    }
  }

  const handleToggle = (emoji: string) => {
    const existing = summary.find((item) => item.emoji === emoji)
    if (existing?.reactedByMe && existing.myReactionId) {
      removeReaction.mutate(existing.myReactionId)
    } else {
      animateReaction(emoji)
      addReaction.mutate({ photoId, emoji })
    }
  }

  return (
    <div
      ref={barRef}
      className="relative flex items-center justify-center gap-1.5 py-2"
      onClick={(event) => event.stopPropagation()}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const entry = summary.find((item) => item.emoji === emoji)
        const reactedByMe = entry?.reactedByMe ?? false
        return (
          <button
            key={emoji}
            type="button"
            disabled={isPending}
            onClick={() => handleToggle(emoji)}
            aria-pressed={reactedByMe}
            aria-label={`Reaccionar con ${emoji}`}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-lg transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-60 ${
              reactedByMe
                ? 'bg-accent-romantic text-white shadow-sm'
                : 'bg-white/15 text-white hover:bg-white/30'
            }`}
          >
            <span>{emoji}</span>
            {entry && entry.count > 0 && (
              <span className="text-xs font-semibold">{entry.count}</span>
            )}
          </button>
        )
      })}

      {/* Botón "+" que abre el selector completo */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          aria-label="Más emojis"
          aria-expanded={pickerOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white transition-all duration-200 hover:scale-110 hover:bg-white/30 active:scale-95"
        >
          ＋
        </button>
        {pickerOpen && (
          <EmojiPicker
            onSelect={(emoji) => handleToggle(emoji)}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
