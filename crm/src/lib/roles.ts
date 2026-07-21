export function canSeeVendas(cargo: string): boolean {
  const upper = cargo?.toUpperCase() || ""
  if (hasFullAccess(cargo)) return true
  return (
    upper.includes("VENDEDOR") ||
    upper.includes("COORDENADOR") ||
    upper.includes("LIDER DE VENDAS") ||
    upper.includes("LÍDER DE VENDAS")
  )
}

export function canSeeAdimplencia(cargo: string): boolean {
  const upper = cargo?.toUpperCase() || ""
  if (hasFullAccess(cargo)) return true
  return upper.includes("COBRANCA") || upper.includes("COBRANÇA")
}

export function hasFullAccess(cargo: string): boolean {
  const upper = cargo?.toUpperCase() || ""
  return upper.includes("GERENTE") || upper.includes("ASSISTENTE FINANCEIRO")
}
