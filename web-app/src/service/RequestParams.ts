export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'FIRESTORE'

export type FirestoreAction = 'add' | 'update' | 'delete'

export interface FirestoreParamsBase {
  source: 'firestore'
  colName: string
  action: FirestoreAction
}

export interface FirestoreAddParams extends FirestoreParamsBase {
  action: 'add'
  docData: any
}

export interface FirestoreUpdateParams extends FirestoreParamsBase {
  action: 'update'
  docId: string
  docData: any
}

export interface FirestoreDeleteParams extends FirestoreParamsBase {
  action: 'delete'
  docId: string
}

export type FirestoreParams = FirestoreAddParams | FirestoreUpdateParams | FirestoreDeleteParams

export interface HttpParams {
  source: 'http'
  method: RequestMethod
  url: string
  data?: any
  config?: RequestInit // fetch 或 axios config
}

export type RequestParams = FirestoreParams | HttpParams
