// renderer/pages/IconGenerator.tsx
import { Button, Upload, Tabs } from 'antd'
import { useState } from 'react'

export default function IconGenerator() {
  const [outputDir, setOutputDir] = useState('')

  return (
    <div className="p-6 space-y-4">
      <Upload.Dragger multiple={false} accept="image/*">
        <p className="text-lg font-semibold">点击或拖入图片</p>
      </Upload.Dragger>

      <Tabs defaultActiveKey="mac">
        <Tabs.TabPane tab="macOS 图标" key="mac">
          {/* 显示生成的图标预览 */}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Windows 图标" key="win">
          {/* 显示生成的图标预览 */}
        </Tabs.TabPane>
      </Tabs>

      <Button type="primary">一键生成</Button>
    </div>
  )
}
