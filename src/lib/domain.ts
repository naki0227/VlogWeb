export function normalizeHost(value: string | null | undefined) {
  if (!value) return ''

  const trimmed = value.trim()

  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`)
    return url.host.toLowerCase()
  } catch {
    return trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()
  }
}

export function withoutPort(host: string) {
  return host.replace(/:\d+$/, '')
}

export function isSameHost(candidate: string, target: string) {
  const normalizedCandidate = withoutPort(normalizeHost(candidate))
  const normalizedTarget = withoutPort(normalizeHost(target))

  if (!normalizedCandidate || !normalizedTarget) return false

  return (
    normalizedCandidate === normalizedTarget ||
    normalizedCandidate === `www.${normalizedTarget}` ||
    normalizedTarget === `www.${normalizedCandidate}`
  )
}
