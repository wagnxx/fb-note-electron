import { useLocation } from 'react-router-dom'

/**
 * Custom hook to retrieve one or multiple query parameter values from the URL.
 * @param keys - Single key (string), an array of keys (string[]), or no key (returns all params).
 * @returns An object of query parameters (key: value), or null if the key doesn't exist.
 */
const useQueryParams = (keys?: string | string[]): Record<string, string | null> => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)

  // If no keys are provided, return all query params
  if (!keys) {
    const params: Record<string, string | null> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  }

  // If a single key is provided
  if (typeof keys === 'string') {
    return { [keys]: searchParams.get(keys) }
  }

  // If an array of keys is provided
  if (Array.isArray(keys)) {
    const result: Record<string, string | null> = {}
    keys.forEach(key => {
      result[key] = searchParams.get(key)
    })
    return result
  }

  return {}
}

export default useQueryParams
