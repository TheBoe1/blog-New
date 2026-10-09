// Run with a local Vite preview. Fixtures intercept every API/mutation; never target production.
// PLAYWRIGHT_MODULE_PATH may point to the bundled Playwright package without changing project dependencies.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const modulePath = process.env.PLAYWRIGHT_MODULE_PATH || 'playwright'
const { chromium } = require(modulePath)
const { expect } = require(`${modulePath}/test`)
const base = process.env.UIUX_BASE_URL || 'http://127.0.0.1:5175'
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Only localhost UI testing is allowed')
const output = process.env.UIUX_OUTPUT_DIR || '/tmp/blog-mobile-uiux-results'
fs.mkdirSync(output, { recursive: true })
const categories = [{ id: 'one', name: '工程笔记', slug: 'notes', sortOrder: 1, articleCount: 21 }]
const makeArticle = i => ({ id: String(i), slug: `note-${i}`, title: `${i} · 移动端维护笔记与很长很长的标题测试`, summary: '测试内容', categoryId: 'one', categoryName: '工程笔记', tags: ['Vue', '移动端'], createTime: '2026-10-09', isPublished: i % 2 === 0, viewCount: i, likeCount: 0 })

async function setup(browser, viewport, theme = 'light', authenticated = true) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  const state = { articles: Array.from({ length: 21 }, (_, i) => makeArticle(i + 1)), fail: false, requests: [], deletes: 0, errors: [] }
  await context.addInitScript(({ theme, authenticated }) => {
    localStorage.setItem('theme', theme)
    if (authenticated) localStorage.setItem('user', JSON.stringify({ token: 'isolated-ui-fixture', user: { username: '测试管理员', nickname: '测试管理员', role: 'admin' } }))
  }, { theme, authenticated })
  await context.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort()
    const api = url.pathname.startsWith('/api/') || url.pathname === '/getInfo'
    if (!api) return route.continue()
    let data = { code: 200, data: {} }
    if (url.pathname === '/api/settings') data.data = { siteName: '测试博客', adminTitle: '管理后台' }
    else if (url.pathname === '/getInfo') data = { code: 200, user: { userId: 1, userName: '测试管理员', nickName: '测试管理员' }, roles: ['admin'] }
    else if (url.pathname === '/api/categories') data.data = categories
    else if (url.pathname === '/api/tags') data.data = []
    else if (url.pathname.startsWith('/api/admin/articles/') && request.method() === 'DELETE') {
      state.deletes++
      state.articles = state.articles.filter(a => a.id !== url.pathname.split('/').pop())
    } else if (url.pathname === '/api/admin/articles') {
      state.requests.push(Object.fromEntries(url.searchParams))
      if (state.fail) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, msg: 'Fixture failure' }) })
      let rows = state.articles.filter(a => !url.searchParams.get('title') || a.title.includes(url.searchParams.get('title')))
      if (url.searchParams.has('isPublished')) rows = rows.filter(a => String(a.isPublished) === url.searchParams.get('isPublished'))
      const total = rows.length
      const page = Number(url.searchParams.get('pageNum') || 1)
      const size = Number(url.searchParams.get('pageSize') || 10)
      data = { code: 200, rows: rows.slice((page - 1) * size, page * size), total }
    } else if (url.pathname.startsWith('/api/articles')) data = { code: 200, rows: state.articles.slice(0, 5), total: 21 }
    else if (url.pathname === '/api/stats/visit') data.data = { sessionId: 'fixture-session', visitorId: 'fixture' }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
  })
  const page = await context.newPage()
  page.on('pageerror', error => state.errors.push(error.message))
  return { context, page, state }
}

