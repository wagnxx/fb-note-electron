import {
  addDocToCol,
  batchAddOrUpdateDocs,
  deleteDocsByIds,
  getDocData,
  getDocSize,
  getFieldValues,
} from '@/firebase/db'
import { auth } from '@/firebase/authService'
import {
  FieldValue,
  limit,
  orderBy,
  QueryConstraint,
  serverTimestamp,
  startAfter,
} from 'firebase/firestore'
import { WordRootType } from '@/pges/dict/WordRoot'

const COL_WORD_ROOT = 'wordRoot'

type DocType = WordRootType & {
  createTime?: FieldValue
  createId?: string
}

export const addWordRoot = (doc: DocType) => {
  if (auth?.currentUser?.uid) {
    doc.createTime = serverTimestamp()
    doc.createId = auth.currentUser.uid
    return addDocToCol(COL_WORD_ROOT, doc)
  }
  return Promise.reject('logout')
}
export const batchUpdateWordRoot = (docs: Partial<DocType>[]) => {
  if (auth?.currentUser?.uid) {
    docs.map(doc => {
      doc.createTime = serverTimestamp()
      doc.createId = auth.currentUser!.uid
    })
    return batchAddOrUpdateDocs(
      COL_WORD_ROOT,
      docs.map(doc => ({ data: doc, id: doc?.id })),
    )
  }
  return Promise.reject('logout')
}

export const getWordRoots = async ({
  pageSize,
  pageNumber,
  lastVisibleDocData,
}: {
  pageSize: number
  pageNumber: number
  lastVisibleDocData?: WordRootType
}) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  console.log('pagesize,pageNuber , ', pageSize, pageNumber)

  const offset = (pageNumber - 1) * pageSize

  const total = await getDocSize(COL_WORD_ROOT)

  const conditions = [
    // where('createId', '==', auth.currentUser.uid),
    orderBy('key', 'asc'),
    // lastVisibleDocData ? startAfter(lastVisibleDocData.key) : null,
    startAfter(offset),
    limit(pageSize),
    // where('docName', '>', ''),
    // orderBy('createTime', 'desc'),
  ].filter(Boolean)

  const data = await getFieldValues(COL_WORD_ROOT, 'all', conditions as QueryConstraint[])

  return {
    total: total,
    data,
  }
}

export const getWordRoot = (id: string) => getDocData(COL_WORD_ROOT, id)

export const deleteWordRoot = (ids: string[]) => deleteDocsByIds(COL_WORD_ROOT, ids)
