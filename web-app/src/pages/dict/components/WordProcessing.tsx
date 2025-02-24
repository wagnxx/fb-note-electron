import React, { useEffect, useMemo, useState } from 'react'
import { Checkbox, Flex, Space } from 'antd'
// 只导入 TransferDirection
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import DisabledCheckableTag from '@/components/select/DisabledCheckableTag'

type BasicItem = {
  id: string
  name: string
  disabled?: boolean
}
type WordProcessingProps<T extends BasicItem> = {
  words: T[]
  onProcessedWords?: (words: T[]) => void
}

const WordProcessing = <T extends BasicItem>({ words, onProcessedWords }: WordProcessingProps<T>) => {
  const [selectedTags, setSelectedTags] = React.useState<T[]>([])
  const [tags, settags] = useState(words)

  const checekdState = useMemo(
    () => ({
      indeterminate: selectedTags.length > 0 && selectedTags.length !== words?.length,
      checked: selectedTags.length === words?.length && words?.length !== 0,
    }),
    [selectedTags.length, words?.length],
  )

  useEffect(() => {
    onProcessedWords?.(selectedTags)
  }, [onProcessedWords, selectedTags])

  useEffect(() => {
    setSelectedTags([])
  }, [words])

  const handleAllCheckboxChange = (e: CheckboxChangeEvent) => {
    if (!words) return
    if (e.target.checked) {
      setSelectedTags(words)
    } else {
      setSelectedTags([])
    }
  }

  const handleTagChange = (tag: T, checked: boolean) => {
    const nextSelectedTags = checked ? [...selectedTags, tag] : selectedTags.filter(t => t.id !== tag.id)
    console.log('You are interested in: ', nextSelectedTags)
    setSelectedTags(nextSelectedTags)
  }

  useEffect(() => {
    console.log('wordTag mouted', words)
    settags(words)
  }, [words])

  return (
    <div>
      <Space>
        Selected Tag:
        <Checkbox
          disabled={!words}
          checked={checekdState.checked}
          indeterminate={checekdState.indeterminate}
          onChange={handleAllCheckboxChange}
        />
      </Space>
      <Flex gap="4px 0" wrap>
        {tags.length &&
          tags.map(tag => (
            <DisabledCheckableTag
              key={tag.id}
              disabled={tag.disabled}
              checked={selectedTags.some(sel => sel.id === tag.id)}
              onChange={checked => handleTagChange(tag, checked)}
            >
              {tag.name}
            </DisabledCheckableTag>
          ))}
      </Flex>
    </div>
  )
}

export default WordProcessing
