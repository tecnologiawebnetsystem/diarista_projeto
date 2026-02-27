import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json({ error: 'PIN não fornecido' }, { status: 400 })
    }

    // Get admin PIN from config
    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'admin_pin')
      .single<{ value: number }>()

    if (error || !data) {
      return NextResponse.json({ error: 'Erro ao verificar PIN' }, { status: 500 })
    }

    const correctPin = data.value?.toString() || '123456'
    const providedPin = pin.toString()

    if (providedPin === correctPin) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'PIN incorreto' }, { status: 401 })
  } catch (error) {
    console.error('PIN verification error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
