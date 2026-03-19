import React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { WritingType } from '@shared/types/writing'
import ArticleEditor from './components/ArticleEditor'
import ChapteredEditor from './components/ChapteredEditor'
import NovelEditor from './components/NovelEditor'

const WritingEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') as WritingType) || 'article'

  if (type === 'novel') {
    return <NovelEditor />
  }

  if (type === 'short_story' || type === 'video_script') {
    return <ChapteredEditor />
  }

  return <ArticleEditor />
}

export default WritingEditorPage
