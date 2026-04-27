import { supabaseAdmin } from '@/lib/supabase';
import { formatDateBR, pctAnoCorrido } from '@/lib/week';

export const dynamic = 'force-dynamic';

type ConsultorRow = { id: string; nome: string; meta_anual: number | null };

type TurmaRow = {
  id: string;
  cidade: string;
  numero: number;
  meta: number;
  data_inicio: string;
  status: 'em_andamento' | 'iniciada' | 'concluida' | 'cancelada';
  consultor_id: string;
  consultores: { nome: string } | { nome: string }[] | null;
  updates_semanais: { matriculados: number; criado_em: string }[];
};

function nomeConsultor(c: TurmaRow['consultores']): string {
  if (!c) return '?';
  return Array.isArray(c) ? c[0]?.nome ?? '?' : c.nome;
}

function corPct(pct: number) {
  return pct >= 80
    ? 'text-green-600'
    : pct >= 50
      ? 'text-amber-600'
      : 'text-red-600';
}

export default async function Home() {
  const sb = supabaseAdmin();
  const ano = new Date().getUTCFullYear();
  const hoje = new Date();
  const limite = new Date();
  limite.setUTCDate(hoje.getUTCDate() + 60);
  const hojeIso = hoje.toISOString().slice(0, 10);
  const limiteIso = limite.toISOString().slice(0, 10);

  const [{ data: consultoresData, error: errC }, { data: turmasData, error: errT }] =
    await Promise.all([
      sb
        .from('consultores')
        .select('id, nome, meta_anual')
        .eq('ativo', true)
        .returns<ConsultorRow[]>(),
      sb
        .from('turmas')
        .select(
          `id, cidade, numero, meta, data_inicio, status, consultor_id,
           consultores (nome),
           updates_semanais (matriculados, criado_em)`,
        )
        .order('data_inicio', { ascending: true })
        .returns<TurmaRow[]>(),
    ]);

  if (errC || errT) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Desafio Empreendedor</h1>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-semibold">Erro ao carregar dados</p>
          <p className="text-sm mt-1">{errC?.message || errT?.message}</p>
          <p className="text-sm mt-2">
            Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> e rode{' '}
            <code>supabase/schema.sql</code>.
          </p>
        </div>
      </main>
    );
  }

  // ─── Por turma (em andamento) ──────────────────────────────────
  const linhasTurma = (turmasData ?? []).map((t) => {
    const ultimo = [...t.updates_semanais].sort((a, b) =>
      b.criado_em.localeCompare(a.criado_em),
    )[0];
    const matriculados = ultimo?.matriculados ?? 0;
    return {
      id: t.id,
      consultor_id: t.consultor_id,
      consultor: nomeConsultor(t.consultores),
      cidade: t.cidade,
      numero: t.numero,
      meta: t.meta,
      data_inicio: t.data_inicio,
      status: t.status,
      matriculados,
      pct: t.meta > 0 ? (matriculados / t.meta) * 100 : 0,
    };
  });

  const ativas = linhasTurma
    .filter((l) => l.status === 'em_andamento')
    .sort((a, b) => b.pct - a.pct);

  // ─── Por consultor (anual) ─────────────────────────────────────
  const linhasAno = (consultoresData ?? [])
    .map((c) => {
      const empresasNoAno = linhasTurma
        .filter(
          (l) =>
            l.consultor_id === c.id &&
            l.data_inicio.startsWith(String(ano)) &&
            l.status !== 'cancelada',
        )
        .reduce((s, l) => s + l.matriculados, 0);
      const meta = c.meta_anual;
      const pct = meta && meta > 0 ? (empresasNoAno / meta) * 100 : null;
      return {
        nome: c.nome,
        meta_anual: meta,
        empresas: empresasNoAno,
        pct,
      };
    })
    .filter((l) => l.meta_anual !== null || l.empresas > 0)
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));

  // ─── Próximas turmas (60 dias) ─────────────────────────────────
  const proximas = (turmasData ?? [])
    .filter(
      (t) =>
        t.data_inicio >= hojeIso &&
        t.data_inicio <= limiteIso &&
        t.status === 'em_andamento',
    )
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          📊 Desafio Empreendedor
        </h1>
        <p className="text-zinc-600 text-sm mt-1">
          Painel de monitoramento das turmas · {pctAnoCorrido().toFixed(0)}% do
          ano {ano} corrido
        </p>
      </header>

      {/* ─── Turmas em Formação Comercial ─── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">
          🎯 Turmas em Formação Comercial
        </h2>
        {ativas.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-white border border-zinc-200 rounded-lg p-6 text-center">
            Nenhuma turma em andamento.
          </p>
        ) : (
          <ul className="space-y-2">
            {ativas.map((l, i) => (
              <li
                key={l.id}
                className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-zinc-500 w-6">
                      {i + 1}.
                    </span>
                    <span className="font-semibold truncate">
                      {l.consultor}
                    </span>
                    <span className="text-zinc-500 text-sm">
                      · {l.cidade} T{l.numero}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Início {formatDateBR(l.data_inicio)}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono text-base font-semibold">
                    {l.matriculados}/{l.meta}
                  </div>
                  <div className={`text-xs font-semibold ${corPct(l.pct)}`}>
                    {l.pct.toFixed(0)}%
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Meta Anual por Consultor ─── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-1">
          🎯 Meta Anual por Consultor ({ano})
        </h2>
        <p className="text-xs text-zinc-500 mb-3 italic">
          {pctAnoCorrido().toFixed(0)}% do ano corrido — para referência
        </p>
        {linhasAno.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-white border border-zinc-200 rounded-lg p-6 text-center">
            Nenhum consultor definiu meta anual ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {linhasAno.map((l, i) => (
              <li
                key={l.nome}
                className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-zinc-500 w-6">
                    {i + 1}.
                  </span>
                  <span className="font-semibold">{l.nome}</span>
                  {!l.meta_anual && (
                    <span className="text-xs text-zinc-400">
                      (meta não definida)
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono text-base font-semibold">
                    {l.empresas}
                    {l.meta_anual ? `/${l.meta_anual}` : ''} empresas
                  </div>
                  {l.pct !== null && (
                    <div
                      className={`text-xs font-semibold ${corPct(l.pct)}`}
                    >
                      {l.pct.toFixed(0)}%
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Próximas turmas ─── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          📅 Próximas Turmas (60 dias)
        </h2>
        {proximas.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-white border border-zinc-200 rounded-lg p-6 text-center">
            Nenhuma turma programada nos próximos 60 dias.
          </p>
        ) : (
          <ul className="space-y-2">
            {proximas.map((t) => (
              <li
                key={t.id}
                className="bg-white border border-zinc-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold">
                    {t.cidade} T{t.numero}
                  </span>
                  <span className="text-zinc-500 text-sm ml-2">
                    · {nomeConsultor(t.consultores)}
                  </span>
                </div>
                <div className="text-sm font-mono text-zinc-700">
                  {formatDateBR(t.data_inicio)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

