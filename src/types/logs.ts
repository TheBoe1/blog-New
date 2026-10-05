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

export type ServerLogSource = 'carbon' | 'nginx-access' | 'nginx-error' | 'mysql'
  | 'ecs-system' | 'ecs-auth' | 'ecs-kernel' | 'ecs-docker' | 'cron'
  | 'mysql-backup' | 'docker-cleanup' | 'cert-sync'
export type ServerLogLineLimit = 100 | 200 | 500 | 1000

export interface ServerLogSnapshot {
  source: ServerLogSource
  lines: string[]
  fetchedAt: string
  truncated: boolean
}

export interface MaintenanceTask {
  id: string
  name: string
  script: string
  schedules: string[]
  configured: boolean
  scriptAvailable: boolean
  logSource: ServerLogSource | null
  logUpdatedAt: string | null
  logWarning: string | null
}

export interface BackupRecord {
  name: string
  bytes: number
  modifiedAt: string
  partial: boolean
}

export interface MaintenanceSnapshot {
  fetchedAt: string
  timezone: string
  cronAvailable: boolean
  tasks: MaintenanceTask[]
  backup: {
    directory: string
    available: boolean
    records: BackupRecord[]
    limited: boolean
    localRetentionDays: number | null
    destination: { bucket: string; prefix: string; storageClass: string } | null
    latestOutcome: { status: 'success' | 'failed' | 'unknown'; at: string | null; message: string }
  }
}
