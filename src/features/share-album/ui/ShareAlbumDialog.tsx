import { useState, type FC } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Album } from '@/entities/album'
import {
  buildShareUrl,
  SHARE_EXPIRATION_OPTIONS,
  type ShareExpiration,
} from '../api/shareApi'
import { useCreateShareLink, useRevokeShareLink, useShareLinks } from '../hooks/useShareLinks'

interface ShareAlbumDialogProps {
  album: Album | null
  isOpen: boolean
  onClose: () => void
}

export const ShareAlbumDialog: FC<ShareAlbumDialogProps> = ({ album, isOpen, onClose }) => {
  const [expiration, setExpiration] = useState<ShareExpiration>('7d')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: shares = [], isLoading } = useShareLinks(album?.id)
  const createShareLink = useCreateShareLink()
  const revokeShareLink = useRevokeShareLink()

  if (!isOpen || !album) return null

  const activeShares = shares.filter(
    (share) => !share.expires_at || parseISO(share.expires_at) > new Date(),
  )

  const handleCreate = async () => {
    setActionError(null)
    try {
      const share = await createShareLink.mutateAsync({ albumId: album.id, expiration })
      await navigator.clipboard.writeText(buildShareUrl(share.token))
      setCopiedToken(share.token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      setActionError((error as Error).message)
    }
  }

  const handleCopy = async (token: string) => {
    await navigator.clipboard.writeText(buildShareUrl(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleRevoke = async (shareId: string) => {
    setActionError(null)
    try {
      await revokeShareLink.mutateAsync({ shareId, albumId: album.id })
    } catch (error) {
      setActionError((error as Error).message)
    }
  }

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Sin caducidad'
    const date = parseISO(expiresAt)
    return `Caduca el ${format(date, "d MMM yyyy 'a las' HH:mm", { locale: es })}`
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-album-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h2 id="share-album-title" className="text-xl font-bold text-text-primary">
            Compartir "{album.name}"
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Cualquier persona con el enlace podrá ver este álbum, sin necesidad de cuenta.
          </p>
        </div>

        {actionError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {/* Generar nuevo enlace */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-bg-secondary/60 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="share-expiration" className="mb-1 block text-xs font-semibold text-text-secondary">
              Caducidad del enlace
            </label>
            <select
              id="share-expiration"
              value={expiration}
              onChange={(event) => setExpiration(event.target.value as ShareExpiration)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40"
            >
              {SHARE_EXPIRATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={createShareLink.isPending}
            className="rounded-xl bg-accent-romantic px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {createShareLink.isPending ? 'Generando…' : '🔗 Generar enlace de compartir'}
          </button>
        </div>

        {/* Lista de enlaces activos */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Enlaces activos
          </h3>
          {isLoading && <p className="text-sm text-text-secondary">Cargando enlaces…</p>}
          {!isLoading && activeShares.length === 0 && (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-text-secondary">
              Todavía no hay enlaces activos para este álbum.
            </p>
          )}
          {activeShares.map((share) => {
            const url = buildShareUrl(share.token)
            return (
              <div
                key={share.id}
                className="space-y-2 rounded-2xl border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={url}
                    onFocus={(event) => event.target.select()}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 font-mono text-xs text-text-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(share.token)}
                    className="shrink-0 rounded-lg bg-accent-romantic px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    {copiedToken === share.token ? '✓ Copiado' : 'Copiar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(share.id)}
                    disabled={revokeShareLink.isPending}
                    className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Revocar
                  </button>
                </div>
                <p className="text-[11px] text-text-secondary">{formatExpiry(share.expires_at)}</p>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
