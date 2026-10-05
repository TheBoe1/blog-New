import { request } from './request'
import type { OperationLogPage, OperationLogQuery, ServerLogLineLimit, ServerLogSnapshot, ServerLogSource } from '@/types/logs'

export const logsApi = {
  getOperations(params: OperationLogQuery): Promise<OperationLogPage> {
    // /monitor 不在博客 API 子域名的代理范围内，复用主站已有 /prod-api 转发。
    // 保留 request 的 Bearer token、401/403 和分页响应处理。
    return request.get<OperationLogPage>('/prod-api/monitor/operlog/list', {
      baseURL: '',
      params,
      showGlobalLoading: false
    })
  },
  getServerTail(source: ServerLogSource, lines: ServerLogLineLimit): Promise<ServerLogSnapshot> {
    // 日志读取器仅由主站 nginx 转发；仍使用统一请求层的管理员 token 和过期处理。
    return request.get<ServerLogSnapshot>('/api/admin/server-logs/tail', {
      baseURL: '',
      params: { source, lines },
      timeout: 10000,
      showGlobalLoading: false
    })
  }
}
