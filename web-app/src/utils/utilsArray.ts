type Item = {
  key: string
  children?: Item[]
  [k: string]: any
}

export const findItemFromArrayByKey = (items: Item[], key: string): Item | null => {
  for (const item of items) {
    if (item.key === key) {
      return item
    }
    if (item.children) {
      const found = findItemFromArrayByKey(item.children, key)
      if (found) return found
    }
  }
  return null
}
