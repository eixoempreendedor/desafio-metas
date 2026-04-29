import { NextRequest, NextResponse } from 'next/server';
import { gerarRelatorioSemanal } from '@/lib/relatorio';
import { sendZapiText } from '@/lib/zapi';
import { supabaseAdmin } from '@/lib/supabase';
import { isoWeek } from '@/lib/week';
import { mensagemInspiracaoDoDia } from '@/lib/inspiracao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Destino padrão do disparo diário: grupo "Equipe DE CERRADO" no WhatsApp.
 * Hardcoded pra ser autônomo — Vercel Cron dispara todo dia às 6h BRT
 * sem depender de env var nem de máquina local.
 */
const GRUPO_EQUIPE_DE_CERRADO = '120363424664353784-group';

/**
 * GET /api/cron/relatorio
 *
 * Gera e envia o relatório diário via Z-API. Protegido por CRON_SECRET
 * (Vercel Cron envia automaticamente o header Authorization).
 *
 * Aceita query string:
 *   ?dry=1     → não envia (só retorna a mensagem)
 *   ?destino=  → sobrescreve o destino padrão (ex: ?destino=5561...)
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

  const destino = destinoOverride || GRUPO_EQUIPE_DE_CERRADO;

  const inspiracao = mensagemInspiracaoDoDia();

  if (dryParam) {
    return NextResponse.json({
      semana,
      destino,
      mensagem,
      inspiracao,
      dry: true,
    });
  }

  // 1) Envia o status
  let resStatus;
  let sucessoStatus = false;
  let erroStatus: string | null = null;
  try {
    resStatus = await sendZapiText(destino, mensagem);
    sucessoStatus = resStatus.ok;
    if (!resStatus.ok) erroStatus = `status ${resStatus.status}`;
  } catch (e) {
    erroStatus = e instanceof Error ? e.message : String(e);
  }

  // 2) Pequena pausa pra Z-API entregar em ordem (typing simulado)
  await new Promise((r) => setTimeout(r, 1500));

  // 3) Envia a inspiração do dia
  let resInspiracao;
  let sucessoInspiracao = false;
  let erroInspiracao: string | null = null;
  try {
    resInspiracao = await sendZapiText(destino, inspiracao);
    sucessoInspiracao = resInspiracao.ok;
    if (!resInspiracao.ok)
      erroInspiracao = `status ${resInspiracao.status}`;
  } catch (e) {
    erroInspiracao = e instanceof Error ? e.message : String(e);
  }

  // Log no banco (status)
  try {
    await supabaseAdmin().from('relatorios_enviados').insert({
      ano_semana: semana,
      destino,
      mensagem,
      sucesso: sucessoStatus,
      erro: erroStatus,
    });
  } catch (e) {
    console.error('[cron] falha ao logar relatorio_enviado:', e);
  }

  return NextResponse.json({
    semana,
    destino,
    status: { sucesso: sucessoStatus, erro: erroStatus, resultado: resStatus },
    inspiracao: {
      sucesso: sucessoInspiracao,
      erro: erroInspiracao,
      resultado: resInspiracao,
    },
  });
}
