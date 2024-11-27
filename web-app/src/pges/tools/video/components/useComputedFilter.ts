import { useState, useEffect } from 'react'

export type requiredProps = {
  isCropped?: boolean
  name: string | number
}

const useComputedFilter = <T extends requiredProps>(
  initialData: T[],
  imageSizes: Record<string, any>,
  initialFilter: any,
) => {
  const [filter, setFilter] = useState(initialFilter)
  const [filteredData, setFilteredData] = useState(initialData)

  useEffect(() => {
    const computeFilteredData = () => {
      if (!filter.width && !filter.height && filter.isCroped === undefined) {
        return initialData
      }

      const cropMatches = initialData.filter(item => {
        const matchesCroped =
          filter.isCroped === undefined ? true : filter.isCroped === (item.isCropped || false)
        return matchesCroped
      })

      return cropMatches.filter(item => {
        const imageSize = imageSizes[item.name]
        if (!imageSize) return false

        const { width, height } = imageSize

        const matchesWidth = filter.width ? width === filter.width : true
        const matchesHeight = filter.height ? height === filter.height : true

        return matchesWidth && matchesHeight
      })
    }

    setFilteredData(computeFilteredData())
  }, [filter, initialData, imageSizes])

  return { filteredData, setFilteredData, filter, setFilter }
}

export default useComputedFilter
