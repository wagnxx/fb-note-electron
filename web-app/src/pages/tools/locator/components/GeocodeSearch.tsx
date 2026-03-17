import { Select } from 'antd'
import { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { LocationPoint } from '@/features/locator/types'

type OptionType = {
  label: string
  value: string | number
  lat: number
  lng: number
}

export function GeocodeSearch({
  onResult,
  onSetLocations,
}: {
  onResult: (lat: number, lng: number, display_name?: string) => void
  onSetLocations: (arr: LocationPoint[]) => void
}) {
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<OptionType[]>([])
  const { notification } = useNotification()

  const doSearch = async (q: string) => {
    if (!q) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
      const data = await res.json()

      if (data && data.length) {
        const parsedData: LocationPoint[] = data.map((item: any) => ({
          id: item.osm_id || `${item.lat}-${item.lon}-${Math.random().toString(36).slice(2, 7)}`,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          title: item.display_name,
        }))

        // 1️⃣ 地图上显示所有候选点
        onSetLocations(parsedData)

        // 2️⃣ Select 下拉选项
        const opts: OptionType[] = parsedData.map(p => ({
          label: p.title ?? '-',
          value: p.id,
          lat: p.lat,
          lng: p.lng,
        }))
        setOptions(opts)

        // 3️⃣ 自动移动到第一个结果（不等于选择）
        const first = parsedData[0]
        onResult(first.lat, first.lng, first.title)
      } else {
        setOptions([])
        notification.warning({ message: '未找到', description: '没有搜索到结果' })
      }
    } catch (err) {
      notification.error({ message: '查询失败', description: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select
      showSearch
      allowClear
      placeholder="搜索地点或地址"
      filterOption={false} // 🔴 关键：禁用本地过滤
      onSearch={doSearch} // 输入即搜索
      loading={loading}
      options={options}
      onChange={(_, option) => {
        const opt = option as OptionType
        if (!opt) return
        onResult(opt.lat, opt.lng, opt.label)
      }}
      style={{ width: '100%' }}
    />
  )
}
