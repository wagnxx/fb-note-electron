import { addDocToCol, deleteDocsByIds, getFieldValues, updateDocData } from '@/firebase/db'
import { auth } from '@/firebase/authService'
import { FieldValue, serverTimestamp } from 'firebase/firestore'
import { CloudMindFile } from '@/pages/mindmap/components/TabpanelCloud'

const COL_MIND_FILES = 'mindFiles'

type MindFilesType = CloudMindFile & {
  createTime: FieldValue
  updatedTime: FieldValue
  createId?: string
}

export const createMindFile = (doc: Partial<MindFilesType>) => {
  if (auth?.currentUser?.uid) {
    doc.createTime = serverTimestamp()
    doc.updatedTime = serverTimestamp()
    doc.createId = auth.currentUser.uid
    return addDocToCol(COL_MIND_FILES, doc)
  }
  return Promise.reject('logout')
}
export const saveMindFile = (doc: Partial<MindFilesType>) => {
  if (auth?.currentUser?.uid) {
    doc.updatedTime = serverTimestamp()
    return updateDocData(COL_MIND_FILES, doc.id!, doc)
  }
  return Promise.reject('logout')
}

export const getAllMindFiles = async () => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  return getFieldValues<MindFilesType>(COL_MIND_FILES, 'all')
}

export const deleteMindFiles = (ids: string[]) => deleteDocsByIds(COL_MIND_FILES, ids)
