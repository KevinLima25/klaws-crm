CREATE TABLE IF NOT EXISTS public.conciliacao_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_execucao UUID NOT NULL,
  conciliacao_id UUID REFERENCES public.conciliacoes(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conciliacao_logs_lote
  ON public.conciliacao_logs (lote_execucao);

CREATE INDEX IF NOT EXISTS idx_conciliacao_logs_conciliacao
  ON public.conciliacao_logs (conciliacao_id);

ALTER TABLE public.conciliacao_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all logs"
  ON public.conciliacao_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );

CREATE POLICY "Admin can insert logs"
  ON public.conciliacao_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );
