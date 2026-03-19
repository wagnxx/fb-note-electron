import React from 'react'
import type { WritingBase } from '@shared/types/writing'

interface WritingListProps {
  items: WritingBase[]
  onItemClick: (id: string) => void
  loading?: boolean
}

const WritingList: React.FC<WritingListProps> = ({ items, onItemClick, loading = false }) => {
  if (loading) {
    return (
      <div className="writing-list">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="writing-list">
        <div className="empty-state">
          <p>暂无内容</p>
        </div>
      </div>
    )
  }

  return (
    <div className="writing-list">
      <div className="writings-grid">
        {items.map(item => (
          <div key={item.id} className="writing-card" onClick={() => onItemClick(item.id)}>
            <h3 className="writing-title">{item.title}</h3>
            <div className="writing-meta">
              <span className="date">{new Date(item.updatedAt).toLocaleDateString('zh-CN')}</span>
              {item.tags.length > 0 && (
                <div className="tags">
                  {item.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WritingList
