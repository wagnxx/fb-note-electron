import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWriting } from '../../features/writing/hooks/useWriting'
import { validateWritingData, generateWritingTitle } from '../../features/writing/utils/helpers'
import type { WritingFormData } from '../../features/writing/types'
import type { WritingType } from '@shared/types/writing'

const WritingEditorPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, createWriting, fetchWriting } = useWriting()

  const [formData, setFormData] = useState<WritingFormData>({
    type: 'article',
    title: '',
    content: '',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const type = (searchParams.get('type') as WritingType) || 'article'
  const id = searchParams.get('id')

  useEffect(() => {
    if (id) {
      // Load existing writing
      fetchWriting(type, id)
    } else {
      // Initialize new writing
      setFormData({
        type,
        title: generateWritingTitle(type),
        content: '',
        tags: [],
      })
    }
  }, [id, type, fetchWriting])

  useEffect(() => {
    if (currentItem && id) {
      setFormData({
        type: currentItem.type,
        title: currentItem.title,
        content: currentItem.content,
        tags: currentItem.tags,
      })
    }
  }, [currentItem, id])

  const handleSave = async () => {
    const validation = validateWritingData(formData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setValidationErrors([])
    await createWriting(formData)
    navigate('/writing')
  }

  const handleCancel = () => {
    navigate('/writing')
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (loading) {
    return (
      <div className="writing-editor">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="writing-editor">
      <div className="editor-header">
        <h1>{id ? '编辑' : '新建'}写作</h1>
        <div className="editor-actions">
          <button onClick={handleCancel} className="cancel-btn">
            取消
          </button>
          <button onClick={handleSave} className="save-btn">
            保存
          </button>
        </div>
      </div>

      <div className="editor-content">
        {error && <div className="error">{error}</div>}

        {validationErrors.length > 0 && (
          <div className="validation-errors">
            {validationErrors.map((error, index) => (
              <div key={index} className="error-item">
                {error}
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="输入标题..."
          />
        </div>

        <div className="form-group">
          <label>标签</label>
          <div className="tags-input">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder="输入标签，按回车添加..."
            />
            <button onClick={handleAddTag} type="button">
              添加
            </button>
          </div>
          <div className="tags-list">
            {formData.tags.map(tag => (
              <span key={tag} className="tag">
                #{tag}
                <button onClick={() => handleRemoveTag(tag)} type="button">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="content">内容</label>
          <textarea
            id="content"
            value={formData.content}
            onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="开始写作..."
            rows={20}
          />
        </div>
      </div>
    </div>
  )
}

export default WritingEditorPage
