import { ReactFlowProvider } from '@xyflow/react'
import React, { forwardRef } from 'react'
import Flow, { FlowDiagramRef, FlowProps } from './Flow'

const FlowWrapper = forwardRef<FlowDiagramRef, FlowProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <Flow ref={ref} {...props} />
    </ReactFlowProvider>
  )
})

export default FlowWrapper
