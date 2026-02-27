'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, AlertTriangle, CheckCircle, XCircle, FileText, Trash2, Edit2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotes } from '@/hooks/use-notes'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Note } from '@/types/database'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const NOTE_TYPES = [
  { value: 'general', label: 'Nota Geral', Icon: FileText, color: 'text-primary' },
  { value: 'warning', label: 'Observação', Icon: AlertTriangle, color: 'text-warning' },
  { value: 'extra_work', label: 'Trabalho Extra', Icon: CheckCircle, color: 'text-success' },
  { value: 'missed_task', label: 'Tarefa Não Realizada', Icon: XCircle, color: 'text-destructive' },
]

export default function NotesPage() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    date: new Date(),
    note_type: 'general' as Note['note_type'],
    content: '',
    is_warning: false,
  })

  const { notes, loading, addNote, updateNote, deleteNote } = useNotes(selectedMonth, selectedYear)
  const warningsCount = notes.filter(n => n.is_warning).length
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd')
      if (editingNote) {
        await updateNote(editingNote.id, formData.content, formData.is_warning)
      } else {
        await addNote(dateStr, formData.note_type, formData.content, formData.is_warning)
      }
      setFormData({ date: new Date(), note_type: 'general', content: '', is_warning: false })
      setShowForm(false)
      setEditingNote(null)
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      date: new Date(note.date + 'T00:00:00'),
      note_type: note.note_type,
      content: note.content,
      is_warning: note.is_warning,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingNote(null)
    setFormData({ date: new Date(), note_type: 'general', content: '', is_warning: false })
  }

  const getNoteTypeInfo = (type: Note['note_type']) =>
    NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0]

  return (
    <div className="min-h-dvh bg-background flex flex-col safe-area-inset-top">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-bold leading-none">Anotações</h1>
              <p className="text-[10px] text-muted-foreground">
                {warningsCount > 0 ? `${warningsCount} advertência(s)` : 'Registros do mês'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-9 px-3"
            onClick={() => { setShowForm(true); setEditingNote(null) }}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs">Nova</span>
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 pb-safe space-y-3">
        {/* Filtro período */}
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="flex-1 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Advertências badge */}
        {warningsCount > 0 && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-xl border',
            warningsCount >= 3 ? 'bg-destructive/10 border-destructive/40' : 'bg-warning/10 border-warning/40'
          )}>
            <AlertTriangle className={cn('h-5 w-5', warningsCount >= 3 ? 'text-destructive' : 'text-warning')} />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {warningsCount} advertência{warningsCount > 1 ? 's' : ''} formal{warningsCount > 1 ? 'is' : ''}
              </p>
              <p className="text-[11px] text-muted-foreground">3 desqualificam o Prêmio de Excelência</p>
            </div>
            <span className={cn('text-2xl font-bold', warningsCount >= 3 ? 'text-destructive' : 'text-warning')}>
              {warningsCount}/3
            </span>
          </div>
        )}

        {/* Formulário inline */}
        {showForm && (
          <Card className="border-primary/40">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{editingNote ? 'Editar' : 'Nova'} Anotação</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Data */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-10 text-sm" disabled={!!editingNote}>
                      <FileText className="mr-2 h-4 w-4" />
                      {format(formData.date, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Tipo */}
                <Select
                  value={formData.note_type}
                  onValueChange={(v) => setFormData({ ...formData, note_type: v as Note['note_type'] })}
                  disabled={!!editingNote}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Conteúdo */}
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Descreva a anotação..."
                  rows={3}
                  required
                  className="text-sm resize-none"
                />

                {/* Advertência formal */}
                <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <Checkbox
                    id="is_warning"
                    checked={formData.is_warning}
                    onCheckedChange={(v) => setFormData({ ...formData, is_warning: v as boolean })}
                    className="mt-0.5"
                  />
                  <Label htmlFor="is_warning" className="text-sm cursor-pointer">
                    <span className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      Advertência Formal
                    </span>
                    <span className="text-[11px] text-muted-foreground font-normal block mt-0.5">
                      3 advertências desqualificam o prêmio de R$ 300
                    </span>
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 h-10">
                    {editingNote ? 'Atualizar' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} className="h-10">
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de notas */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhuma anotação neste mês</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => {
              const typeInfo = getNoteTypeInfo(note.note_type)
              const { Icon } = typeInfo
              return (
                <Card key={note.id} className={cn(note.is_warning && 'border-warning/50 bg-warning/5')}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', typeInfo.color)} />
                        <span className="text-sm font-semibold">{typeInfo.label}</span>
                        {note.is_warning && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                            Advertência
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(note)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNote(note.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1">
                      {format(new Date(note.date + 'T00:00:00'), "dd/MM/yyyy")}
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">{note.content}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
