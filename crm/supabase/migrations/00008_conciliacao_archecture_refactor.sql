-- Migration 00008: Hotfix arquitetural Sprint 2.3A
-- 1. VERSIONAMENTO: motor_version
-- 2. NOVO STATUS: AGUARDANDO_DOCUMENTO
-- 3. LOTES: lote_importacao, lote_conciliacao, lote_ocr, lote_whatsapp

-- ==========================================
-- CONCILIACOES
-- ==========================================

ALTER TABLE public.conciliacoes
  ADD COLUMN IF NOT EXISTS motor_version TEXT NOT NULL DEFAULT '2.3.0';

ALTER TABLE public.conciliacoes
  ADD COLUMN IF NOT EXISTS lote_importacao UUID,
  ADD COLUMN IF NOT EXISTS lote_conciliacao UUID,
  ADD COLUMN IF NOT EXISTS lote_ocr UUID,
  ADD COLUMN IF NOT EXISTS lote_whatsapp UUID;

-- Add AGUARDANDO_DOCUMENTO to status constraint
ALTER TABLE public.conciliacoes
  DROP CONSTRAINT IF EXISTS conciliacoes_status_check;

ALTER TABLE public.conciliacoes
  ADD CONSTRAINT conciliacoes_status_check
  CHECK (status IN (
    'CONCILIADO_EXATO',
    'CONCILIADO_DOCUMENTO',
    'AGUARDANDO_DOCUMENTO',
    'PENDENTE_SEM_CORRESPONDENCIA',
    'DIVERGENCIA_VALOR',
    'DIVERGENCIA_DATA',
    'DIVERGENCIA_VALOR_DATA',
    'AMBIGUO_MULTIPLOS_CANDIDATOS',
    'DUPLICADO',
    'DADOS_INSUFICIENTES',
    'PENDENTE_CONFERENCIA'
  ));

CREATE INDEX IF NOT EXISTS idx_conciliacoes_motor_version
  ON public.conciliacoes (motor_version);

-- ==========================================
-- CONCILIACAO_LOGS
-- ==========================================

ALTER TABLE public.conciliacao_logs
  ADD COLUMN IF NOT EXISTS motor_version TEXT NOT NULL DEFAULT '2.3.0';

CREATE INDEX IF NOT EXISTS idx_conciliacao_logs_motor_version
  ON public.conciliacao_logs (motor_version);