async function noOverflow(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Document overflows horizontally')
  if (await page.locator('.admin-main').count()) assert(await page.locator('.admin-main').evaluate(el => el.scrollWidth <= el.clientWidth), 'Admin content overflows horizontally')
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE })
  const results = []
  try {
    for (const [width, height] of [[320, 740], [375, 812], [768, 1024], [812, 375], [1024, 768], [1440, 900]]) {
      for (const theme of ['light', 'dark']) {
        const { context, page, state } = await setup(browser, { width, height }, theme)
        await page.goto(`${base}/admin/articles`)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        const mobile = width <= 768
        await expect(page.locator(mobile ? '.article-card' : '.el-table__body-wrapper tbody tr')).toHaveCount(10)
        if (!mobile) {
          await expect(page.locator('.el-table .el-tag')).toHaveCount(30)
          await expect(page.locator('.el-table .el-tag').first()).toHaveCSS('opacity', '1')
        }
        await noOverflow(page)
        if (mobile) {
          const toggle = page.getByRole('button', { name: '打开管理导航' })
          await toggle.focus()
          await page.keyboard.press('Enter')
          await expect(page.getByRole('dialog', { name: '管理导航' })).toBeVisible()
          await expect(page.locator('.admin-mobile-drawer .el-sub-menu').last()).not.toHaveClass(/is-opened/)
          await page.keyboard.press('Escape')
          await expect(page.getByRole('dialog', { name: '管理导航' })).not.toBeVisible()
          await expect(toggle).toBeFocused()
        }
        await page.screenshot({ path: path.join(output, `admin-${width}-${height}-${theme}.png`), fullPage: true })
        assert.equal(state.errors.length, 0, state.errors.join('\n'))
        results.push({ viewport: [width, height], theme, admin: 'passed' })
        await context.close()
      }
    }

    const { context, page, state } = await setup(browser, { width: 375, height: 812 })
    await page.goto(`${base}/admin/articles`)
    await expect(page.locator('.article-card')).toHaveCount(10)
    await page.locator('.el-pagination .btn-next').click()
    await expect(page.locator('.article-card-title').first()).toContainText('11 ·')
    await page.getByRole('textbox', { name: '搜索文章标题' }).fill('21 ·')
    await page.getByRole('button', { name: '搜索', exact: true }).click()
    await expect(page.locator('.article-card')).toHaveCount(1)
    assert.equal(state.requests.at(-1).pageNum, '1')
    assert.equal(state.requests.at(-1).title, '21 ·')
    await page.getByRole('button', { name: '重置', exact: true }).click()
    await expect(page.locator('.article-card')).toHaveCount(10)
    await page.getByRole('button', { name: '删除', exact: true }).first().click()
    await page.getByRole('button', { name: '取消', exact: true }).click()
    assert.equal(state.deletes, 0)
    await page.getByRole('button', { name: '删除', exact: true }).first().click()
    await page.locator('.el-popconfirm').getByRole('button', { name: '删除', exact: true }).click()
    await expect(page.locator('.result-count')).toHaveText('共 20 篇')
    assert.equal(state.deletes, 1)
    state.fail = true
    await page.getByRole('button', { name: '搜索', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: '文章加载失败' })).toBeVisible()
    await expect(page.getByText('还没有文章', { exact: true })).not.toBeVisible()
    state.fail = false
    await page.getByRole('button', { name: '重新加载' }).click()
    await expect(page.locator('.article-card')).toHaveCount(10)
    await page.getByRole('textbox', { name: '搜索文章标题' }).fill('不存在的测试标题')
    await page.getByRole('button', { name: '搜索', exact: true }).click()
    await expect(page.getByText('没有符合筛选条件的文章')).toBeVisible()
    await page.getByRole('button', { name: '清除筛选' }).click()
    await expect(page.locator('.article-card')).toHaveCount(10)
    assert.equal(state.errors.length, 0, state.errors.join('\n'))
    results.push({ adminScenarios: 'pagination, search reset, cancel/delete, error/retry, empty/reset passed' })
    await context.close()

    for (const width of [320, 375, 1440]) {
      for (const theme of ['light', 'dark']) {
      const { context, page, state } = await setup(browser, { width, height: 812 }, theme, false)
      await page.goto(`${base}/about`)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(page.locator('.navbar')).toBeVisible()
      await noOverflow(page)
      if (width <= 768) {
        const menu = page.getByRole('button', { name: '打开导航菜单' })
        await menu.click()
        await expect(page.getByRole('dialog', { name: '网站导航' })).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog', { name: '网站导航' })).not.toBeVisible()
        await expect(menu).toBeFocused()
      }
      const search = width <= 768 ? page.locator('.mobile-navbar-actions').getByRole('button', { name: '搜索', exact: true }) : page.getByRole('button', { name: '搜索文章', exact: true })
      await search.click()
      const input = page.getByRole('searchbox', { name: '文章标题或关键词' })
      await expect(input).toBeFocused()
      await input.fill('移动端')
      await expect(page.getByRole('dialog', { name: '搜索文章' }).getByRole('button', { name: '搜索', exact: true })).toBeEnabled()
      await page.screenshot({ path: path.join(output, `search-${width}-${theme}.png`) })
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog', { name: '搜索文章' })).not.toBeVisible()
      await expect(search).toBeFocused()
      await search.click()
      await input.fill('移动端')
      await input.press('Enter')
      await expect(page).toHaveURL(/\/articles\?keyword=/)
      assert.equal(state.errors.length, 0, state.errors.join('\n'))
      results.push({ frontWidth: width, theme, navigationSearch: 'passed' })
      await context.close()
      }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
    console.log(JSON.stringify({ status: 'passed', checks: results.length, output }, null, 2))
  } finally { await browser.close() }
}

module.exports = { setup }
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1 })
