// 一次性自检：验证趋势图日期区间的预设计算与 < > 平移是否与粒度对应。
// 跑法：node scripts/check-trend-range.mjs
import assert from 'node:assert/strict'
import dayjs from 'dayjs'

const DATE_FMT = 'YYYY-MM-DD'
const MONTH_GRANULARITY_DAYS = 92

const PERIODS = {
  week: { granularity: 'day', step: { value: 7, unit: 'day' }, startOf: t => t.subtract(6, 'day') },
  month: { granularity: 'day', step: { value: 1, unit: 'month' }, startOf: t => t.startOf('month') },
  year: { granularity: 'month', step: { value: 1, unit: 'year' }, startOf: t => t.startOf('year') }
}

function setPresetRange(preset, today = dayjs()) {
  const t = dayjs(today).startOf('day')
  const conf = PERIODS[preset]
  return {
    granularity: conf.granularity,
    start: conf.startOf(t).format(DATE_FMT),
    end: t.format(DATE_FMT),
    step: conf.step
  }
}

function shift(range, dir) {
  const { value, unit } = range.step
  return {
    ...range,
    start: dayjs(range.start).add(dir * value, unit).format(DATE_FMT),
    end: dayjs(range.end).add(dir * value, unit).format(DATE_FMT)
  }
}

function applyCustomRange(start, end, today = dayjs()) {
  const t = dayjs(today).startOf('day')
  let s = dayjs(start).startOf('day')
  let e = dayjs(end).startOf('day')
  const useMonth = e.diff(s, 'day') + 1 > MONTH_GRANULARITY_DAYS
  if (useMonth) {
    s = s.startOf('month')
    e = e.endOf('month')
  }
  if (e.isAfter(t)) e = t
  if (s.isAfter(e)) s = e
  return {
    granularity: useMonth ? 'month' : 'day',
    start: s.format(DATE_FMT),
    end: e.format(DATE_FMT),
    step: useMonth
      ? { value: Math.max(e.diff(s, 'month') + 1, 1), unit: 'month' }
      : { value: Math.max(e.diff(s, 'day') + 1, 1), unit: 'day' }
  }
}

const today = dayjs('2026-09-07')

// 1. 本月必须是自然月，不再是滚动 30 天
const month = setPresetRange('month', today)
assert.equal(month.start, '2026-09-01')
assert.equal(month.end, '2026-09-07')
assert.equal(month.granularity, 'day')

// 2. 本年必须是自然年 + 月粒度，不再跨年到去年
const year = setPresetRange('year', today)
assert.equal(year.start, '2026-01-01')
assert.equal(year.end, '2026-09-07')
assert.equal(year.granularity, 'month')

// 3. 本周是含今天在内的 7 天
const week = setPresetRange('week', today)
assert.equal(week.start, '2026-09-01')
assert.equal(week.end, '2026-09-07')

// 4. < > 步长与粒度对应：周按 7 天、月按 1 月、年按 1 年
assert.deepEqual([shift(week, -1).start, shift(week, -1).end], ['2026-08-25', '2026-08-31'])
assert.deepEqual([shift(month, -1).start, shift(month, -1).end], ['2026-08-01', '2026-08-07'])
assert.deepEqual([shift(year, -1).start, shift(year, -1).end], ['2025-01-01', '2025-09-07'])

// 5. 月末溢出：3/31 往前一个月不能被 dayjs 弹到 3 月
const leap = setPresetRange('month', dayjs('2026-03-31'))
assert.deepEqual([shift(leap, -1).start, shift(leap, -1).end], ['2026-02-01', '2026-02-28'])

// 6. 平移不改变粒度（图的点数结构保持稳定）
assert.equal(shift(month, -1).granularity, month.granularity)
assert.equal(shift(year, -1).granularity, year.granularity)

// 7. 自定义区间：跨度 > 92 天自动切月粒度，平移量等于自身跨度
const long = applyCustomRange('2026-01-05', '2026-06-20', today)
assert.equal(long.granularity, 'month')
assert.deepEqual([long.start, long.end], ['2026-01-01', '2026-06-30'])
assert.deepEqual(long.step, { value: 6, unit: 'month' })

const short = applyCustomRange('2026-08-01', '2026-08-10', today)
assert.equal(short.granularity, 'day')
assert.deepEqual(short.step, { value: 10, unit: 'day' })

// 8. 未来日期被收敛到今天
const future = applyCustomRange('2026-09-01', '2026-12-31', today)
assert.equal(future.end, '2026-09-07')

// 9. 月粒度补齐：后端缺月时前端补 0，点数 = 区间月数
function fillMonthlyBuckets(rows, start, end) {
  const byMonth = new Map(rows.map(r => [r.date.slice(0, 7), r]))
  const out = []
  let cursor = dayjs(start).startOf('month')
  const last = dayjs(end).startOf('month')
  while (!cursor.isAfter(last)) {
    const key = cursor.format('YYYY-MM')
    out.push(byMonth.get(key) ?? { date: cursor.format(DATE_FMT), pv: 0, uv: 0, ip: 0 })
    cursor = cursor.add(1, 'month')
  }
  return out
}
const sparse = [
  { date: '2026-01-01', pv: 3, uv: 2, ip: 1 },
  { date: '2026-04-01', pv: 7, uv: 5, ip: 4 }
]
const filled = fillMonthlyBuckets(sparse, year.start, year.end)
assert.equal(filled.length, 9)
assert.equal(filled[1].pv, 0)
assert.equal(filled[3].pv, 7)
assert.ok(filled.every((d, i) => i === 0 || dayjs(d.date).isAfter(dayjs(filled[i - 1].date))))

console.log('trend range self-check: all assertions passed')
