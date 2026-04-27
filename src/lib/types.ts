export type Consultor = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  token: string;
  ativo: boolean;
  criado_em: string;
};

export type Turma = {
  id: string;
  consultor_id: string;
  cidade: string;
  numero: number;
  meta: number;
  data_inicio: string; // ISO date
  status: 'em_andamento' | 'concluida' | 'cancelada';
  criado_em: string;
};

export type UpdateSemanal = {
  id: string;
  turma_id: string;
  ano_semana: string;
  matriculados: number;
  observacao: string | null;
  criado_em: string;
};

export type TurmaComUpdate = Turma & {
  matriculados: number;
  pct: number;
  consultor_nome: string;
};
