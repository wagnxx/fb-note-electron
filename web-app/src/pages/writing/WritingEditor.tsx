import React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { WritingType } from '@shared/types/writing'
import ArticleEditor from './components/ArticleEditor'
import NovelEditor from './components/NovelEditor'

const WritingEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') as WritingType) || 'article'

  if (type === 'novel') {
    return <NovelEditor />
  }

  // article / short_story / video_script 都是单篇内容，用同一个编辑器
  return <ArticleEditor />
}

export default WritingEditorPage
