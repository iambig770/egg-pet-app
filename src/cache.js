const CACHE_TTL = 5 * 60 * 1000 // 5분

export const cache = {
  set(key, data) {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  },
  get(key) {
    try {
      const item = JSON.parse(sessionStorage.getItem(key))
      if (!item) return null
      if (Date.now() - item.ts > CACHE_TTL) {
        sessionStorage.removeItem(key)
        return null
      }
      return item.data
    } catch {
      return null
    }
  },
  clear(key) {
    if (key) sessionStorage.removeItem(key)
    else sessionStorage.clear()
  }
}