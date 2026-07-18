import assert from 'node:assert/strict'
import {
  createArticleDraftKey,
  readArticleDraft,
  removeArticleDraft,
  writeArticleDraft,
  type ArticleEditorDraft,
  type DraftStorage
} from '../src/composables/articleDraftStorage.js'

interface TestForm {
  title: string
  markdownContent: string
}

class MemoryStorage implements DraftStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const draft: ArticleEditorDraft<TestForm> = {
  version: 1,
  savedAt: 1_721_280_000_000,
  articleHash: 'article-42',
  editorType: 'markdown',
  baseFingerprint: 'server-version-1',
  form: {
    title: '未完成的文章',
    markdownContent: '仍在编辑的正文'
  }
}

const storage = new MemoryStorage()
const createKey = createArticleDraftKey(undefined, 'admin-1')
const editKey = createArticleDraftKey('42', 'admin-1')

assert.notEqual(createKey, editKey, '新建文章与编辑文章必须使用不同草稿键')
assert.notEqual(editKey, createArticleDraftKey('43', 'admin-1'), '不同文章的草稿必须隔离')
assert.notEqual(editKey, createArticleDraftKey('42', 'admin-2'), '不同用户的草稿必须隔离')
assert.equal(writeArticleDraft(storage, editKey, draft), true, '可用存储应写入成功')
assert.deepEqual(readArticleDraft<TestForm>(storage, editKey), draft, '写入后应完整恢复草稿')

storage.setItem(editKey, '{invalid json')
assert.equal(readArticleDraft<TestForm>(storage, editKey), null, '损坏的草稿不能阻断编辑页')

storage.setItem(editKey, JSON.stringify({ ...draft, version: 2 }))
assert.equal(readArticleDraft<TestForm>(storage, editKey), null, '未知版本草稿应被忽略')

writeArticleDraft(storage, editKey, draft)
assert.equal(removeArticleDraft(storage, editKey), true, '删除草稿应成功')
assert.equal(readArticleDraft<TestForm>(storage, editKey), null, '删除后不应再恢复草稿')

const unavailableStorage: DraftStorage = {
  getItem: () => null,
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
  removeItem: () => {
    throw new Error('SecurityError')
  }
}

assert.equal(writeArticleDraft(unavailableStorage, editKey, draft), false, '存储不可用时应安全失败')
assert.equal(removeArticleDraft(unavailableStorage, editKey), false, '删除失败不应抛出异常')

console.log('articleDraftStorage: 11 assertions passed')
