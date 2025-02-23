import React, { useState, useEffect } from 'react'
import { List, Checkbox, Radio, Row, Col } from 'antd'

type BasicItem = {
  id: string
  name: string
  disabled?: boolean
}

type SelectableListProps<T extends BasicItem> = {
  data: T[] // 泛型支持复杂类型
  multiple?: boolean // 控制是否多选
  onChange: (selectedKeys: string[]) => void // 选择项变化回调
  checkboxPosition?: 'left' | 'right' // 选择框位置，默认右侧
  renderItem?: (item: T) => React.ReactNode // 渲染项的自定义方法
  defaultField?: keyof T // 默认展示字段，默认为name
  headerExtra?: React.ReactNode
}

const SelectableList = <T extends BasicItem>({
  data,
  multiple = false,
  onChange,
  checkboxPosition = 'right',
  renderItem,
  defaultField = 'name',
  headerExtra = null,
}: SelectableListProps<T>) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState<boolean | 'indeterminate'>(false) // 全选状态

  // 计算全选状态
  useEffect(() => {
    const allAvalibleIds = data.filter(item => !item.disabled).map(item => item.id)
    if (allAvalibleIds.length === 0) {
      setSelectAll(false)
    } else if (selectedItems.length === 0) {
      setSelectAll(false)
    } else if (selectedItems.length === allAvalibleIds.length) {
      setSelectAll(true)
    } else {
      setSelectAll('indeterminate') // 部分选中
    }
  }, [selectedItems, data])

  // 单选模式，选中某一项时取消之前的选项
  const handleSingleSelect = (item: T) => {
    const newSelected = [item.id] // 只保留当前项
    setSelectedItems(newSelected)
    onChange(newSelected)
  }

  // 多选模式，添加或移除选中的项
  const handleMultiSelect = (item: T, checked: boolean) => {
    const newSelected = checked ? [...selectedItems, item.id] : selectedItems.filter(i => i !== item.id)
    setSelectedItems(newSelected)
    onChange(newSelected)
  }

  // 切换全选状态
  const toggleSelectAll = (e: any) => {
    const checked = e.target.checked
    if (checked) {
      const allAvalibleIds = data.filter(item => !item.disabled).map(item => item.id) // 获取所有项的 id
      setSelectedItems(allAvalibleIds) // 全选
      onChange(allAvalibleIds)
    } else {
      setSelectedItems([]) // 取消全选
      onChange([])
    }
  }

  return (
    <div>
      <List
        bordered
        header={
          multiple && (
            <div style={{ marginBottom: 16 }} className="flex justify-between items-center">
              <Checkbox
                indeterminate={selectAll === 'indeterminate'}
                checked={selectAll === true}
                onChange={toggleSelectAll}
              >
                {selectAll === true ? '取消全选' : selectAll === 'indeterminate' ? '部分选中' : '全选'}
              </Checkbox>

              {headerExtra}
            </div>
          )
        }
        dataSource={data}
        renderItem={item => (
          <List.Item>
            <Row style={{ width: '100%' }}>
              {checkboxPosition === 'left' && (
                <Col span={8} style={{ textAlign: 'left' }}>
                  {/* 根据是否启用多选或单选渲染不同的选择框 */}
                  {multiple ? (
                    <Checkbox
                      disabled={item.disabled}
                      checked={selectedItems.includes(item.id)}
                      onChange={e => handleMultiSelect(item, e.target.checked)}
                    />
                  ) : (
                    <Radio checked={selectedItems.includes(item.id)} onChange={() => handleSingleSelect(item)} />
                  )}
                </Col>
              )}
              <Col span={16}>
                {/* 使用父组件传入的 renderItem，否则使用默认字段 */}
                {renderItem ? renderItem(item) : (item[defaultField] as string)}
              </Col>
              {checkboxPosition === 'right' && (
                <Col span={8} style={{ textAlign: 'right' }}>
                  {/* 根据是否启用多选或单选渲染不同的选择框 */}
                  {multiple ? (
                    <Checkbox
                      disabled={item.disabled}
                      checked={selectedItems.includes(item.id)}
                      onChange={e => handleMultiSelect(item, e.target.checked)}
                    />
                  ) : (
                    <Radio checked={selectedItems.includes(item.id)} onChange={() => handleSingleSelect(item)} />
                  )}
                </Col>
              )}
            </Row>
          </List.Item>
        )}
      />
    </div>
  )
}

export default SelectableList
