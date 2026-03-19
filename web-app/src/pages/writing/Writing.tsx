import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWriting } from '../../features/writing/hooks/useWriting'
import { WRITING_TYPES } from '../../features/writing/utils/helpers'
import type { WritingType } from '@shared/types/writing'

const WritingPage: React.FC = () => {
  const navigate = useNavigate()
  const { items, loading, error, fetchWritings, initializeDirectories } = useWriting()
  const [selectedType, setSelectedType] = useState<WritingType>('article')

  useEffect(() => {
    // Initialize directories on first load
    initializeDirectories()
  }, [initializeDirectories])

  useEffect(() => {
    // Load writings for selected type
    fetchWritings(selectedType)
  }, [selectedType, fetchWritings])

  const handleCreateNew = () => {
    navigate(`/writing/editor?type=${selectedType}`)
  }

  const handleEdit = (id: string) => {
    navigate(`/writing/editor?id=${id}&type=${selectedType}`)
  }

  if (loading && items.length === 0) {
    return (
      <div className="writing-page">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="writing-page">
      <div className="writing-header">
        <h1>写作管理</h1>
        <button onClick={handleCreateNew} className="create-btn">
          新建{WRITING_TYPES.find(t => t.value === selectedType)?.label}
        </button>
      </div>

      <div className="writing-content">
        <div className="type-selector">
          {WRITING_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`type-btn ${selectedType === type.value ? 'active' : ''}`}
            >
              <div className="type-label">{type.label}</div>
              <div className="type-desc">{type.description}</div>
            </button>
          ))}
        </div>

        <div className="writings-list">
          {error && <div className="error">{error}</div>}

          {items.length === 0 ? (
            <div className="empty-state">
              <p>还没有{WRITING_TYPES.find(t => t.value === selectedType)?.label}</p>
              <button onClick={handleCreateNew}>创建第一个</button>
            </div>
          ) : (
            <div className="writings-grid">
              {items.map(item => (
                <div key={item.id} className="writing-card" onClick={() => handleEdit(item.id)}>
                  <h3>{item.title}</h3>
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
          )}
        </div>
      </div>
    </div>
  )
}

export default WritingPage
