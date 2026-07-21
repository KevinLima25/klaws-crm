ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;

ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS cargo TEXT;

UPDATE public.funcionarios SET email = TRIM(LOWER("e-mail")) WHERE email IS NULL AND "e-mail" IS NOT NULL;
UPDATE public.funcionarios SET cargo = TRIM("Cargo atual") WHERE cargo IS NULL AND "Cargo atual" IS NOT NULL;
