import { Modal } from 'antd'
import React, { useEffect, useRef, useState } from 'react'

export type ModalChildProps<T> = {
  onFinish: (values: any) => void
  onClose: () => void
  submitLoading: boolean
  data?: T | null
}
export interface ModalChildRef {
  resetFields: () => void
}

type ModalProps<T> = {
  visible: boolean
  data?: T | null
  onSubmit: (values: Partial<T>) => void
  onClose: () => void
  Child: React.ForwardRefExoticComponent<ModalChildProps<T> & React.RefAttributes<ModalChildRef>>
}

const ModalForm = <T,>({ visible, onSubmit, onClose, data, Child }: ModalProps<T>) => {
  const [submitLoading, setSubmitLoading] = useState(false)
  const formRef = useRef<ModalChildRef>(null)

  const onFinish = (values: any) => {
    onSubmit(values)
    setSubmitLoading(true)
  }

  useEffect(() => {
    if (!visible) {
      setSubmitLoading(false)
      formRef.current?.resetFields()
    }
  }, [visible])

  return (
    <Modal
      open={visible}
      footer={null}
      styles={{ body: { paddingTop: '24px' } }}
      onCancel={onClose}
    >
      <Child
        onFinish={onFinish}
        onClose={onClose}
        submitLoading={submitLoading}
        ref={formRef}
        data={data}
      />
    </Modal>
  )
}

export default ModalForm
