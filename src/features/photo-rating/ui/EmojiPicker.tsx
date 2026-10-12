import { lazy, Suspense, type FC } from 'react'
import type { Theme } from 'emoji-picker-react'

const Picker = lazy(() => import('emoji-picker-react'))

const DARK_THEME = 'dark' as Theme

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

/**
 * Selector completo de emojis (emoji-picker-react, cargado de forma diferida).
 * Se renderiza como popover flotante sobre el botón que lo abrió.
 */
export const EmojiPicker: FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  return (
    <>
      {/* Capa para cerrar al hacer clic fuera */}
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 overflow-hidden rounded-2xl shadow-2xl">
        <Suspense
          fallback={
            <div className="flex h-[350px] w-[320px] items-center justify-center bg-gray-900 text-sm text-white/70">
              Cargando emojis…
            </div>
          }
        >
          <Picker
            theme={DARK_THEME}
            onEmojiClick={(emojiData) => {
              onSelect(emojiData.emoji)
              onClose()
            }}
            lazyLoadEmojis
            searchPlaceHolder="Buscar emoji"
            previewConfig={{ showPreview: false }}
            height={350}
            width={320}
          />
        </Suspense>
      </div>
    </>
  )
}
