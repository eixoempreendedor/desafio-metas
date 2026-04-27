import { supabaseAdmin } from './supabase';
import { isoWeek, formatDateBR } from './week';

type LinhaTurma = {
  consultor: string;
  consultor_id: string;
  cidade: string;
  numero: number;
  meta: number;
  matriculados: number;
  pct: number;
  data_inicio: string;
  status: string;
};

type LinhaAnual = {
  nome: string;
  meta_anual: number | null;
  empresas: number;
  pct: number | null;
};

function flag(pct: number): string {
  return pct >= 80 ? '✅' : pct >= 50 ? '⚠️' : '🔴';
}

function medal(i: number): string {
  return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
}

/**
 * Gera o relatório semanal formatado pra WhatsApp.
 * 4 seções: header, monitoramento de turmas, meta anual por consultor,
 * próximas turmas (60 dias).
 */
export async function gerarRelatorioSemanal(
  semana: string = isoWeek(),
): Promise<{ mensagem: string; totalMatriculados: number; totalMeta: number }> {
  const sb = supabaseAdmin();
  const ano = new Date().getUTCFullYear();
  const hoje = new Date();
  const limite = new Date();
  limite.setUTCDate(hoje.getUTCDate() + 60);
  const hojeIso = hoje.toISOString().slice(0, 10);
  const limiteIso = limite.toISOString().slice(0, 10);

  const [{ data: consultoresData }, { data: turmasData }] = await Promise.all([
    sb
      .from('consultores')
      .select('id, nome, meta_anual')
      .eq('ativo', true),
    sb
      .from('turmas')
      .select(
        `id, cidade, numero, meta, data_inicio, status, consultor_id,
         consultores (nome),
         updates_semanais (matriculados, criado_em)`,
      )
      .order('data_inicio', { ascending: true }),
  ]);

  type TurmaRow = {
    id: string;
    cidade: string;
    numero: number;
    meta: number;
    data_inicio: string;
    status: string;
    consultor_id: string;
    consultores: { nome: string } | { nome: string }[] | null;
    updates_semanais: { matriculados: number; criado_em: string }[];
  };
  const turmas = (turmasData ?? []) as TurmaRow[];

  const linhas: LinhaTurma[] = turmas.map((t) => {
    const ultimo = [...t.updates_semanais].sort((a, b) =>
      b.criado_em.localeCompare(a.criado_em),
    )[0];
    const c = t.consultores;
    const nome = Array.isArray(c) ? c[0]?.nome ?? '?' : c?.nome ?? '?';
    const matriculados = ultimo?.matriculados ?? 0;
    return {
      consultor: nome,
      consultor_id: t.consultor_id,
      cidade: t.cidade,
      numero: t.numero,
      meta: t.meta,
      matriculados,
      pct: t.meta > 0 ? (matriculados / t.meta) * 100 : 0,
      data_inicio: t.data_inicio,
      status: t.status,
    };
  });

  // ─── Turmas em andamento (ranking por %) ────────────────────────
  const ativas = linhas
    .filter((l) => l.status === 'em_andamento')
    .sort((a, b) => b.pct - a.pct);
  const totalMatriculados = ativas.reduce((s, l) => s + l.matriculados, 0);
  const totalMeta = ativas.reduce((s, l) => s + l.meta, 0);
  const pctTotal = totalMeta > 0 ? (totalMatriculados / totalMeta) * 100 : 0;

  // ─── Meta anual por consultor ───────────────────────────────────
  type ConsultorRow = { id: string; nome: string; meta_anual: number | null };
  const linhasAnuais: LinhaAnual[] = (
    (consultoresData ?? []) as ConsultorRow[]
  )
    .map((c) => {
      const empresas = linhas
        .filter(
          (l) =>
            l.consultor_id === c.id &&
            l.data_inicio.startsWith(String(ano)) &&
            l.status !== 'cancelada',
        )
        .reduce((s, l) => s + l.matriculados, 0);
      const pct =
        c.meta_anual && c.meta_anual > 0
          ? (empresas / c.meta_anual) * 100
          : null;
      return { nome: c.nome, meta_anual: c.meta_anual, empresas, pct };
    })
    .filter((l) => l.meta_anual !== null || l.empresas > 0)
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));

  // ─── Próximas turmas (60 dias) ──────────────────────────────────
  const proximas = linhas
    .filter(
      (l) =>
        l.data_inicio >= hojeIso &&
        l.data_inicio <= limiteIso &&
        l.status === 'em_andamento',
    )
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));

  // ─── Montagem da mensagem ───────────────────────────────────────
  const blocoTurmas =
    ativas.length === 0
      ? '_(sem turmas em andamento)_'
      : ativas
          .map(
            (l, i) =>
              `${medal(i)} ${l.consultor} — ${l.cidade} T${l.numero} — ${l.matriculados}/${l.meta} (${l.pct.toFixed(0)}%) ${flag(l.pct)}`,
          )
          .join('\n');

  const blocoAnual =
    linhasAnuais.length === 0
      ? '_(nenhum consultor definiu meta anual ainda)_'
      : linhasAnuais
          .map((l, i) => {
            const metaTxt = l.meta_anual ? `${l.empresas}/${l.meta_anual}` : `${l.empresas}/—`;
            const pctTxt =
              l.pct !== null ? ` (${l.pct.toFixed(0)}%) ${flag(l.pct)}` : '';
            return `${medal(i)} ${l.nome} — ${metaTxt} empresas${pctTxt}`;
          })
          .join('\n');

  const blocoProximas =
    proximas.length === 0
      ? '_(nenhuma turma nos próximos 60 dias)_'
      : proximas
          .map(
            (l) =>
              `• ${l.cidade} T${l.numero} (${l.consultor}) — ${formatDateBR(l.data_inicio)}`,
          )
          .join('\n');

  const mensagem = [
    `📊 *DESAFIO EMPREENDEDOR — ${semana}*`,
    '',
    '*🎯 Monitoramento de Metas — Turmas*',
    blocoTurmas,
    '',
    `📈 *Total turmas ativas:* ${totalMatriculados}/${totalMeta} empresas (${pctTotal.toFixed(0)}%)`,
    '',
    `*🎯 Meta Anual por Consultor (${ano})*`,
    blocoAnual,
    '',
    '*📅 Próximas Turmas (60 dias)*',
    blocoProximas,
  ].join('\n');

  return { mensagem, totalMatriculados, totalMeta };
}
