export type OperationStatus = 0 | 1

export interface OperationLog {
  operId: number
  title: string
  businessType: number
  operName: string
  operIp: string
  operLocation?: string
  requestMethod: string
  operUrl: string
  method?: string
  status: OperationStatus
  errorMsg?: string
  operTime: string
}

export interface OperationLogQuery {
  pageNum: number
  pageSize: number
  title?: string
  operName?: string
  businessType?: number
  'businessTypes[0]'?: 0
  status?: OperationStatus
  'params[beginTime]'?: string
  'params[endTime]'?: string
}

export interface OperationLogPage {
  rows: OperationLog[]
  total: number
}

export type ServerLogSource = 'carbon' | 'nginx-access' | 'nginx-error'
export type ServerLogLineLimit = 100 | 200 | 500 | 1000

export interface ServerLogSnapshot {
  source: ServerLogSource
  lines: string[]
  fetchedAt: string
  truncated: boolean
}
