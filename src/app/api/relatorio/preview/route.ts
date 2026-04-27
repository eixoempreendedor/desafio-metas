import { NextResponse } from 'next/server';
import { gerarRelatorioSemanal } from '@/lib/relatorio';
import { isoWeek } from '@/lib/week';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/relatorio/preview
 *
 * Retorna a mensagem do relatório semanal sem enviar.
 * Útil pra ver como vai ficar antes do disparo do cron.
 */
export async function GET() {
  const semana = isoWeek();
  const { mensagem, totalMatriculados, totalMeta } =
    await gerarRelatorioSemanal(semana);
  return NextResponse.json({
    semana,
    totalMatriculados,
    totalMeta,
    mensagem,
  });
}
