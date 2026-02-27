'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Check, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NextImage from 'next/image'

interface ReceiptUploadProps {
  currentUrl?: string | null
  onUpload: (url: string) => Promise<void>
  onRemove?: () => Promise<void>
  label?: string
  compact?: boolean
}

export function ReceiptUpload({
  currentUrl,
  onUpload,
  onRemove,
  label = 'Comprovante',
  compact = false,
}: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validar tamanho
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande (max 5MB)')
      return
    }

    // Preview local
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Falha no upload')
      }

      const data = await res.json()
      await onUpload(data.url)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar')
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemove() {
    if (onRemove) {
      await onRemove()
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {currentUrl ? (
          <div className="flex items-center gap-2">
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
              <Check className="h-3 w-3" />
              Comprovante
              <ExternalLink className="h-3 w-3" />
            </a>
            {onRemove && (
              <button onClick={handleRemove} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Camera className="h-3.5 w-3.5 mr-1" />
            )}
            {uploading ? 'Enviando...' : 'Foto'}
          </Button>
        )}

        {error && <p className="text-[10px] text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          {currentUrl.match(/\.(jpg|jpeg|png|webp)/i) ? (
            <NextImage
              src={currentUrl}
              alt="Comprovante"
              width={400}
              height={192}
              className="w-full h-48 object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-48 bg-muted flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 justify-center">
                  Ver comprovante <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {onRemove && (
              <button
                onClick={handleRemove}
                className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : preview ? (
        <div className="relative rounded-xl overflow-hidden border border-primary/30">
          <NextImage src={preview} alt="Preview" width={400} height={192} className="w-full h-48 object-cover opacity-60" unoptimized />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'w-full h-32 rounded-xl border-2 border-dashed border-border',
            'flex flex-col items-center justify-center gap-2',
            'text-muted-foreground transition-colors',
            'active:bg-muted disabled:opacity-50'
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs">Tirar foto ou enviar arquivo</p>
              <p className="text-[10px]">JPG, PNG ou PDF (max 5MB)</p>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
