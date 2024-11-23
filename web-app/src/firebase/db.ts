import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
  FirestoreError,
  query,
  getDocs,
  doc,
  type WhereFilterOp,
  QueryConstraint,
  getFirestore,
  writeBatch,
  where,
} from 'firebase/firestore'

import { app } from './firebase'

const dealError = (error: unknown) => {
  if (error instanceof FirestoreError) {
    console.error('Firestore error:', error.message)
  } else if (error instanceof Error) {
    console.error('General error:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
}

export const db = getFirestore(app)

const LogError = console.error.bind(console)
const LogInfo = console.log.bind(console)

// 添加文档到指定集合
export const addDocToCol = async (colName: string, doc: DocumentData): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, colName), doc)
    LogInfo('Document added with ID:', docRef.id)
    return docRef.id // 返回添加文档的 ID
  } catch (error: unknown) {
    dealError(error)
    return null // 返回 null 或者抛出错误，视情况而定
  }
}

// 获取指定文档的数据
export const getDocData = async (colName: string, docId: string): Promise<DocumentData | null> => {
  try {
    const docSnap = await getDoc(doc(db, colName, docId))
    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      LogError('Document not found')
      return null
    }
  } catch (error: unknown) {
    dealError(error)
    return null // 返回 null 或者抛出错误，视情况而定
  }
}

// 更新指定文档的数据
export const updateDocData = async (
  colName: string,
  docId: string,
  newData: Partial<DocumentData>,
): Promise<void> => {
  try {
    await updateDoc(doc(db, colName, docId), newData)
    LogInfo('Document updated successfully')
  } catch (error: unknown) {
    dealError(error)
  }
}

// 删除指定文档
export const deleteDocById = async (colName: string, docId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, colName, docId))
    LogInfo('Document deleted successfully')
    return true
  } catch (error: unknown) {
    dealError(error)
  }
  return false
}

export const deleteDocsByIds = async (colName: string, docIds: string[]): Promise<boolean> => {
  const batch = writeBatch(db)

  docIds.forEach(id => {
    const docRef = doc(db, colName, id)
    batch.delete(docRef)
  })

  try {
    await batch.commit()
    console.log('Batch delete successful')
    return true
  } catch (error) {
    console.error('Error performing batch delete:', error)
  }
  return false
}

export const getDocsByCondition = async (
  colName: string,
  condition?: { field: string; operator: WhereFilterOp; value: any },
): Promise<DocumentData[]> => {
  try {
    const cond = condition ? [where(condition.field, condition.operator, condition.value)] : []
    const q = query(collection(db, colName), ...cond)
    const querySnapshot = await getDocs(q)
    const docsData: DocumentData[] = []
    querySnapshot.forEach(doc => {
      docsData.push(doc.data())
    })
    return docsData
  } catch (error: unknown) {
    dealError(error)
    return [] // 返回 null 或者抛出错误，视情况而定
  }
}

// 获取指定字段的值
export const getFieldValues = async (
  collectionName: string,
  fieldNames: string[],
  conditions: QueryConstraint[] = [],
): Promise<DocumentData[]> => {
  try {
    // 构建查询
    const q = query(collection(db, collectionName), ...conditions)

    // 获取文档快照
    const querySnapshot = await getDocs(q)

    // 提取字段值
    const fieldValues: DocumentData[] = []

    querySnapshot.forEach(doc => {
      const fieldValue: DocumentData = {}
      fieldNames.forEach(fieldName => {
        if (fieldName === 'id') {
          fieldValue[fieldName] = doc.id
        } else {
          fieldValue[fieldName] = doc.data()[fieldName]
        }
      })
      fieldValues.push(fieldValue)
    })

    return fieldValues
  } catch (error) {
    console.error('Error getting documents:', error)
    return []
  }
}

// 检查字段值是否对应某条数据存在
export const checkDataExistsByFieldValue = async (
  colName: string, // 集合名称
  fieldName: string, // 字段名称
  value: any, // 字段值
): Promise<boolean> => {
  try {
    // 构建查询条件
    const q = query(collection(db, colName), where(fieldName, '==', value))

    // 执行查询
    const querySnapshot = await getDocs(q)

    // 如果查询到文档，表示该字段值对应的数据存在
    if (!querySnapshot.empty) {
      console.log(`Data with '${fieldName}' = '${value}' exists in collection '${colName}'`)
      return true
    } else {
      console.log(`Data with '${fieldName}' = '${value}' does not exist in collection '${colName}'`)
      return false
    }
  } catch (error: unknown) {
    dealError(error)
    return false
  }
}
