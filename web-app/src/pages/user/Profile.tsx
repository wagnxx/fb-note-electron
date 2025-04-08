import React, { useEffect, useState } from 'react'
import { Button, Modal, Form, Space, Select, Tag } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { LeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '@/hooks/useNotification'
import { createOrganizationRequest, fetchOrgs, fetchUserRoles } from '@/features/rolePermission'

const UserProfile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { orgs, userRoles } = useSelector((state: RootState) => state.rolePermission)
  const { user } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()

  const { showNotification } = useNotification()

  const navigate = useNavigate()
  const [form] = Form.useForm()

  useEffect(() => {
    if (user) {
      console.log('flush profle')
      dispatch(fetchOrgs())
      dispatch(fetchUserRoles())
    }
  }, [dispatch, user])

  const joindOrgs = userRoles.filter(item => item.userId === user?.uid)

  // 打开申请组织加入的 Modal
  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  // 关闭申请组织加入的 Modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    form.resetFields()
  }

  // 提交申请
  const handleSubmit = async (values: { orgId: string }) => {
    const org = orgs.find(item => item.id === values.orgId)
    if (!org || !user) return

    try {
      // 假设你的 `createOrganizationRequest` 逻辑会把请求提交到后台
      await dispatch(
        createOrganizationRequest({
          orgId: org.id,
          orgName: org.name,
          status: 'pending',
          role: '',
          userId: user?.uid,
          userName: user?.displayName || user?.email || '',
        }),
      )
      showNotification('success', '申请成功！', 'message')
      handleCloseModal()
    } catch (error) {
      showNotification('error', '申请失败，请稍后重试', 'message')
    }
  }

  return (
    <div className="p-6">
      <Space align="center">
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)}></Button>
        <div className="text-xl font-semibold">User Profile</div>
      </Space>
      {/* 用户信息展示 */}
      <div className="mb-6 mt-4">
        <h3 className="text-lg font-medium">User Info</h3>
        <div>
          <div>
            <strong>Username:</strong>
            <span>{user?.displayName || user?.email}</span>
          </div>
          <div>
            <strong>Email:</strong>
            <span>{user?.email}</span>
          </div>
          {/* 可以继续展示其他用户信息 */}
        </div>
      </div>

      <div className=" py-3">
        <strong>Joind Groups:</strong>
        <Space>
          {joindOrgs.map(group => (
            <Tag key={group.id}>{group.orgName}</Tag>
          ))}
        </Space>
      </div>

      {/* 申请加入组织按钮 */}
      <Button type="primary" onClick={handleOpenModal} disabled={joindOrgs.length > 0}>
        Join Organization
      </Button>

      {/* 申请加入组织的 Modal */}
      <Modal title="申请加入组织" open={isModalOpen} onCancel={handleCloseModal} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="orgId" label="Organization Name" rules={[{ required: true, message: '请输入组织名称' }]}>
            <Select options={orgs.map(org => ({ label: org.name, value: org.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserProfile
