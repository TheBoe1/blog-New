import { request } from './request'
import type { OperationLogPage, OperationLogQuery } from '@/types/logs'

export const logsApi = {
  getOperations(params: OperationLogQuery): Promise<OperationLogPage> {
    // /monitor 不在博客 API 子域名的代理范围内，复用主站已有 /prod-api 转发。
    // 保留 request 的 Bearer token、401/403 和分页响应处理。
    return request.get<OperationLogPage>('/prod-api/monitor/operlog/list', {
      baseURL: '',
      params,
      showGlobalLoading: false
    })
  }
}
