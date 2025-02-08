import { Modal } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { ModalProps as AntdModalProps } from 'antd'

export type ModalChildProps<T> = {
  onFinish: (values: any) => void
  onClose: () => void
  submitLoading: boolean
  data?: T | null
}
export interface ModalChildRef {
  resetFields: () => void
}

type ModalFormProps<T, S> = {
  visible: boolean
  data?: T | null
  // onSubmit?: (values: Partial<T>) => void
  // onBatchSubmit?: (values: Partial<T>[]) => void
  onClose: () => void
  Child: React.ForwardRefExoticComponent<ModalChildProps<T> & React.RefAttributes<ModalChildRef>>
} & (S extends 'primary'
  ? { onSubmit: (values: Partial<T>) => void; onBatchSubmit?: never }
  : S extends 'batch'
    ? { onBatchSubmit: (values: Partial<T>[]) => void; onSubmit?: never }
    : S extends 'both'
      ? { onSubmit: (values: Partial<T>) => void; onBatchSubmit: (values: Partial<T>[]) => void }
      : { onSubmit?: never; onBatchSubmit?: never }) &
  Omit<AntdModalProps, 'visible' | 'onClose'>

const ModalForm = <T, S extends 'primary' | 'batch' | 'both' | undefined>(props: ModalFormProps<T, S>) => {
  const [submitLoading, setSubmitLoading] = useState(false)
  const formRef = useRef<ModalChildRef>(null)

  const { visible, onSubmit, onBatchSubmit, onClose, data, Child, ...rest } = props

  const onFinish = (values: any) => {
    onSubmit?.(values)
    onBatchSubmit?.(values)
    setSubmitLoading(true)
  }

  useEffect(() => {
    if (!visible) {
      setSubmitLoading(false)
      formRef.current?.resetFields()
    }
  }, [visible])

  return (
    <Modal open={visible} footer={null} styles={{ body: { paddingTop: '24px' } }} onCancel={onClose} {...rest}>
      <Child onFinish={onFinish} onClose={onClose} submitLoading={submitLoading} ref={formRef} data={data} />
    </Modal>
  )
}

export default ModalForm
