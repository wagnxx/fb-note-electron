import React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { WritingType } from '@shared/types/writing'
import ArticleView from './components/ArticleView'
import ChapteredView from './components/ChapteredView'
import NovelView from './components/NovelView'

const WritingView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') as WritingType) || 'article'
  if (type === 'novel') {
    return <NovelView />
  }

  if (type === 'short_story' || type === 'video_script') {
    return <ChapteredView />
  }

  return <ArticleView />
}

export default WritingView
