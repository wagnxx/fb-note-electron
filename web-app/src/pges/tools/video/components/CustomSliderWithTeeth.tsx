import React, { useState, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import './CustomSlider.css' // 引入自定义样式
import { convertSecondsToTime, formatSecondsToHHmmss } from '@/utils/utilsDate' // 时间格式化工具
import { Button, Flex, Space } from 'antd'
import { CloseOutlined } from '@ant-design/icons'

type Props = {
  max: number
  videoTime: number
  onChange: (value: number) => void
  onSaveScreenShorts: (time: number) => void
  onJumpTo: (tm: number, shouldPlay: boolean) => void
}

// 定义通过 ref 暴露的对象类型
export interface CustomSliderRef {
  handleSyncWithVideoTime: () => void
}

const CustomSliderWithTeeth = (
  { max, videoTime, onChange, onSaveScreenShorts, onJumpTo }: Props,
  ref: React.Ref<CustomSliderRef>,
) => {
  const [currentHourValue, setCurrentHourValue] = useState<number>(0)
  const [currentMinuteValue, setCurrentMinuteValue] = useState<number>(0)
  const [currentSecondValue, setCurrentSecondValue] = useState<number>(0)
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false)
  const [tooltipValue, setTooltipValue] = useState<number>(0) // 当前显示的值
  const [tooltipPosition, setTooltipPosition] = useState<number>(0) // Tooltip 的位置
  const [isFixedTolltips, setIsFixedTolltips] = useState<boolean>(false) // Tooltip 的位置
  const sliderRef = useRef<HTMLDivElement>(null)
  const sliderContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('CustomSliderWithTeeth component onMounted')
  }, [])

  useImperativeHandle(ref, () => {
    return {
      handleSyncWithVideoTime: () => {
        if (!videoTime) return
        console.log('videoTime::', videoTime)
        const { h, m, s } = convertSecondsToTime(videoTime)
        setCurrentHourValue(h)
        setCurrentMinuteValue(m)
        setCurrentSecondValue(s)
      },
    }
  }, [videoTime])

  // 使用useMemo计算可选的最大值
  const { maxH, maxM, maxS } = useMemo(() => {
    // 计算最大小时数（max的小时部分）
    const maxH = Math.floor(max / 3600)

    // 计算最大分钟数，去掉已选择的小时部分
    const remainingAfterHour = max - currentHourValue * 3600
    const maxM = Math.floor(remainingAfterHour / 60)

    // 计算最大秒数，去掉已选择的小时和分钟部分
    const remainingAfterMinute = remainingAfterHour - currentMinuteValue * 60
    const maxS = remainingAfterMinute

    return { maxH, maxM, maxS }
  }, [max, currentHourValue, currentMinuteValue])

  // 生成小时部分刻度标记
  const generateHourMarks = () => {
    const marks: { [key: number]: string } = {}
    for (let i = 0; i < 10; i++) {
      marks[i] = i % 1 === 0 ? `${i}h` : '' // 每1小时显示一次刻度
    }
    return marks
  }

  // 生成分钟部分刻度标记
  const generateMinuteMarks = () => {
    const marks: { [key: number]: string } = {}
    for (let i = 0; i < 60; i++) {
      marks[i] = i % 10 === 0 ? `${i}m` : '' // 每10分钟显示一次刻度
    }
    return marks
  }

  // 生成秒部分刻度标记
  const generateSecondMarks = () => {
    const marks: { [key: number]: string } = {}
    for (let i = 0; i < 60; i++) {
      marks[i] = i % 10 === 0 ? formatSecondsToHHmmss(i) : '' // 每10秒显示一次刻度
    }
    return marks
  }

  // 获取鼠标在滑动条上的位置
  const getMousePosition = (e: React.MouseEvent) => {
    const sliderContaine = sliderContainerRef.current
    if (!sliderContaine) return 0
    const rect = sliderContaine.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    return Math.min(Math.max(0, offsetX), rect.width)
  }

  const saveImage = () => {
    const currentTime = currentHourValue * 3600 + currentMinuteValue * 60 + currentSecondValue
    onSaveScreenShorts(currentTime)
    setCurrentSecondValue(0)
    setIsFixedTolltips(false)
  }

  const handleTeethClick = (idx: number, type: 'h' | 'm' | 's') => {
    if (isFixedTolltips) return
    const value = idx
    let currentTime = 0

    switch (type) {
      case 'h': {
        currentTime = value * 3600 + currentMinuteValue * 60 + currentSecondValue
        setCurrentHourValue(value)
        if (currentTime > max) {
          setCurrentMinuteValue(0)
          setCurrentSecondValue(0)
          currentTime = value * 3600 + 0 + 0
        }
        onChange(currentTime)
        break
      }
      case 'm': {
        currentTime = currentHourValue * 3600 + value * 60 + currentSecondValue
        setCurrentMinuteValue(value)
        if (currentTime > max) {
          setCurrentSecondValue(0)
          currentTime = currentHourValue * 3600 + value * 60 + 0
        }
        onChange(currentTime)
        break
      }
      case 's':
        currentTime = currentHourValue * 3600 + currentMinuteValue * 60 + value
        setCurrentSecondValue(value)
        onChange(currentTime)
        break
    }
  }

  // 处理小时滑动条的点击和鼠标移动事件
  const handleHourSliderClick = (idx: number) => handleTeethClick(idx, 'h')
  const handleMinuteSliderClick = (idx: number) => handleTeethClick(idx, 'm')
  const handleSecondSliderClick = (idx: number) => handleTeethClick(idx, 's')
  const handleSecondSliderDBClick = () => {
    setIsFixedTolltips(true)
  }

  // 处理鼠标悬停时更新 Tooltip 显示内容和位置
  const handleTeethHover = (
    e: React.MouseEvent,
    value: number,
    idx: number,
    type: 'h' | 'm' | 's',
  ) => {
    if (isFixedTolltips) return
    let currentTime = currentHourValue * 3600 + currentMinuteValue * 60 + currentSecondValue
    switch (type) {
      case 'h':
        currentTime = idx * 3600 + currentMinuteValue * 60 + currentSecondValue
        break
      case 'm':
        currentTime = currentHourValue * 3600 + idx * 60 + currentSecondValue
        break
      case 's':
        currentTime = currentHourValue * 3600 + currentMinuteValue * 60 + idx
        setTooltipVisible(true)
        break
    }
    setTooltipValue(currentTime)
    onChange(currentTime)
    const position = getMousePosition(e)
    setTooltipPosition(position)
  }

  // 处理鼠标离开时隐藏 Tooltip
  const handleTeethLeave = () => {
    setTooltipVisible(false)
  }

  return (
    <div className="custom-slider-container" ref={sliderContainerRef}>
      {/* 小时滑动条 */}
      <div
        ref={sliderRef}
        className="custom-slider"
        // onClick={handleHourSliderClick} // 点击时改变值
      >
        {/* 小时锯齿刻度 */}
        {Object.entries(generateHourMarks()).map(([key, value], idx) => {
          return (
            <div
              key={key}
              className={`slider-teeth ${idx > maxH ? 'disabled' : ' '}`}
              onMouseEnter={e => handleTeethHover(e, Number(key), idx, 'h')}
              onMouseLeave={handleTeethLeave}
              onClick={() => handleHourSliderClick(idx)} // 点击时改变值
            />
          )
        })}

        {/* 小时游标 */}
        <div
          className="slider-cursor"
          style={{
            left: `${currentHourValue * 6}px`, // 根据当前小时值计算游标位置
            transform: 'translateX(-50%)',
          }}
        ></div>
      </div>

      {/* 分钟滑动条 */}
      <div ref={sliderRef} className="custom-slider">
        {/* 分钟锯齿刻度 */}
        {Object.entries(generateMinuteMarks()).map(([key, value], idx) => {
          return (
            <div
              key={key}
              className={`slider-teeth ${idx > maxM ? 'disabled' : ' '}`}
              onMouseEnter={e => handleTeethHover(e, Number(key), idx, 'm')}
              onMouseLeave={handleTeethLeave}
              onClick={() => handleMinuteSliderClick(idx)} // 点击时改变值
            />
          )
        })}

        {/* 分钟游标 */}
        <div
          className="slider-cursor"
          style={{
            left: `${currentMinuteValue * 6}px`, // 根据当前分钟值计算游标位置
            transform: 'translateX(-50%)',
          }}
        ></div>
      </div>

      {/* 秒滑动条 */}
      <div ref={sliderRef} className="custom-slider">
        {/* 秒锯齿刻度 */}
        {Object.entries(generateSecondMarks()).map(([key, value], idx) => {
          return (
            <div
              key={key}
              className={`slider-teeth ${idx > maxS ? 'disabled' : ' '}`}
              onMouseEnter={e => handleTeethHover(e, Number(key), idx, 's')}
              onMouseLeave={handleTeethLeave}
              onClick={() => handleSecondSliderClick(idx)} // 点击时改变值
              onDoubleClick={() => handleSecondSliderDBClick()}
            />
          )
        })}

        {/* 秒游标 */}
        <div
          className="slider-cursor"
          style={{
            left: `${currentSecondValue * 6}px`, // 根据当前秒值计算游标位置
            transform: 'translateX(-50%)',
          }}
        ></div>
      </div>

      {/* Tooltip 显示 */}

      <div
        className="tooltip-container"
        style={{
          display: isFixedTolltips || tooltipVisible ? 'block' : 'none',
          left: tooltipPosition + 'px',
          transform: 'translateX(-50%)',
        }}
      >
        <Flex justify="end">
          <Button
            icon={<CloseOutlined color="#fff" />}
            shape="circle"
            size="small"
            ghost
            onClick={() => setIsFixedTolltips(false)}
          />
        </Flex>
        <h3>
          Current Time:
          {formatSecondsToHHmmss(tooltipValue)}
        </h3>
        <div>
          <Space>
            <Button onClick={saveImage}>Save Image</Button>
            <Button onClick={() => onJumpTo(tooltipValue, true)}>Play</Button>
          </Space>
        </div>
      </div>
    </div>
  )
}

export default forwardRef<CustomSliderRef, Props>(CustomSliderWithTeeth)
