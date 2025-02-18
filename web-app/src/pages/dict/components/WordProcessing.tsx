import React, { Key, useState } from 'react'
import { Transfer, Button, Table, message } from 'antd'
import { WordType } from '../Dict'
import { TransferDirection } from 'antd/lib/transfer' // 只导入 TransferDirection

interface WordProcessingProps {
  words?: WordType[]
  onProcessedWords?: (words: WordType[]) => void
}

const WordProcessing: React.FC<WordProcessingProps> = ({ words, onProcessedWords }) => {
  const [targetKeys, setTargetKeys] = useState<Key[]>([]) // 当前选中的词
  const [isJsonMode, setIsJsonMode] = useState(false)

  const handleChange = (newTargetKeys: Key[], direction: TransferDirection, moveKeys: Key[]) => {
    setTargetKeys(newTargetKeys)
  }

  const handleSave = () => {
    if (!words) return
    // 获取当前选中的核心词和拓展词
    const processedWords = words.filter(word => targetKeys.includes(word.name))
    if (processedWords.length === 0) {
      message.error('Please select some words')
      return
    }
    onProcessedWords?.(processedWords)
  }

  const handleJsonModeToggle = () => {
    setIsJsonMode(!isJsonMode)
  }

  const renderJsonView = () => {
    if (!words) return
    const selectedWords = words.filter(word => targetKeys.includes(word.name))
    return <pre>{JSON.stringify(selectedWords, null, 2)}</pre>
  }

  const renderTableView = () => {
    if (!words) return
    const selectedWords = words.filter(word => targetKeys.includes(word.name))
    return (
      <Table
        rowKey="id"
        dataSource={selectedWords}
        columns={[
          { title: 'ID', dataIndex: 'id' },
          { title: 'Word', dataIndex: 'name' },
          {
            /* 这里使用name而不是word */
          },
        ]}
        pagination={false}
      />
    )
  }

  const transferData =
    words?.map(word => ({
      key: word.name, // 使用name作为唯一key
      title: word.name, // 显示word的name
      description: word.meaning, // 显示word的meaning
    })) || []

  return (
    <div>
      <Transfer
        dataSource={transferData}
        targetKeys={targetKeys}
        onChange={handleChange}
        render={item => item.title} // 使用title作为显示内容
        titles={['Available Words', 'Selected Words']}
        oneWay
      />
      <Button onClick={handleSave} type="primary" style={{ marginTop: '16px' }}>
        Save Words
      </Button>

      <Button onClick={handleJsonModeToggle} style={{ marginTop: '16px', marginLeft: '10px' }}>
        Toggle JSON Mode
      </Button>

      <div style={{ marginTop: '16px' }}>{isJsonMode ? renderJsonView() : renderTableView()}</div>
    </div>
  )
}

export default WordProcessing
