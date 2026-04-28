import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { formatDateBR, isoWeek, formatSemanaBR } from '@/lib/week';
import {
  criarTurma,
  atualizarMatriculados,
  alterarStatusTurma,
  atualizarMetaAnual,
} from './actions';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

type TurmaDB = {
  id: string;
  cidade: string;
  numero: number;
  meta: number;
  data_inicio: string;
  status: 'agendada' | 'em_andamento' | 'iniciada' | 'concluida' | 'cancelada';
  updates_semanais: {
    matriculados: number;
    ano_semana: string;
    criado_em: string;
  }[];
};

export default async function ConsultorPage({ params }: Props) {
  const { token } = await params;
  const sb = supabaseAdmin();

  const { data: consultor } = await sb
    .from('consultores')
    .select('id, nome, ativo, meta_anual')
    .eq('token', token)
    .single();

  if (!consultor || !consultor.ativo) notFound();

  const { data: turmas } = await sb
    .from('turmas')
    .select(
      `id, cidade, numero, meta, data_inicio, status,
       updates_semanais (matriculados, ano_semana, criado_em)`,
    )
    .eq('consultor_id', consultor.id)
    .order('data_inicio', { ascending: false })
    .returns<TurmaDB[]>();

  const semanaAtual = isoWeek();
  const lista = (turmas ?? []).map((t) => {
    const ultimo = [...t.updates_semanais].sort((a, b) =>
      b.criado_em.localeCompare(a.criado_em),
    )[0];
    const naSemana = t.updates_semanais.find(
      (u) => u.ano_semana === semanaAtual,
    );
    return { ...t, ultimo, naSemana };
  });

  async function criar(formData: FormData) {
    'use server';
    await criarTurma(token, formData);
  }
  async function atualizar(formData: FormData) {
    'use server';
    await atualizarMatriculados(token, formData);
  }
  async function salvarMetaAnual(formData: FormData) {
    'use server';
    await atualizarMetaAnual(token, formData);
  }

  // Empresas do consultor neste ano (soma do último update de cada turma de 2026)
  const ano = new Date().getUTCFullYear();
  const turmasNoAno = (turmas ?? []).filter(
    (t) => t.data_inicio.startsWith(String(ano)) && t.status !== 'cancelada',
  );
  const empresasNoAno = turmasNoAno.reduce((s, t) => {
    const ultimo = [...t.updates_semanais].sort((a, b) =>
      b.criado_em.localeCompare(a.criado_em),
    )[0];
    return s + (ultimo?.matriculados ?? 0);
  }, 0);
  const metaAnual = consultor.meta_anual;
  const pctAnual =
    metaAnual && metaAnual > 0 ? (empresasNoAno / metaAnual) * 100 : null;

  // ─── Agrupa turmas por status ──────────────────────────────────
  const emFormacao = lista.filter((t) => t.status === 'em_andamento');
  const aIniciar = lista
    .filter((t) => t.status === 'agendada')
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  const iniciadas = lista.filter((t) => t.status === 'iniciada');
  const historico = lista.filter(
    (t) => t.status === 'concluida' || t.status === 'cancelada',
  );

  function renderTurma(t: (typeof lista)[number]) {
    const matriculados = t.ultimo?.matriculados ?? 0;
    const pct = t.meta > 0 ? (matriculados / t.meta) * 100 : 0;
    const cor =
      pct >= 80
        ? 'text-green-600'
        : pct >= 50
          ? 'text-amber-600'
          : 'text-red-600';
    const statusBadge =
      t.status === 'em_andamento'
        ? '🎯 em formação comercial'
        : t.status === 'agendada'
          ? '🗓️ agendada — ainda não em formação comercial'
          : t.status === 'iniciada'
            ? '🚀 iniciada (travada)'
            : t.status === 'concluida'
              ? '✅ concluída'
              : '❌ cancelada';
    return (
      <li
        key={t.id}
        className="bg-white border border-zinc-200 rounded-lg p-4"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold">
              {t.cidade} — Turma {t.numero}
            </h3>
            <p className="text-xs text-zinc-500">
              Início {formatDateBR(t.data_inicio)}
            </p>
            <span className="text-xs text-zinc-500">{statusBadge}</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-semibold">
              {matriculados}/{t.meta}
            </div>
            <div className={`text-sm font-semibold ${cor}`}>
              {pct.toFixed(0)}%
            </div>
          </div>
        </div>

        {t.status === 'agendada' && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-zinc-100 items-center">
            <FormStatus
              token={token}
              turmaId={t.id}
              to="em_andamento"
              label="▶️ Iniciar Formação Comercial"
              variant="primary"
            />
            <FormStatus
              token={token}
              turmaId={t.id}
              to="cancelada"
              label="Cancelar"
              variant="link"
            />
          </div>
        )}
        {t.status === 'em_andamento' && (
          <>
            <form
              action={atualizar}
              className="flex flex-wrap gap-2 items-end pt-3 border-t border-zinc-100"
            >
              <input type="hidden" name="turma_id" value={t.id} />
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-zinc-500 mb-1">
                  Contratos Totais
                </label>
                <input
                  name="matriculados"
                  type="number"
                  min={0}
                  defaultValue={t.naSemana?.matriculados ?? matriculados}
                  required
                  className="w-full border border-zinc-300 rounded px-2 py-2"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-zinc-500 mb-1">
                  Observação (opcional)
                </label>
                <input
                  name="observacao"
                  type="text"
                  defaultValue={''}
                  className="w-full border border-zinc-300 rounded px-2 py-2"
                />
              </div>
              <button
                type="submit"
                className="bg-zinc-900 text-white rounded-lg px-4 py-2 font-semibold hover:bg-zinc-700 transition"
              >
                Salvar
              </button>
            </form>
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-zinc-100 items-center">
              <FormStatus
                token={token}
                turmaId={t.id}
                to="iniciada"
                label="🚀 Turma Iniciada"
                variant="primary"
              />
              <FormStatus
                token={token}
                turmaId={t.id}
                to="agendada"
                label="Voltar pra agendada"
                variant="link"
              />
              <FormStatus
                token={token}
                turmaId={t.id}
                to="cancelada"
                label="Cancelar"
                variant="link"
              />
            </div>
          </>
        )}
        {t.status === 'iniciada' && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-zinc-100 items-center text-xs">
            <span className="text-zinc-500">
              Contratos: <strong>{matriculados}</strong> · meta {t.meta}
            </span>
            <FormStatus
              token={token}
              turmaId={t.id}
              to="concluida"
              label="Marcar concluída"
              variant="link"
            />
            <FormStatus
              token={token}
              turmaId={t.id}
              to="em_andamento"
              label="Reabrir (editar)"
              variant="link"
            />
          </div>
        )}
        {(t.status === 'concluida' || t.status === 'cancelada') && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <FormStatus
              token={token}
              turmaId={t.id}
              to="em_andamento"
              label="Reativar turma"
              variant="link"
            />
          </div>
        )}
      </li>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <header className="mb-6">
        <p className="text-sm text-zinc-500">Grupo Desafio</p>
        <h1 className="text-2xl font-bold">Olá, {consultor.nome} 👋</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Semana <span className="font-mono">{formatSemanaBR(semanaAtual)}</span>
        </p>
      </header>

      {/* ─── Meta anual ─── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">🎯 Meta anual ({ano})</h2>
        <form
          action={salvarMetaAnual}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-zinc-500 mb-1">
              Meta de empresas no ano
            </label>
            <input
              name="meta_anual"
              type="number"
              min={0}
              defaultValue={metaAnual ?? ''}
              placeholder="Ex: 100"
              className="w-full border border-zinc-300 rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-zinc-900 text-white rounded-lg px-4 py-2 font-semibold hover:bg-zinc-700 transition"
          >
            Salvar meta
          </button>
          <div className="w-full sm:w-auto sm:ml-auto text-right">
            <div className="text-xs text-zinc-500">No ano</div>
            <div className="font-mono text-lg font-semibold">
              {empresasNoAno}
              {metaAnual ? `/${metaAnual}` : ''} empresas
            </div>
            {pctAnual !== null && (
              <div
                className={`text-sm font-semibold ${
                  pctAnual >= 80
                    ? 'text-green-600'
                    : pctAnual >= 50
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
                {pctAnual.toFixed(0)}%
              </div>
            )}
          </div>
        </form>
      </section>

      {/* ─── 1. EM FORMAÇÃO COMERCIAL (destaque no topo) ─── */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Turmas em Formação Comercial
        </h2>
        <p className="text-xs text-zinc-500 mb-3">
          Captando contratos agora — entram no ranking semanal
        </p>
        {emFormacao.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
            Nenhuma turma em formação comercial. Use o botão{' '}
            <strong>▶️ Iniciar Formação Comercial</strong> nas turmas agendadas
            quando começar a captar.
          </p>
        ) : (
          <div className="border-l-4 border-emerald-500 pl-3">
            <ul className="space-y-3">{emFormacao.map(renderTurma)}</ul>
          </div>
        )}
      </section>

      {/* ─── 2. A SEREM INICIADAS (agendadas) ─── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-1">
          🗓️ Turmas a serem iniciadas
        </h2>
        <p className="text-xs text-zinc-500 mb-3">
          Cadastradas, ainda não estão captando contratos
        </p>
        {aIniciar.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-white border border-zinc-200 rounded-lg p-6 text-center">
            Nenhuma turma agendada.
          </p>
        ) : (
          <ul className="space-y-3">{aIniciar.map(renderTurma)}</ul>
        )}
      </section>

      {/* ─── 3. INICIADAS (travadas) ─── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-1">🚀 Turmas Iniciadas</h2>
        <p className="text-xs text-zinc-500 mb-3">
          Turma já começou — contratos travados
        </p>
        {iniciadas.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-white border border-zinc-200 rounded-lg p-6 text-center">
            Nenhuma turma iniciada ainda.
          </p>
        ) : (
          <ul className="space-y-3">{iniciadas.map(renderTurma)}</ul>
        )}
      </section>

      {/* ─── 4. HISTÓRICO (concluídas/canceladas) ─── */}
      {historico.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 mb-3 uppercase tracking-wide">
            Histórico
          </h2>
          <ul className="space-y-3 opacity-70">{historico.map(renderTurma)}</ul>
        </section>
      )}

      {/* ─── 5. NOVA TURMA (final) ─── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">➕ Cadastrar nova turma</h2>
        <p className="text-xs text-zinc-500 mb-3">
          Vai nascer como{' '}
          <strong>🗓️ agendada</strong> — clica em "Iniciar Formação Comercial"
          quando começar a captar contratos.
        </p>
        <form action={criar} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Cidade" name="cidade" required className="col-span-2" />
          <Field label="Nº turma" name="numero" type="number" min={1} required />
          <Field label="Meta (empresas)" name="meta" type="number" min={1} required />
          <Field
            label="Data início"
            name="data_inicio"
            type="date"
            required
            className="col-span-2"
          />
          <button
            type="submit"
            className="col-span-2 sm:col-span-4 bg-zinc-900 text-white rounded-lg py-3 font-semibold hover:bg-zinc-700 transition"
          >
            Cadastrar turma
          </button>
        </form>
      </section>

      <footer className="mt-10 text-xs text-zinc-400 text-center">
        Salve esse link nos favoritos do WhatsApp · Token{' '}
        <span className="font-mono">{token}</span>
      </footer>
    </main>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  min,
  className = '',
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-zinc-500 mb-1">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        className="w-full border border-zinc-300 rounded px-3 py-2"
      />
    </label>
  );
}

function FormStatus({
  token,
  turmaId,
  to,
  label,
  variant = 'link',
}: {
  token: string;
  turmaId: string;
  to: 'agendada' | 'em_andamento' | 'iniciada' | 'concluida' | 'cancelada';
  label: string;
  variant?: 'primary' | 'link';
}) {
  async function action() {
    'use server';
    await alterarStatusTurma(token, turmaId, to);
  }
  const className =
    variant === 'primary'
      ? 'bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition'
      : 'text-zinc-500 hover:text-zinc-900 underline underline-offset-2 text-xs';
  return (
    <form action={action}>
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
