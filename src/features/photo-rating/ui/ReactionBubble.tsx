import { useState, type FC } from 'react'
import type { ReactionSummary } from '@/entities/reaction'

interface ReactionBubbleProps {
  reactions: ReactionSummary[]
  /** Máximo de emojis visibles antes de colapsar en "+N" */
  maxVisible?: number
}

/**
 * Burbuja flotante con los emojis más usados y su contador.
 * Al hacer clic despliega la lista de quién reaccionó con cada emoji.
 */
export const ReactionBubble: FC<ReactionBubbleProps> = ({ reactions, maxVisible = 3 }) => {
  const [expanded, setExpanded] = useState(false)

  if (reactions.length === 0) return null

  const visible = reactions.slice(0, maxVisible)
  const hiddenCount = reactions.slice(maxVisible).reduce((acc, r) => acc + r.count, 0)

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-label="Ver quién reaccionó"
        className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-xs transition-transform hover:scale-105 active:scale-95"
      >
        {visible.map(({ emoji, count }) => (
          <span key={emoji} className="flex items-center gap-0.5">
            <span>{emoji}</span>
            <span>{count}</span>
          </span>
        ))}
        {hiddenCount > 0 && <span className="text-white/80">+{hiddenCount}</span>}
      </button>

      {expanded && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setExpanded(false)} />
          <div className="absolute bottom-full left-0 z-40 mb-2 w-52 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs font-bold text-text-primary">Reacciones</p>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {reactions.map(({ emoji, count, userNames }) => (
                <li key={emoji} className="text-xs">
                  <span className="mr-1.5 text-base">{emoji}</span>
                  <span className="font-semibold text-text-primary">{count}</span>
                  <span className="mt-0.5 block text-text-secondary">
                    {userNames.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
