'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Upload, CheckCircle2, Calendar, DollarSign, FileText } from 'lucide-react'
import type { Diarista } from '@/types/database'

interface RetroactivePaymentFormProps {
  diaristas: Diarista[]
  onClose: () => void
  onSuccess: () => void
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

export function RetroactivePaymentForm({ diaristas, onClose, onSuccess }: RetroactivePaymentFormProps) {
  const currentYear = new Date().getFullYear()
  const [loading, setLoading] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptName, setReceiptName] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    diarista_id: '',
    month: '',
    year: currentYear.toString(),
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    description: ''
  })

  const handleUploadReceipt = async (file: File) => {
    setUploadingReceipt(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        setReceiptUrl(data.url)
        setReceiptName(file.name)
      }
    } catch (error) {
      console.error('Error uploading receipt:', error)
    }
    setUploadingReceipt(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.diarista_id || !form.month || !form.year || !form.amount || !form.payment_date) return

    setLoading(true)
    try {
      const month = parseInt(form.month)
      const year = parseInt(form.year)
      const amount = parseFloat(form.amount)

      // Calcula o 5o dia util do mes seguinte como data prevista
      const dueDate = new Date(year, month, 1)
      let businessDays = 0
      while (businessDays < 5) {
        const day = dueDate.getDay()
        if (day !== 0 && day !== 6) businessDays++
        if (businessDays < 5) dueDate.setDate(dueDate.getDate() + 1)
      }

      // Cria o registro de pagamento mensal
      const { error } = await supabase
        .from('monthly_payments')
        .upsert({
          diarista_id: form.diarista_id,
          month,
          year,
          monthly_value: amount,
          payment_due_date: dueDate.toISOString().split('T')[0],
          payment_date: form.payment_date,
          paid_at: new Date(form.payment_date + 'T12:00:00').toISOString(),
          receipt_url: receiptUrl,
          hour_limit: '20:00:00',
          notes: form.description || `Pagamento retroativo - ${MONTHS.find(m => m.value === month)?.label}/${year}`
        }, {
          onConflict: 'month,year,diarista_id'
        })

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating retroactive payment:', error)
    }
    setLoading(false)
  }

  const years = [currentYear - 2, currentYear - 1, currentYear]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative pb-2">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Registrar Pagamento Anterior
          </CardTitle>
          <CardDescription className="text-xs">
            Registre pagamentos de meses anteriores ao uso do app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Diarista */}
            <div className="space-y-1.5">
              <Label className="text-xs">Diarista</Label>
              <Select value={form.diarista_id} onValueChange={(v) => setForm(f => ({ ...f, diarista_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a diarista" />
                </SelectTrigger>
                <SelectContent>
                  {diaristas.filter(d => d.active).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mes/Ano referencia */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mes Referencia</Label>
                <Select value={form.month} onValueChange={(v) => setForm(f => ({ ...f, month: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ano</Label>
                <Select value={form.year} onValueChange={(v) => setForm(f => ({ ...f, year: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-1.5">
              <Label className="text-xs">Valor Pago (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="pl-10"
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>

            {/* Data do pagamento */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Data do Pagamento
              </Label>
              <Input
                type="date"
                value={form.payment_date}
                onChange={(e) => setForm(f => ({ ...f, payment_date: e.target.value }))}
              />
            </div>

            {/* Descricao (opcional) */}
            <div className="space-y-1.5">
              <Label className="text-xs">Observacao (opcional)</Label>
              <Input
                placeholder="Ex: Pagamento via PIX"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Upload comprovante */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Comprovante
              </Label>
              {receiptUrl ? (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-xs text-green-600 truncate flex-1">{receiptName}</span>
                  <button
                    type="button"
                    onClick={() => { setReceiptUrl(null); setReceiptName(null) }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-muted rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadingReceipt ? (
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Clique para anexar comprovante</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadReceipt(file)
                    }}
                  />
                </label>
              )}
            </div>

            {/* Botoes */}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading || !form.diarista_id || !form.month || !form.amount}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Registrar Pagamento
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
