CREATE TABLE IF NOT EXISTS public.comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_pagador TEXT,
  razao_social TEXT DEFAULT 'Administradora de Cartao de Todos Campinas Sul LTDA',
  nome_fantasia TEXT DEFAULT 'Cartao de Todos Campinas Sul',
  data_hora TIMESTAMPTZ,
  valor NUMERIC(10,2),
  matriculas TEXT[] DEFAULT '{}',
  confidence_score NUMERIC(5,2),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'conferencia')),
  arquivo_url TEXT,
  arquivo_drive_id TEXT,
  observacao TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comprovantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comprovantes"
  ON public.comprovantes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Assistente financeiro can view all"
  ON public.comprovantes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );

CREATE POLICY "Assistente financeiro can update"
  ON public.comprovantes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );

CREATE TABLE IF NOT EXISTS public.agentes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo TEXT NOT NULL,
  agente TEXT NOT NULL CHECK (agente IN ('comprovante', 'conciliacao', 'atendimento')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cargo, agente)
);

ALTER TABLE public.agentes_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view agentes_config"
  ON public.agentes_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage agentes_config"
  ON public.agentes_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios
      WHERE email = auth.email()
      AND cargo IN ('ASSISTENTE FINANCEIRO', 'GERENTE')
    )
  );

CREATE TABLE IF NOT EXISTS public.message_buffer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  file_name TEXT,
  file_type TEXT,
  file_data BYTEA,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.message_buffer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own messages"
  ON public.message_buffer FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert default configs for known cargos
INSERT INTO public.agentes_config (cargo, agente, enabled) VALUES
  ('VENDEDOR', 'atendimento', true),
  ('VENDEDOR', 'comprovante', false),
  ('VENDEDOR', 'conciliacao', false),
  ('COORDENADOR', 'atendimento', true),
  ('COORDENADOR', 'comprovante', false),
  ('COORDENADOR', 'conciliacao', false),
  ('LIDER DE VENDAS', 'atendimento', true),
  ('LIDER DE VENDAS', 'comprovante', false),
  ('LIDER DE VENDAS', 'conciliacao', false),
  ('AUXILIAR DE COBRANCA', 'atendimento', true),
  ('AUXILIAR DE COBRANCA', 'comprovante', true),
  ('AUXILIAR DE COBRANCA', 'conciliacao', false),
  ('LIDER DE COBRANCA', 'atendimento', true),
  ('LIDER DE COBRANCA', 'comprovante', true),
  ('LIDER DE COBRANCA', 'conciliacao', false),
  ('ASSISTENTE FINANCEIRO', 'atendimento', true),
  ('ASSISTENTE FINANCEIRO', 'comprovante', true),
  ('ASSISTENTE FINANCEIRO', 'conciliacao', true),
  ('GERENTE', 'atendimento', true),
  ('GERENTE', 'comprovante', true),
  ('GERENTE', 'conciliacao', true)
ON CONFLICT (cargo, agente) DO NOTHING;
