export type Category =
  | "Profissional"
  | "Saúde"
  | "Atividade Física"
  | "Pessoal"
  | "Espiritualidade"
  | "Rotina"
  | "Estudos"
  | "Casa"
  | "Casamento"
  | "Outros";

export type Priority = "" | "Baixa" | "Média" | "Alta" | "Urgente";

export type TaskStatus =
  | ""
  | "A fazer"
  | "Em andamento"
  | "Concluída"
  | "Adiada"
  | "Cancelada";

export type PendenciaStatus = "Aberta" | "Agendada" | "Concluída" | "Cancelada";

export interface Task {
  id?: number;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  category: Category;
  priority: Priority;
  status: TaskStatus;
  notes?: string;
  tag?: string;
  color?: string;
  pendenciaId?: number;
  showInCalendar?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export type TimeRestrictionType =
  | "only_morning"
  | "only_afternoon"
  | "only_evening"
  | "not_weekend"
  | "only_weekend";

export interface Pendencia {
  id?: number;
  title: string;
  description?: string;
  deadline?: string;
  estimatedMinutes: number;
  category: Category;
  priority: Priority;
  status: PendenciaStatus;
  notes?: string;
  timeRestrictions?: TimeRestrictionType[];
  taskId?: number;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export type MetaType =
  | "devocional"
  | "agua"
  | "dieta"
  | "exercicio"
  | "skincare"
  | "leitura"
  | "prioridades"
  | "foco"
  | "movimento"
  | "conteudo"
  | "segundo_cerebro"
  | "custom";

export interface Meta {
  id?: number;
  type: MetaType;
  label: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
  target?: number;
  targetUnit?: string;
  createdAt: string;
}

export interface MetaCheck {
  id?: number;
  metaId: number;
  date: string;
  completed: boolean;
  value?: number;
  completedAt?: string;
}

export interface FreeSlot {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface SchedulingSuggestion {
  pendencia: Pendencia;
  suggestedSlot: FreeSlot;
  score: number;
  reason: string;
}

export interface DayBoundary {
  workdayStart: string;
  workdayEnd: string;
  lunchStart: string;
  lunchEnd: string;
}

// ── Insights ──────────────────────────────────────────────────────────────────

export type InsightCategory =
  | "ideia"
  | "aprendizado"
  | "reflexao"
  | "projeto"
  | "conteudo"
  | "outro";

export interface Insight {
  id?: number;
  title: string;
  content: string;
  category: InsightCategory;
  tags: string[];
  linkedTaskId?: number;
  linkedEstudoId?: number;
  linkedProjetoId?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Estudos ───────────────────────────────────────────────────────────────────

export type EstudoStatus = "quero estudar" | "em andamento" | "concluído" | "pausado";
export type EstudoSource = "livro" | "video" | "podcast" | "artigo" | "curso" | "outro";

export interface EstudoItem {
  id?: number;
  title: string;
  description?: string;
  source: EstudoSource;
  url?: string;
  author?: string;
  category: Category;
  priority: Priority;
  status: EstudoStatus;
  tags: string[];
  notes?: string;
  insightId?: number;
  scheduledDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Projetos (Área Profissional) ──────────────────────────────────────────────

export type ProjetoStatus = "ativo" | "pausado" | "concluído" | "cancelado";
export type KanbanStatus = "A fazer" | "Em andamento" | "Concluído";
export type Prazo = "curto" | "medio" | "longo";

export interface Projeto {
  id?: number;
  title: string;
  description?: string;
  status: ProjetoStatus;
  color: string;
  deadline?: string;
  prazo: Prazo;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjetoTask {
  id?: number;
  projetoId: number;
  title: string;
  description?: string;
  status: KanbanStatus;
  priority: Priority;
  dueDate?: string;
  taskId?: number;
  order: number;
  completed: boolean;
  completedAt?: string;
  responsible?: string;
  itemPrazo?: "curto" | "medio" | "longo";
  createdAt: string;
  updatedAt: string;
}

// ── Espiritualidade ───────────────────────────────────────────────────────────

export type AnotacaoCategory = "fe" | "gratidao" | "aprendizado" | "desafio" | "reflexao";

export interface AnotacaoEspiritual {
  id?: number;
  date: string;
  content: string;
  category: AnotacaoCategory;
  versiculo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PedidoOracao {
  id?: number;
  title: string;
  description?: string;
  answered: boolean;
  answeredAt?: string;
  answeredNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VersiculoSalvo {
  id?: number;
  reference: string;
  text: string;
  theme?: string;
  date: string;
  createdAt: string;
}

export interface LeituraBiblica {
  id?: number;
  livro: string;
  capitulo: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export type EstacaoType =
  | "pascoa"
  | "paes_asmos"
  | "primicias"
  | "pentecostes"
  | "trombetas"
  | "dia_expiacao"
  | "tabernaculos";

export interface EstudoEstacao {
  id?: number;
  estacao: EstacaoType;
  semana: number;
  titulo: string;
  conteudo: string;
  versiculo?: string;
  date: string;
  completed: boolean;
  anotacoes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Content Refs ──────────────────────────────────────────────────────────────

export type ContentRefNetwork =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "outro";

export interface ContentRef {
  id?: number;
  title: string;
  url: string;
  network: ContentRefNetwork;
  notes?: string;
  createdAt: string;
}
