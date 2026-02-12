/**
 * 格式化时间为相对时间（如：刚刚、5分钟前、1小时前）
 */
export function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
  
  // 超过7天显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  if (year === now.getFullYear()) {
    return `${month}-${day}`
  }
  return `${year}-${month}-${day}`
}

/**
 * 按时间范围分组（今天、昨天、最近7天、最近30天、更早）
 */
export function groupByTimeRange<T>(
  items: T[],
  getDate: (item: T) => string,
  labels = { today: '今天', yesterday: '昨天', week: '最近 7 天', month: '最近 30 天', older: '更早' }
): { label: string; items: T[] }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const buckets = {
    today: [] as T[],
    yesterday: [] as T[],
    week: [] as T[],
    month: [] as T[],
    older: [] as T[],
  }

  for (const item of items) {
    const d = new Date(getDate(item))
    d.setHours(0, 0, 0, 0)
    if (d >= today) buckets.today.push(item)
    else if (d >= yesterday) buckets.yesterday.push(item)
    else if (d >= weekAgo) buckets.week.push(item)
    else if (d >= monthAgo) buckets.month.push(item)
    else buckets.older.push(item)
  }

  const groups: { label: string; items: T[] }[] = []
  if (buckets.today.length) groups.push({ label: labels.today, items: buckets.today })
  if (buckets.yesterday.length) groups.push({ label: labels.yesterday, items: buckets.yesterday })
  if (buckets.week.length) groups.push({ label: labels.week, items: buckets.week })
  if (buckets.month.length) groups.push({ label: labels.month, items: buckets.month })
  if (buckets.older.length) groups.push({ label: labels.older, items: buckets.older })
  return groups
}

/**
 * 格式化聊天时间（微信风格）
 * - 1分钟内：刚刚
 * - 今天：HH:mm
 * - 昨天：昨天 HH:mm
 * - 本周内：周X HH:mm
 * - 今年内：MM-DD HH:mm
 * - 跨年：YYYY-MM-DD HH:mm
 */
export function formatChatTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return '刚刚'

  const hm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  if (date >= todayStart) return hm

  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  if (date >= yesterdayStart) return `昨天 ${hm}`

  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 6)
  if (date >= weekStart) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${days[date.getDay()]} ${hm}`
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  if (date.getFullYear() === now.getFullYear()) return `${mm}-${dd} ${hm}`
  return `${date.getFullYear()}-${mm}-${dd} ${hm}`
}

/**
 * 判断日期字符串是否为今天
 */
export function isToday(dateStr: string): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateStr: string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}
