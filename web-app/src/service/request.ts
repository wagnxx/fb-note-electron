import { db } from '@/firebase/db'
import { RequestParams } from './RequestParams'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'

export const request = async (params: RequestParams) => {
  try {
    if (params.source === 'http') {
      const { method, url, data, config } = params

      if (typeof fetch === 'function') {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(config?.headers || {}),
          },
          body: data ? JSON.stringify(data) : undefined,
          ...config,
        })

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
        return await res.json()
      }

      throw new Error('No fetch method available')
    }

    // --- Firestore
    if (params.source === 'firestore') {
      const { colName, action } = params
      const colRef = collection(db, colName)

      if (action === 'add') {
        const { docData } = params
        const res = await addDoc(colRef, docData)
        return res.id
      }

      if (action === 'update') {
        const { docId, docData } = params
        const docRef = doc(db, colName, docId)
        await updateDoc(docRef, docData)
        return true
      }

      if (action === 'delete') {
        const { docId } = params
        const docRef = doc(db, colName, docId)
        await deleteDoc(docRef)
        return true
      }

      throw new Error(`Unsupported firestore action: ${action}`)
    }

    throw new Error('Unknown source in request params')
  } catch (err) {
    console.error('[request error]', err)
    throw err
  }
}
