export type ArticleEditorType = 'markdown' | 'richtext'

export interface ArticleEditorDraft<T> {
  version: 1
  savedAt: number
  articleHash: string
  editorType: ArticleEditorType
  baseFingerprint: string
  form: T
}

export interface DraftStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const STORAGE_PREFIX = 'blog:article-editor-draft:v1'

export function createArticleDraftKey(articleId?: string, userId = 'anonymous'): string {
  return `${STORAGE_PREFIX}:${userId}:${articleId || 'create'}`
}

export function readArticleDraft<T>(storage: DraftStorage, key: string): ArticleEditorDraft<T> | null {
  try {
    const rawDraft = storage.getItem(key)
    if (!rawDraft) return null

    const draft = JSON.parse(rawDraft) as Partial<ArticleEditorDraft<T>>
    if (
      draft.version !== 1
      || typeof draft.savedAt !== 'number'
      || typeof draft.articleHash !== 'string'
      || (draft.editorType !== 'markdown' && draft.editorType !== 'richtext')
      || typeof draft.baseFingerprint !== 'string'
      || !draft.form
    ) {
      return null
    }

    return draft as ArticleEditorDraft<T>
  } catch {
    return null
  }
}

export function writeArticleDraft<T>(
  storage: DraftStorage,
  key: string,
  draft: ArticleEditorDraft<T>
): boolean {
  try {
    storage.setItem(key, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function removeArticleDraft(storage: DraftStorage, key: string): boolean {
  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}
