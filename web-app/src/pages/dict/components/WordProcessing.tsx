import React, { useEffect, useMemo } from 'react'
import { Checkbox, Flex, Space, Tag } from 'antd'
// 只导入 TransferDirection
import { CheckboxChangeEvent } from 'antd/es/checkbox'

interface WordProcessingProps {
  words?: string[]
  onProcessedWords?: (words: string[]) => void
}

const WordProcessing: React.FC<WordProcessingProps> = ({ words, onProcessedWords }) => {
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])

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

  const handleTagChange = (tag: string, checked: boolean) => {
    const nextSelectedTags = checked ? [...selectedTags, tag] : selectedTags.filter(t => t !== tag)
    console.log('You are interested in: ', nextSelectedTags)
    setSelectedTags(nextSelectedTags)
  }

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
        {words?.length &&
          words.map(tag => (
            <Tag.CheckableTag
              key={tag}
              checked={selectedTags.includes(tag)}
              onChange={checked => handleTagChange(tag, checked)}
            >
              {tag}
            </Tag.CheckableTag>
          ))}
      </Flex>
    </div>
  )
}

export default WordProcessing
