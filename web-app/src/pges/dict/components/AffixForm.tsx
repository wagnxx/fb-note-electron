// /src/components/AffixForm.tsx
import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Select } from 'antd'
import { AffixType } from './AffixList'
interface AffixFormProps {
  affix: AffixType | null
  onSave: (updatedAffix: AffixType) => void
}

const AffixForm: React.FC<AffixFormProps> = ({ affix, onSave }) => {
  const [form] = Form.useForm()
  const [type, setType] = useState<'prefix' | 'suffix'>('prefix')
  const [affixValues, setAffixValues] = useState<string[]>([])

  useEffect(() => {
    if (affix) {
      form.setFieldsValue({
        affix: affix.affix.join(', '),
        meaning: affix.meaning,
        type: affix.type,
      })
      setType(affix.type)
      setAffixValues(affix.affix)
    }
  }, [affix, form])

  const handleSave = () => {
    form.validateFields().then(values => {
      const updatedAffix = {
        ...affix,
        affix: values.affix.split(',').map((prefix: string) => prefix.trim()),
        meaning: values.meaning,
        type: values.type,
      }
      onSave(updatedAffix as AffixType)
    })
  }

  return (
    <Form form={form} layout="vertical">
      <Form.Item label="词缀" name="affix" rules={[{ required: true, message: '请输入词缀' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
        <Select value={type} onChange={setType}>
          <Select.Option value="prefix">前缀</Select.Option>
          <Select.Option value="suffix">后缀</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="含义" name="meaning" rules={[{ required: true, message: '请输入含义' }]}>
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Form.Item>
    </Form>
  )
}

export default AffixForm
