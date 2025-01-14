import React, { useState } from 'react'
import { Button, Layout } from 'antd'
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
      <Sider
        collapsible
        theme="light"
        collapsed={isSiderOpen}
        onCollapse={v => setIsSiderOpen(v)}
        collapsedWidth={0}
        trigger={isSiderOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        zeroWidthTriggerStyle={{
          backgroundColor: '#71696d80', // 按钮背景颜色
          position: 'absolute', // 使用绝对定位
          top: '50%', // 将触发器垂直居中
          // right: '-50px', // 放在右侧
          // transform: 'translateY(-50%)', // 确保触发器在中间
          // backgroundColor: 'transparent',
          borderRadius: '50%',
          height: '62px',
          width: '62px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000, // 确保触发器位于最上层
          cursor: 'pointer', // 确保触发器可点击
        }}
      >
        <div className=" flex  flex-row justify-center py-2">
          <Button
            icon={isSiderOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setIsSiderOpen(!isSiderOpen)}
          ></Button>
        </div>

        <WordRootDocMenu onItemClick={handleMenuClick} />
      </Sider>
      <Layout>
        <Content style={{ background: '#eee' }}>
          {view === 'table' ? <WordRootManage /> : <WordRootDoc path={view} />}
        </Content>
      </Layout>
    </Layout>
  )
}

export default RootStudio
