import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Form, Input, Space, Spin, Tag, Typography } from 'antd'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { generateWritingTitle, validateWritingData } from '@/features/writing/utils/helpers'
import type { WritingFormData } from '@/features/writing/types'
import type { WritingType } from '@shared/types/writing'

const { Title } = Typography
const { TextArea } = Input

const ArticleEditor: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, createWriting, fetchWriting } = useWriting()

  const type = ((searchParams.get('type') as WritingType) || 'article') as 'article'
  const id = searchParams.get('id')
  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [formData, setFormData] = useState<WritingFormData>({
    type,
    title: '',
    content: '',
    tags: [],
  })

  useEffect(() => {
    if (id) {
      fetchWriting(type, id)
      return
    }

    setFormData({
      type,
      title: generateWritingTitle(type),
      content: '',
      tags: [],
    })
  }, [fetchWriting, id, type])

  useEffect(() => {
    if (!currentItem || !id || currentItem.type !== 'article') {
      return
    }

    setFormData({
      id: currentItem.id,
      type: 'article',
      title: currentItem.title,
      content: currentItem.content,
      tags: currentItem.tags,
    })
  }, [currentItem, id])

  const handleAddTag = () => {
    const value = tagInput.trim()
    if (!value || formData.tags.includes(value)) return
    setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }))
    setTagInput('')
  }

  const handleSave = async () => {
    const validation = validateWritingData(formData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setValidationErrors([])
    await createWriting(formData)
    navigate(`/tool/writing?type=${type}`)
  }

  return (
    <Spin spinning={loading}>
      <div className="p-5 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!mb-0">
            {id ? '编辑文章' : '新建文章'}
          </Title>
          <Space>
            <Button onClick={() => navigate(`/tool/writing?type=${type}`)}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Space>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {validationErrors.length > 0 && (
          <Alert
            type="warning"
            className="mb-4"
            message={
              <ul className="m-0 pl-4">
                {validationErrors.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            }
          />
        )}

        <Form layout="vertical" className="flex flex-col gap-2">
          <Form.Item label="标题">
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="输入标题..."
            />
          </Form.Item>

          <Form.Item label="标签">
            <Space.Compact className="w-full">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onPressEnter={handleAddTag}
                placeholder="输入标签，按回车或点击添加..."
              />
              <Button onClick={handleAddTag}>添加</Button>
            </Space.Compact>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map(tag => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(item => item !== tag) }))}
                  >
                    #{tag}
                  </Tag>
                ))}
              </div>
            )}
          </Form.Item>

          <Form.Item label="内容">
            <TextArea
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="开始写作..."
              rows={24}
            />
          </Form.Item>
        </Form>
      </div>
    </Spin>
  )
}

export default ArticleEditor
