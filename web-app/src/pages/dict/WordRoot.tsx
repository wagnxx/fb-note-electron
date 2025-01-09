import React, { useState } from 'react'
import { Layout, Button } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import WordRootManage from './components/WordRootManage'
import WordRootDocMenu from './components/WordRootDocMenu'
import WordRootDoc from './components/WordRootDoc'

const { Header, Content, Sider } = Layout

const RootStudio: React.FC = () => {
  const [view, setView] = useState<'table' | string>('')
  const [isSiderOpen, setIsSiderOpen] = useState(false)

  const handleMenuClick = ({ key }: { key: string }) => setView(key as 'pdf' | 'table')

  return (
    <Layout style={{ height: '100%' }}>
      <Sider theme="light" collapsed={isSiderOpen}>
        <div className=" flex  flex-row justify-center py-2">
          <Button
            icon={isSiderOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setIsSiderOpen(!isSiderOpen)}
          ></Button>
        </div>

        <WordRootDocMenu onItemClick={handleMenuClick} />
      </Sider>
      <Layout>
        <Content style={{ background: '#fff' }}>
          {view === 'table' ? <WordRootManage /> : <WordRootDoc path={view} />}
        </Content>
      </Layout>
    </Layout>
  )
}

export default RootStudio
