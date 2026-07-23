ALTER TABLE IF EXISTS public.importacoes
  ADD COLUMN IF NOT EXISTS observacao TEXT;
