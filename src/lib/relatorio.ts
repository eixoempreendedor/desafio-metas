import { supabaseAdmin } from './supabase';
import { isoWeek, formatDateBR } from './week';

type LinhaRanking = {
  consultor: string;
  cidade: string;
  numero: number;
  meta: number;
  matriculados: number;
  pct: number;
};

/**
 * Gera o relatório semanal formatado pra WhatsApp.
 * Usa o último update de cada turma (não exige update na semana corrente).
 */
export async function gerarRelatorioSemanal(
  semana: string = isoWeek(),
): Promise<{ mensagem: string; totalMatriculados: number; totalMeta: number }> {
  const sb = supabaseAdmin();

  // Turmas em andamento + último update + consultor
  const { data: turmas, error } = await sb
    .from('turmas')
    .select(
      `
      id, cidade, numero, meta, data_inicio, status,
      consultores (nome),
      updates_semanais (matriculados, ano_semana, criado_em)
    `,
    )
    .eq('status', 'em_andamento')
    .order('data_inicio', { ascending: true });

  if (error) throw error;

  const linhas: LinhaRanking[] = (turmas ?? []).map((t) => {
    const updates = (t.updates_semanais ?? []) as Array<{
      matriculados: number;
      ano_semana: string;
      criado_em: string;
    }>;
    const ultimo = updates.sort((a, b) =>
      b.criado_em.localeCompare(a.criado_em),
    )[0];
    const matriculados = ultimo?.matriculados ?? 0;
    const consultor =
      (t.consultores as { nome: string } | { nome: string }[] | null);
    const nome = Array.isArray(consultor)
      ? consultor[0]?.nome ?? '?'
      : consultor?.nome ?? '?';
    return {
      consultor: nome,
      cidade: t.cidade,
      numero: t.numero,
      meta: t.meta,
      matriculados,
      pct: t.meta > 0 ? (matriculados / t.meta) * 100 : 0,
    };
  });

  linhas.sort((a, b) => b.pct - a.pct);

  const totalMatriculados = linhas.reduce((s, l) => s + l.matriculados, 0);
  const totalMeta = linhas.reduce((s, l) => s + l.meta, 0);
  const pctTotal = totalMeta > 0 ? (totalMatriculados / totalMeta) * 100 : 0;

  // Turmas iniciando essa semana
  const hoje = new Date();
  const dom = new Date(hoje);
  dom.setDate(hoje.getDate() + (7 - hoje.getDay()));
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - hoje.getDay() + 1);
  const segIso = seg.toISOString().slice(0, 10);
  const domIso = dom.toISOString().slice(0, 10);

  const { data: iniciando } = await sb
    .from('turmas')
    .select('cidade, numero, data_inicio, consultores (nome)')
    .gte('data_inicio', segIso)
    .lte('data_inicio', domIso)
    .order('data_inicio');

  const ranking = linhas
    .map((l, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const flag = l.pct >= 80 ? '✅' : l.pct >= 50 ? '⚠️' : '🔴';
      return `${medal} ${l.consultor} — ${l.cidade} T${l.numero} — ${l.matriculados}/${l.meta} (${l.pct.toFixed(0)}%) ${flag}`;
    })
    .join('\n');

  const iniciandoLinhas =
    (iniciando ?? [])
      .map((t) => {
        const c = t.consultores as { nome: string } | { nome: string }[] | null;
        const nome = Array.isArray(c) ? c[0]?.nome : c?.nome;
        return `• ${t.cidade} T${t.numero} (${nome}) — ${formatDateBR(t.data_inicio)}`;
      })
      .join('\n') || '_(nenhuma)_';

  const mensagem = [
    `📊 *DESAFIO EMPREENDEDOR — ${semana}*`,
    '',
    '*🏆 Ranking (% meta)*',
    ranking || '_(sem turmas em andamento)_',
    '',
    `📈 *Total:* ${totalMatriculados}/${totalMeta} alunos (${pctTotal.toFixed(0)}%)`,
    '',
    '*🆕 Iniciando essa semana:*',
    iniciandoLinhas,
  ].join('\n');

  return { mensagem, totalMatriculados, totalMeta };
}
