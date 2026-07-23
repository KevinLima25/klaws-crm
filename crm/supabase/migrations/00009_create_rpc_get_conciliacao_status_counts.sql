CREATE OR REPLACE FUNCTION public.get_conciliacao_status_counts()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT c.status::TEXT, COUNT(*)::BIGINT
  FROM public.conciliacoes c
  GROUP BY c.status;
END;
$$;
