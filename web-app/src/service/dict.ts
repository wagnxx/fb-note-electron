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

import { AffixType } from '@/pages/dict/components/AffixList'
import { WordRootType } from '@/pages/dict/components/WordRootManage'

const COL_WORD_ROOT = 'wordRoot'
const COL_WORD_AFFIX = 'wordAffix'

export type AffixDocType = AffixType & {
  createTime: FieldValue // 创建时间，必选
  updatedTime: FieldValue // 更新时间，必选
  createId?: string
}

type RootDocType = WordRootType & {
  createTime?: FieldValue
  createId?: string
}

export const addWordRoot = (doc: RootDocType) => {
  if (auth?.currentUser?.uid) {
    doc.createTime = serverTimestamp()
    doc.createId = auth.currentUser.uid
    return addDocToCol(COL_WORD_ROOT, doc)
  }
  return Promise.reject('logout')
}
export const batchUpdateWordRoot = (docs: Partial<RootDocType>[]) => {
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

  const data = await getFieldValues<RootDocType>(
    COL_WORD_ROOT,
    'all',
    conditions as QueryConstraint[],
  )

  return {
    total: total,
    data,
  }
}

export const getWordRoot = (id: string) => getDocData(COL_WORD_ROOT, id)

export const deleteWordRoot = (ids: string[]) => deleteDocsByIds(COL_WORD_ROOT, ids)

export const batchUpdateWordAffix = (docs: Partial<AffixDocType>[]) => {
  if (auth?.currentUser?.uid) {
    docs.map(doc => {
      if (doc.id) {
        doc.updatedTime = serverTimestamp()
      } else {
        doc.createTime = serverTimestamp()
        doc.createId = auth.currentUser!.uid
      }
    })
    return batchAddOrUpdateDocs(
      COL_WORD_AFFIX,
      docs.map(doc => ({ data: doc, id: doc?.id })),
    )
  }
  return Promise.reject('logout')
}
export const deleteWordAffix = (ids: string[]) => deleteDocsByIds(COL_WORD_AFFIX, ids)

export const getWordAffix = async () => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  const conditions = [
    // where('createId', '==', auth.currentUser.uid),
    // orderBy('key', 'asc'),
    // orderBy('key', 'asc'),
    // lastVisibleDocData ? startAfter(lastVisibleDocData.key) : null,
    // where('docName', '>', ''),
    // orderBy('createTime', 'desc'),
  ].filter(Boolean)

  const data = await getFieldValues(COL_WORD_AFFIX, 'all', conditions as QueryConstraint[])

  return data
}
