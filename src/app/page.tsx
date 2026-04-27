import { supabaseAdmin } from '@/lib/supabase';
import { formatDateBR } from '@/lib/week';

export const dynamic = 'force-dynamic';

type TurmaRow = {
  id: string;
  cidade: string;
  numero: number;
  meta: number;
  data_inicio: string;
  status: string;
  consultores: { nome: string } | { nome: string }[] | null;
  updates_semanais: { matriculados: number; criado_em: string }[];
};

function nomeConsultor(c: TurmaRow['consultores']): string {
  if (!c) return '?';
  return Array.isArray(c) ? c[0]?.nome ?? '?' : c.nome;
}

export default async function Home() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('turmas')
    .select(
      `id, cidade, numero, meta, data_inicio, status,
       consultores (nome),
       updates_semanais (matriculados, criado_em)`,
    )
    .order('data_inicio', { ascending: true })
    .returns<TurmaRow[]>();

  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Desafio Empreendedor</h1>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-semibold">Erro ao carregar dados</p>
          <p className="text-sm mt-1">{error.message}</p>
          <p className="text-sm mt-2">
            Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> em <code>.env.local</code> e
            execute <code>supabase/schema.sql</code>.
          </p>
        </div>
      </main>
    );
  }

  const linhas = (data ?? []).map((t) => {
    const ultimo = [...t.updates_semanais].sort((a, b) =>
      b.criado_em.localeCompare(a.criado_em),
    )[0];
    const matriculados = ultimo?.matriculados ?? 0;
    return {
      id: t.id,
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

  const ativas = linhas.filter((l) => l.status === 'em_andamento');
  ativas.sort((a, b) => b.pct - a.pct);
  const totalMatriculados = ativas.reduce((s, l) => s + l.matriculados, 0);
  const totalMeta = ativas.reduce((s, l) => s + l.meta, 0);
  const pctTotal = totalMeta > 0 ? (totalMatriculados / totalMeta) * 100 : 0;

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          📊 Desafio Empreendedor
        </h1>
        <p className="text-zinc-600 text-sm mt-1">
          Acompanhamento de metas das turmas
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3 mb-6">
        <Card label="Turmas ativas" value={String(ativas.length)} />
        <Card
          label="Alunos / Meta"
          value={`${totalMatriculados}/${totalMeta}`}
        />
        <Card
          label="% Atingido"
          value={`${pctTotal.toFixed(0)}%`}
          highlight={pctTotal >= 80 ? 'green' : pctTotal >= 50 ? 'amber' : 'red'}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">🏆 Ranking</h2>
        {ativas.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-white border border-zinc-200 rounded-lg p-6 text-center">
            Nenhuma turma em andamento. Consultores: usem o link individual para
            cadastrar a primeira turma.
          </p>
        ) : (
          <ul className="space-y-2">
            {ativas.map((l, i) => (
              <li
                key={l.id}
                className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
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
                  <div
                    className={`text-xs font-semibold ${
                      l.pct >= 80
                        ? 'text-green-600'
                        : l.pct >= 50
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}
                  >
                    {l.pct.toFixed(0)}%
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Card({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'green' | 'amber' | 'red';
}) {
  const color =
    highlight === 'green'
      ? 'text-green-600'
      : highlight === 'amber'
        ? 'text-amber-600'
        : highlight === 'red'
          ? 'text-red-600'
          : 'text-zinc-900';
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
