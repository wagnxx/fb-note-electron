// deepClone.ts

export function deepClone<T>(obj: T, seen = new WeakMap()): T {
  if (obj === null || typeof obj !== 'object') {
    // Return the primitive value or null
    return obj
  }

  if (seen.has(obj)) {
    // If the object has been cloned before (circular reference), return the clone.
    return seen.get(obj)
  }

  // Handle Date cloning (but no prototype)
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  // Handle RegExp cloning (but no prototype)
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T
  }

  // Handle Map cloning (but no prototype)
  if (obj instanceof Map) {
    const mapCopy = new Map()
    seen.set(obj, mapCopy) // Mark this map as seen
    obj.forEach((value, key) => {
      mapCopy.set(deepClone(key, seen), deepClone(value, seen))
    })
    return mapCopy as T
  }

  // Handle Set cloning (but no prototype)
  if (obj instanceof Set) {
    const setCopy = new Set()
    seen.set(obj, setCopy) // Mark this set as seen
    obj.forEach(value => {
      setCopy.add(deepClone(value, seen))
    })
    return setCopy as T
  }

  // Handle ArrayBuffer cloning (but no prototype)
  if (obj instanceof ArrayBuffer) {
    return obj.slice(0) as T // Create a new ArrayBuffer with the same content
  }

  // Handle plain objects and arrays (excluding prototype)
  if (Array.isArray(obj)) {
    const arrCopy = [] as T
    seen.set(obj, arrCopy) // Mark this array as seen
    for (let i = 0; i < obj.length; i++) {
      ;(arrCopy as any)[i] = deepClone((obj as any)[i], seen)
    }
    return arrCopy
  }

  // Handle plain object cloning (excluding prototype)
  const objCopy = {} as T
  seen.set(obj, objCopy) // Mark this object as seen
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      ;(objCopy as any)[key] = deepClone((obj as any)[key], seen)
    }
  }

  return objCopy
}
