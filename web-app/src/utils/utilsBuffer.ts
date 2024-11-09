// 将多个 ArrayBuffer 转换为 Base64 编码
export const bufferToBase64 = (chunks: ArrayBuffer[]): string => {
  let base64 = ''
  chunks.forEach(chunk => {
    const uint8Array = new Uint8Array(chunk)
    let binary = ''
    uint8Array.forEach(byte => {
      binary += String.fromCharCode(byte)
    })
    base64 += btoa(binary) // 使用 btoa 将每个 chunk 转为 Base64 字符串
  })
  return base64
}

// 保存数据到 IndexedDB
// 保存数据到 IndexedDB
export const saveChunksToIndexedDB = (key: string, chunks: ArrayBuffer[]): void => {
  const dbRequest = indexedDB.open('videoChunksDB', 2) // 更新版本号为2

  // 创建对象存储
  dbRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
    const db = (event.target as IDBRequest).result

    // 如果对象存储不存在，才创建
    if (!db.objectStoreNames.contains(key)) {
      const store = db.createObjectStore(key, { keyPath: 'index' })
      store.createIndex('index', 'index', { unique: true })
    }
  }

  // 数据库打开成功后执行
  dbRequest.onsuccess = (event: Event) => {
    const db = (event.target as IDBRequest).result

    // 开启事务
    const transaction = db.transaction([key], 'readwrite')
    const store = transaction.objectStore(key)

    // 保存每个 chunk
    chunks.forEach((chunk, index) => {
      store.put({ index, chunk })
    })

    // 事务成功
    transaction.oncomplete = () => {
      console.log(`Saved ${chunks.length} chunks to IndexedDB.`)
    }

    // 事务错误
    transaction.onerror = (error: Event) => {
      console.error('Error saving chunks to IndexedDB:', error)
    }
  }

  // 数据库打开失败
  dbRequest.onerror = (error: Event) => {
    console.error('Error opening IndexedDB:', error)
  }
}

// 从 IndexedDB 加载数据
export const loadChunksFromIndexedDB = async (key: string): Promise<ArrayBuffer[]> => {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('videoChunksDB', 2)

    dbRequest.onsuccess = (event: Event) => {
      const db = (event.target as IDBRequest).result
      const transaction = db.transaction([key], 'readonly')
      const store = transaction.objectStore(key)
      const chunks: ArrayBuffer[] = []

      const cursorRequest = store.openCursor()

      cursorRequest.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          chunks.push(cursor.value.chunk)
          cursor.continue()
        } else {
          resolve(chunks)
        }
      }

      cursorRequest.onerror = (error: Event) => {
        reject({ message: 'Error reading chunks from IndexedDB', error })
      }
    }

    dbRequest.onerror = (error: Event) => {
      reject({ message: 'Error opening IndexedDB', error })
    }
  })
}

// 清除 IndexedDB 中的数据
export const clearChunksFromIndexedDB = (key: string): void => {
  const dbRequest = indexedDB.open('videoChunksDB', 2)

  dbRequest.onsuccess = (event: Event) => {
    const db = (event.target as IDBRequest).result
    const transaction = db.transaction([key], 'readwrite')
    const store = transaction.objectStore(key)

    const clearRequest = store.clear()
    clearRequest.onsuccess = () => {
      console.log('Successfully cleared chunks from IndexedDB!')
    }

    clearRequest.onerror = (error: Event) => {
      console.error('Error clearing chunks from IndexedDB:', error)
    }
  }

  dbRequest.onerror = (error: Event) => {
    console.error('Error opening IndexedDB:', error)
  }
}
