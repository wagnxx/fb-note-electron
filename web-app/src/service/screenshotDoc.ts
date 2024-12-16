import {
  addDocToCol,
  checkDataExistsByFieldValue,
  deleteDocsByIds,
  getDocData,
  getFieldValues,
} from '@/firebase/db'
import { auth } from '@/firebase/authService'
import { FieldValue, serverTimestamp, where } from 'firebase/firestore'

const COL_SCREENSHOT = 'screenshotDoc'

export type DocType = {
  docName: string
  screenshots: Array<string>
  keyTerms?: Array<string>
  createTime?: FieldValue
  createId?: string
}

export const createScreenshotDoc = (doc: DocType) => {
  doc.createTime = serverTimestamp()
  if (auth?.currentUser?.uid) {
    doc.createId = auth.currentUser.uid
    return addDocToCol(COL_SCREENSHOT, doc)
  }
  return Promise.reject('logout')
}

export const getAllScreenshotDoc = () => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }
  return getFieldValues(
    COL_SCREENSHOT,
    ['docName', 'id', 'createTime', 'screenshots'],
    [
      where('createId', '==', auth.currentUser.uid),
      // where('docName', '>', ''),
      // orderBy('createTime', 'desc'),
    ],
  )
}
export const checkScreenshotDocExistsByName = (name: string) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }
  return checkDataExistsByFieldValue(COL_SCREENSHOT, 'docName', name)
}

export const getScreenshotDoc = (id: string) => getDocData(COL_SCREENSHOT, id)

export const deleteScreenshotDocs = (ids: string[]) => deleteDocsByIds(COL_SCREENSHOT, ids)
