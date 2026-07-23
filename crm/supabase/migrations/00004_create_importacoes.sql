CREATE TABLE IF NOT EXISTS public.importacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  origem TEXT NOT NULL,
  matricula TEXT,
  nome TEXT,
  cpf TEXT,
  valor NUMERIC(14,2),
  data_pagamento DATE,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  documento TEXT,
  linha_original TEXT,
  arquivo_nome TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.importacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own importacoes"
  ON public.importacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Assistente financeiro can view all"
  ON public.importacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );

CREATE POLICY "Assistente financeiro can insert"
  ON public.importacoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );
