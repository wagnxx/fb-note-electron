import React, { FC } from 'react'

type Props = {
  postion?: 'left' | 'leftTop' | 'top' | 'rightTop' | 'right' | 'bottomRight' | 'bottom' | 'leftBottom'
}

const PanelBorderTools: FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({ ...props }) => {
  return (
    <div
      style={{
        marginBottom: '10px',
        padding: '10px',
        backgroundColor: 'rgb(238 242 255 / var(--tw-bg-opacity))',
        borderRadius: '6px',
        // boxShadow: '1px 1px 4px rgba(0, 0, 0, 0.4)',
        position: 'absolute',
        right: '12px',
        top: '16px',
        zIndex: '99',
      }}
      {...props}
    ></div>
  )
}

export default PanelBorderTools
