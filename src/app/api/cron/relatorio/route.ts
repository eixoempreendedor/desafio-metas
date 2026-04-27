import { NextRequest, NextResponse } from 'next/server';
import { gerarRelatorioSemanal } from '@/lib/relatorio';
import { sendZapiText } from '@/lib/zapi';
import { supabaseAdmin } from '@/lib/supabase';
import { isoWeek } from '@/lib/week';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/relatorio
 *
 * Gera e envia o relatório semanal via Z-API. Protegido por CRON_SECRET
 * (Vercel Cron envia automaticamente o header Authorization).
 *
 * Aceita query string:
 *   ?dry=1     → não envia (só retorna a mensagem)
 *   ?destino=  → sobrescreve ZAPI_DESTINATION (ex: ?destino=5561...)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ erro: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryParam = searchParams.get('dry') === '1';
  const destinoOverride = searchParams.get('destino');

  const semana = isoWeek();
  const { mensagem } = await gerarRelatorioSemanal(semana);

  const destino = destinoOverride || process.env.ZAPI_DESTINATION;
  if (!destino) {
    return NextResponse.json(
      { erro: 'ZAPI_DESTINATION não configurado' },
      { status: 500 },
    );
  }

  if (dryParam) {
    return NextResponse.json({ semana, destino, mensagem, dry: true });
  }

  let resultado;
  let sucesso = false;
  let erro: string | null = null;
  try {
    resultado = await sendZapiText(destino, mensagem);
    sucesso = resultado.ok;
    if (!resultado.ok) erro = `status ${resultado.status}`;
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  // Log no banco
  try {
    await supabaseAdmin().from('relatorios_enviados').insert({
      ano_semana: semana,
      destino,
      mensagem,
      sucesso,
      erro,
    });
  } catch (e) {
    console.error('[cron] falha ao logar relatorio_enviado:', e);
  }

  return NextResponse.json({ semana, destino, sucesso, erro, resultado });
}
