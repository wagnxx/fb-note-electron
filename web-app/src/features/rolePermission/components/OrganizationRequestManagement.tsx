import React, { useEffect, useState } from 'react'
import { Table, Button, Popconfirm, Form, Input, Modal } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchOrganizationRequests, approveRequest, rejectRequest } from '../rolePermissionSlice'
import { OrganizationRequest } from '../types/types'
import { useNotification } from '@/hooks/useNotification'

const OrganizationRequestManagement = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { organizationRequests } = useSelector((state: RootState) => state.rolePermission)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<any | null>(null)

  const { showNotification } = useNotification()

  useEffect(() => {
    dispatch(fetchOrganizationRequests())
  }, [dispatch])

  const handleApprove = (record: OrganizationRequest) => {
    dispatch(approveRequest({ ...record, status: 'approved' }))
      .unwrap()
      .then(res => {
        if (res.success) {
          showNotification('success', 'Approve succesfully', 'message')
          dispatch(fetchOrganizationRequests())
        } else {
          showNotification('error', res.error || 'Approve faild', 'message')
        }
      })
  }

  const handleReject = async (requestId: string) => {
    await dispatch(rejectRequest(requestId))
    dispatch(fetchOrganizationRequests())
  }

  const openEditModal = (record: any) => {
    setCurrentRequest(record)
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setCurrentRequest(null)
  }

  const handleSave = async (values: any) => {
    // Assuming the request has an "id" and we update it here
    console.log('Updated Request:', values)
    setIsModalOpen(false)
  }

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
    },
    {
      title: 'User Name',
      dataIndex: 'userName',
    },
    {
      title: 'Org Name',
      dataIndex: 'orgName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      // render: (status: string) => (status === 'pending' ? <span>Pending</span> : <span>Approved</span>),
    },
    {
      title: 'Actions',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Popconfirm title="Are you sure to approve?" onConfirm={() => handleApprove(record)}>
            <Button size="small" type="primary" disabled={record.status !== 'pending'}>
              Approve
            </Button>
          </Popconfirm>
          <Popconfirm title="Are you sure to reject?" onConfirm={() => handleReject(record.id)}>
            <Button size="small" danger disabled={record.status !== 'pending'}>
              Reject
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Organization Request Management</h2>
      <Table rowKey="id" columns={columns} dataSource={organizationRequests} />

      <Modal title="Edit Organization Request" open={isModalOpen} onCancel={handleCancel} footer={null}>
        <Form onFinish={handleSave} initialValues={currentRequest}>
          <Form.Item name="orgName" label="Organization Name">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form>
      </Modal>
    </div>
  )
}

export default OrganizationRequestManagement
