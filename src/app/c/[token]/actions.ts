'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { isoWeek } from '@/lib/week';

async function getConsultor(token: string) {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('consultores')
    .select('id, nome, ativo')
    .eq('token', token)
    .single();
  if (!data || !data.ativo) throw new Error('Consultor não encontrado ou inativo');
  return data;
}

export async function criarTurma(token: string, formData: FormData) {
  const consultor = await getConsultor(token);
  const cidade = String(formData.get('cidade') ?? '').trim();
  const numero = parseInt(String(formData.get('numero') ?? ''), 10);
  const meta = parseInt(String(formData.get('meta') ?? ''), 10);
  const data_inicio = String(formData.get('data_inicio') ?? '').trim();

  if (!cidade || !numero || !meta || !data_inicio) {
    return { ok: false, erro: 'Preencha todos os campos.' };
  }
  if (meta < 1) return { ok: false, erro: 'Meta deve ser maior que zero.' };

  const sb = supabaseAdmin();
  const { error } = await sb.from('turmas').insert({
    consultor_id: consultor.id,
    cidade,
    numero,
    meta,
    data_inicio,
  });
  if (error) return { ok: false, erro: error.message };

  revalidatePath(`/c/${token}`);
  revalidatePath('/');
  return { ok: true };
}

export async function atualizarMatriculados(
  token: string,
  formData: FormData,
) {
  const consultor = await getConsultor(token);
  const turma_id = String(formData.get('turma_id') ?? '');
  const matriculados = parseInt(String(formData.get('matriculados') ?? ''), 10);
  const observacao = String(formData.get('observacao') ?? '').trim() || null;

  if (!turma_id || Number.isNaN(matriculados) || matriculados < 0) {
    return { ok: false, erro: 'Valor inválido.' };
  }

  const sb = supabaseAdmin();

  // Garante que a turma pertence ao consultor (defesa básica contra token alheio)
  const { data: turma } = await sb
    .from('turmas')
    .select('id, consultor_id')
    .eq('id', turma_id)
    .single();
  if (!turma || turma.consultor_id !== consultor.id) {
    return { ok: false, erro: 'Turma não encontrada.' };
  }

  const { error } = await sb.from('updates_semanais').upsert(
    {
      turma_id,
      ano_semana: isoWeek(),
      matriculados,
      observacao,
    },
    { onConflict: 'turma_id,ano_semana' },
  );
  if (error) return { ok: false, erro: error.message };

  revalidatePath(`/c/${token}`);
  revalidatePath('/');
  return { ok: true };
}

export async function atualizarMetaAnual(token: string, formData: FormData) {
  const consultor = await getConsultor(token);
  const raw = String(formData.get('meta_anual') ?? '').trim();
  const meta_anual = raw === '' ? null : parseInt(raw, 10);
  if (meta_anual !== null && (Number.isNaN(meta_anual) || meta_anual < 0)) {
    return { ok: false, erro: 'Meta inválida.' };
  }
  const sb = supabaseAdmin();
  const { error } = await sb
    .from('consultores')
    .update({ meta_anual })
    .eq('id', consultor.id);
  if (error) return { ok: false, erro: error.message };
  revalidatePath(`/c/${token}`);
  revalidatePath('/');
  return { ok: true };
}

export async function alterarStatusTurma(
  token: string,
  turmaId: string,
  status: 'em_andamento' | 'iniciada' | 'concluida' | 'cancelada',
) {
  const consultor = await getConsultor(token);
  const sb = supabaseAdmin();
  const { error } = await sb
    .from('turmas')
    .update({ status })
    .eq('id', turmaId)
    .eq('consultor_id', consultor.id);
  if (error) return { ok: false, erro: error.message };
  revalidatePath(`/c/${token}`);
  revalidatePath('/');
  return { ok: true };
}
