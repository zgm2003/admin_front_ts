import messaging from './system-messaging'

export default {
  upload: {
      tabs: { driver: '上传驱动', rule: '上传规则', setting: '上传设置' },
      driver: {
        filter: { driver: '驱动' },
        table: {
          driver: '驱动',
          secret_id: 'SecretId',
          secret_key: 'SecretKey',
          bucket: 'Bucket',
          region: 'Region',
          endpoint: 'COS 写入端点',
          bucket_domain: '访问域名',
          created_at: '创建时间',
          updated_at: '更新时间'
        },
        addTitle: '新增上传驱动',
        editTitle: '编辑上传驱动',
        form: {
          driver: '驱动',
          bucket: 'Bucket',
          region: 'Region',
          endpoint: 'COS 写入端点（可留空）',
          endpoint_placeholder: '默认自动使用 https://{bucket}.cos.{region}.myqcloud.com',
          bucket_domain: '访问域名',
          bucket_domain_placeholder: '例如 cos.example.com，不要填写 https://，用于生成文件访问地址',
          cos_only: '当前仅支持腾讯云 COS',
          secret_id: 'SecretId',
          secret_key: 'SecretKey',
          role_arn: 'RoleArn',
          appid: 'APPID',
          status: '状态'
        }
      },
      rule: {
        filter: { title: '规则标题' },
        table: {
          title: '规则标题',
          max_size_mb: '最大MB',
          created_at: '创建时间',
          updated_at: '更新时间'
        },
        addTitle: '新增上传规则',
        editTitle: '编辑上传规则',
        form: {
          title: '规则标题',
          max_size_mb: '最大MB',
          only_image: '仅允许图片'
        }
      },
      setting: {
        filter: { remark: '备注', status: '状态' },
        table: {
          driver: '驱动',
          rule: '规则',
          remark: '备注',
          status: '状态',
          created_at: '创建时间',
          updated_at: '更新时间'
        },
        addTitle: '新增上传设置',
        editTitle: '编辑上传设置',
        form: {
          driver: '选择驱动',
          rule: '选择规则',
          remark: '备注',
          status: '状态'
        }
      }
    },
  setting: {
      filter: { key: '配置 Key', status: '状态' },
      table: {
        key: 'Key',
        value: 'Value',
        type: '类型',
        remark: '备注',
        status: '状态',
        created_at: '创建时间',
        updated_at: '更新时间'
      },
      form: {
        key: '配置 Key',
        value: '配置值',
        type: '值类型',
        remark: '备注'
      },
      dict: {
        value_type: '值类型'
      }
    },
  queueMonitor: {
      title: '队列监控',
      officialAsynqmonDesc: '使用官方 Asynqmon 只读监控 UI，避免重复手写队列详情、任务列表和运行态页面。',
      openStandalone: '新窗口打开',
      queueName: '队列名称',
      group: '分组',
      waiting: '等待中',
      delayed: '延迟中',
      failed: '失败',
      viewFailed: '查看失败',
      clearWaiting: '清空等待',
      clearFailed: '清空失败',
      retry: '重试',
      autoRefresh: '自动刷新',
      autoRefreshOn: '自动刷新中',
      autoRefreshOff: '已关闭自动刷新',
      failedListTitle: '失败任务列表',
      attempts: '重试次数',
      error: '错误信息',
      data: '任务数据',
      retryConfirm: '确定要重试该任务吗？',
      clearConfirm: '确定要清空 {count} 条等待中的任务吗？',
      clearFailedConfirm: '确定要清空 {count} 条失败任务吗？',
      noWaitingTasks: '没有等待中的任务',
      noFailedTasks: '没有失败的任务',
    },
  websocket: {
      connected: '实时连接已建立',
      disconnected: '实时连接已断开',
      reconnecting: '正在重新连接...',
      bindSuccess: '用户绑定成功',
      bindFailed: '用户绑定失败',
      error: '连接错误',
      notification: {
        title: '系统通知',
        newMessage: '您有新消息'
      }
    },
  exportTask: {
      title: '任务名称',
      fileName: '文件名',
      fileSize: '文件大小',
      rowCount: '数据行数',
      status: '状态',
      expireAt: '过期时间',
      allStatus: '全部状态',
      pending: '处理中',
      success: '已完成',
      failed: '失败',
      download: '下载',
      noFile: '文件未生成',
    },
  cronTask: {
      title: '定时任务',
      taskName: '任务名称',
      description: '描述',
      cronExpr: '执行周期',
      nextRunTime: '下次执行',
      status: '状态',
      handler: '任务类型',
      statusEnabled: '运行中',
      statusDisabled: '已禁用',
      viewLogs: '查看日志',
      logsTitle: '{name} - 执行日志',
      confirmToggle: '确定要{action}任务「{name}」吗？',
      form: {
        name: '任务标识',
        namePlaceholder: '唯一标识，如 clean_export',
        title: '任务名称',
        titlePlaceholder: '如：清理过期导出文件',
        description: '任务描述',
        descriptionPlaceholder: '可选，描述任务功能',
        cronPreset: '快捷选择',
        cronPresetPlaceholder: '选择常用周期',
        cron: 'Cron 表达式',
        cronPlaceholder: '如：0 0 1 * * *（每天凌晨1点）',
        cronReadable: '可读描述',
        cronReadablePlaceholder: '可选，如：每天凌晨1点执行',
        handler: '任务类型',
        handlerPlaceholder: '如 notification:dispatch-due:v1',
        restartTip: '修改后需重启服务才能生效'
      },
      log: {
        startTime: '开始时间',
        endTime: '结束时间',
        duration: '耗时',
        result: '执行结果',
        errorMsg: '错误信息'
      }
    },
  notification: {
      title: '通知中心',
      empty: '暂无通知',
      markAllRead: '全部已读',
      loadMore: '加载更多',
      newNotification: '收到新通知',
      unreadCount: '{count} 条未读通知',
      allRead: '已处理所有通知',
      delete: '删除',
      urgent: '紧急',
      new: '新',
      page: {
        keyword: '搜索标题',
        type: '类型',
        level: '级别',
        readStatus: '状态',
        batchRead: '批量已读',
        batchDelete: '批量删除',
        viewAll: '查看全部',
        read: '已读',
        unread: '未读',
        markRead: '标记已读',
        noLink: '无链接',
        confirmBatchRead: '确定将选中的通知标记为已读吗？',
        confirmBatchDelete: '确定批量删除选中的通知吗？'
      }
    },
  notificationTask: {
      title: '标题',
      content: '内容',
      type: '类型',
      level: '级别',
      levelHelp: '普通：仅更新角标；紧急：弹窗提醒',
      link: '跳转链接',
      platform: '推送平台',
      targetType: '目标类型',
      status: '状态',
      errorMsg: '错误信息',
      progress: '进度',
      sendAt: '发送时间',
      sendAtPlaceholder: '空则立即发送',
      immediate: '立即发送',
      publish: '发布通知',
      cancel: '取消',
      cancelConfirm: '确定要取消该通知任务吗？',
      selectUsers: '选择用户',
      selectRoles: '选择角色',
      searchUsers: '搜索用户',
      searchRoles: '搜索角色'
    },
  systemLog: {
      sidebar: { title: '日志文件', empty: '暂无日志文件', search: '搜索日志文件', noMatched: '没有匹配的日志文件' },
      toolbar: { keyword: '搜索关键字', level: '日志级别', query: '查询', refresh: '刷新', autoScroll: '自动滚底', lines: '行' },
      meta: { currentFile: '当前文件', keyword: '关键字', level: '级别', tail: '尾部行数', filtered: '已筛选' },
      actions: { copyFile: '复制文件名', copyLine: '复制本行', copyVisible: '复制结果', copySuccess: '已复制', resetFilter: '重置筛选' },
      empty: '暂无日志内容',
      error: {
        loadFiles: '加载文件列表失败',
        loadContent: '加载日志内容失败',
        copyUnsupported: '当前浏览器不支持复制',
        copyFailed: '复制失败'
      }
    },
  ...messaging
}
