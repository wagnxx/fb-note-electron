import React, { useState } from 'react'
import { Select } from 'antd'

const { Option } = Select

interface OptionType {
  value: string | number
  label: string
}

interface MultiSelectWithSelectAllProps {
  options: OptionType[]
  value?: (string | number)[]
  onChange?: (value: (string | number)[]) => void
}

const MultiSelectWithSelectAll: React.FC<MultiSelectWithSelectAllProps> = ({ options, value = [], onChange }) => {
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>(value)

  // 处理多选框值的变化
  const handleSelectChange = (newValue: (string | number)[]) => {
    setSelectedItems(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  // 处理点击全选按钮
  const handleSelectAll = () => {
    const allValues = options.map(option => option.value)
    setSelectedItems(allValues)
    if (onChange) {
      onChange(allValues)
    }
  }

  return (
    <Select
      mode="multiple"
      value={selectedItems}
      onChange={handleSelectChange}
      style={{ width: '100%' }}
      dropdownRender={menu => (
        <>
          <div
            onClick={handleSelectAll}
            style={{
              padding: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#1890ff',
            }}
          >
            Select All
          </div>
          {menu}
        </>
      )}
    >
      {options.map(option => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  )
}

export default MultiSelectWithSelectAll
