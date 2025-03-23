import { ModalChildProps, ModalChildRef } from '@/components/modal/ModalForm'
import FlowWrapper from '@/features/mindmap/components/flows/FlowWrapper'
import { CloudMindFile } from '@/pages/mindmap/components/TabpanelCloud'
import React, { forwardRef } from 'react'

const WordFlow = forwardRef<ModalChildRef, ModalChildProps<CloudMindFile>>(
  ({ onFinish, onClose, submitLoading, data }, ref) => {
    const mindData = data?.data[0]
    if (!mindData) return <div>-</div>
    return (
      <div className="flex " style={{ height: '800px' }}>
        <FlowWrapper
          className="flex-1 "
          initNodeList={mindData.nodes}
          initEdgeList={mindData.edges}
          compId={data.name}
          showMiniMap={false}
          showControls={false}
          showBackground={false}
          showTollbar={false}
          readonly
        />
      </div>
    )
  },
)

export default WordFlow
