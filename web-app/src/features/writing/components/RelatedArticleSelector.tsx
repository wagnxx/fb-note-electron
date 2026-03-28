import React, { useMemo, useState } from 'react'
import { Button, Modal, Input, Select, List } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import stripMarkdown from '@/features/writing/utils/stripMarkdown'

type Props = {
  value?: string | null
  onChange: (id: string | null) => void
  /** optional: restrict to this writing type */
  restrictType?: string | null
}

const RelatedArticleSelector: React.FC<Props> = ({ value, onChange, restrictType = null }) => {
  const { items } = useWriting()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const options = useMemo(() => {
    return items
      .filter(i => (restrictType ? i.type === restrictType : true))
      .map(i => ({ label: stripMarkdown(i.title), value: i.id }))
  }, [items, restrictType])

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase()
    if (!lower) return options
    return options.filter(o => o.label.toLowerCase().includes(lower))
  }, [q, options])

  return (
    <div className="flex items-center gap-2">
      <Select
        style={{ minWidth: 220 }}
        allowClear
        showSearch
        placeholder="选择关联文章（下拉或搜索）"
        value={value || undefined}
        options={options}
        onChange={val => onChange(val || null)}
        filterOption={(input, option) =>
          (option?.label as string).toLowerCase().includes((input || '').toLowerCase())
        }
      />

      <Button size="small" icon={<SearchOutlined />} onClick={() => setOpen(true)}>
        搜索
      </Button>

      <Modal title="搜索关联文章" open={open} onCancel={() => setOpen(false)} footer={null} width={720}>
        <Input
          placeholder="按标题或标签搜索"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="mb-3"
        />
        <List
          size="small"
          bordered
          dataSource={filtered}
          renderItem={item => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  onClick={() => {
                    onChange(item.value as string)
                    setOpen(false)
                  }}
                >
                  选择
                </Button>,
              ]}
            >
              {item.label}
            </List.Item>
          )}
        />
      </Modal>
    </div>
  )
}

export default RelatedArticleSelector
