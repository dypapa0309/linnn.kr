/**
 * 키워드 하나로 읽히는 변형 슬러그를 최대한 많이 생성.
 * 랜덤 문자 없음 — 전부 의미있는 조합.
 */

const ACTION_PREFIXES = ['read', 'view', 'open', 'get', 'go', 'see', 'use', 'try', 'visit', 'check']
const ACTION_SUFFIXES = ['go', 'now', 'link', 'here', 'hub', 'io', 'it', 'page', 'spot']
const ADJ_PREFIXES = ['my', 'the', 'new', 'top', 'best', 'good', 'quick', 'fresh', 'real', 'true', 'next']

/** 흔한 단어 약어 매핑 */
const ABBREVIATIONS: Record<string, string[]> = {
  google: ['g', 'ggl'],
  youtube: ['yt', 'tube'],
  instagram: ['ig', 'insta'],
  facebook: ['fb'],
  twitter: ['tw', 'twt'],
  github: ['gh', 'git'],
  notion: ['ntn'],
  document: ['doc'],
  documents: ['docs', 'doc'],
  spreadsheet: ['sheet', 'sheets'],
  spreadsheets: ['sheet', 'sheets'],
  presentation: ['deck', 'slide'],
  presentations: ['deck', 'slides'],
  drive: ['drv'],
  linkedin: ['li', 'lnkd'],
  figma: ['fig'],
  slack: ['slk'],
  discord: ['dis'],
  naver: ['nvr'],
  kakao: ['kko'],
  tistory: ['tis'],
  velog: ['vel'],
  medium: ['med'],
  substack: ['sub'],
  newsletter: ['news', 'letter'],
  video: ['vid'],
  playlist: ['plist', 'list'],
  channel: ['ch'],
  profile: ['prof'],
  portfolio: ['port', 'folio'],
  blog: ['blg'],
  post: ['pst'],
  article: ['art'],
  image: ['img'],
  photo: ['pic'],
  download: ['dl', 'dnld'],
  upload: ['ul'],
  share: ['shr'],
  meeting: ['meet', 'mtg'],
  calendar: ['cal'],
  event: ['evt'],
  shop: ['shp'],
  store: ['str'],
  product: ['prod'],
  service: ['svc'],
  company: ['co'],
  team: ['tm'],
  project: ['proj'],
  design: ['dsn'],
  code: ['cd'],
  repository: ['repo'],
}

/**
 * 키워드로 읽히는 변형 슬러그 목록 생성.
 * 길이 제한(3~16자) 자동 필터.
 */
export function generateVariantsForKeyword(keyword: string): string[] {
  const k = keyword.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (k.length < 2) return []

  const pool: string[] = []

  // 키워드 자체
  pool.push(k)

  // 약어
  const abbrs = ABBREVIATIONS[k] ?? []
  pool.push(...abbrs)

  // action-keyword
  for (const a of ACTION_PREFIXES) {
    pool.push(`${a}-${k}`)
    for (const abbr of abbrs) pool.push(`${a}-${abbr}`)
  }

  // keyword-action
  for (const s of ACTION_SUFFIXES) {
    pool.push(`${k}-${s}`)
    for (const abbr of abbrs) pool.push(`${abbr}-${s}`)
  }

  // adj-keyword
  for (const a of ADJ_PREFIXES) {
    pool.push(`${a}-${k}`)
  }

  // 길이 필터 + 중복 제거
  return Array.from(new Set(pool)).filter((s) => s.length >= 3 && s.length <= 16)
}

/**
 * 여러 키워드 조합 (keyword1-keyword2 형태)
 */
export function generateCombinedVariants(keywords: string[]): string[] {
  const pool: string[] = []
  const cleaned = keywords.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '')).filter((k) => k.length >= 2)

  for (let i = 0; i < Math.min(cleaned.length, 3); i++) {
    for (let j = i + 1; j < Math.min(cleaned.length, 3); j++) {
      const combined = `${cleaned[i]}-${cleaned[j]}`
      if (combined.length >= 3 && combined.length <= 16) pool.push(combined)

      // 약어 조합
      const abbrsI = ABBREVIATIONS[cleaned[i]] ?? []
      const abbrsJ = ABBREVIATIONS[cleaned[j]] ?? []
      for (const a of abbrsI) {
        const c = `${a}-${cleaned[j]}`
        if (c.length >= 3 && c.length <= 16) pool.push(c)
      }
      for (const b of abbrsJ) {
        const c = `${cleaned[i]}-${b}`
        if (c.length >= 3 && c.length <= 16) pool.push(c)
      }
    }
  }

  return Array.from(new Set(pool))
}
