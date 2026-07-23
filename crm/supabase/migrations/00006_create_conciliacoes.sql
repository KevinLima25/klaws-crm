CREATE TABLE IF NOT EXISTS public.conciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  id_importacao_a UUID REFERENCES public.importacoes(id) ON DELETE SET NULL,
  id_importacao_b UUID REFERENCES public.importacoes(id) ON DELETE SET NULL,
  id_comprovante UUID REFERENCES public.comprovantes(id) ON DELETE SET NULL,

  status TEXT NOT NULL CHECK (status IN (
    'CONCILIADO_EXATO',
    'CONCILIADO_DOCUMENTO',
    'PENDENTE_SEM_CORRESPONDENCIA',
    'DIVERGENCIA_VALOR',
    'DIVERGENCIA_DATA',
    'DIVERGENCIA_VALOR_DATA',
    'AMBIGUO_MULTIPLOS_CANDIDATOS',
    'DUPLICADO',
    'DADOS_INSUFICIENTES',
    'PENDENTE_CONFERENCIA'
  )),

  regra_aplicada TEXT NOT NULL,
  campos_comparados JSONB DEFAULT '{}',
  divergencias JSONB DEFAULT '{}',

  valor_origem NUMERIC(14,2),
  valor_destino NUMERIC(14,2),
  diferenca_valor NUMERIC(14,2),
  data_origem DATE,
  data_destino DATE,

  idempotencia_key TEXT NOT NULL,
  lote_execucao UUID,

  conferido BOOLEAN NOT NULL DEFAULT false,
  conferido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  motivo TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conciliacoes_idempotencia
  ON public.conciliacoes (idempotencia_key);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_id_importacao_a
  ON public.conciliacoes (id_importacao_a);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_id_importacao_b
  ON public.conciliacoes (id_importacao_b);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_id_comprovante
  ON public.conciliacoes (id_comprovante);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_status
  ON public.conciliacoes (status);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_lote
  ON public.conciliacoes (lote_execucao);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_created_at
  ON public.conciliacoes (created_at);

ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all conciliacoes"
  ON public.conciliacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );

CREATE POLICY "Admin can insert conciliacoes"
  ON public.conciliacoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );

CREATE POLICY "Admin can update conciliacoes"
  ON public.conciliacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );
