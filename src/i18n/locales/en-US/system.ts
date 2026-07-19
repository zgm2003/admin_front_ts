import messaging from './system-messaging'

export default {
  upload: {
      tabs: { driver: 'Drivers', rule: 'Rules', setting: 'Settings' },
      driver: {
        filter: { driver: 'Driver' },
        table: {
          driver: 'Driver',
          secret_id: 'SecretId',
          secret_key: 'SecretKey',
          bucket: 'Bucket',
          region: 'Region',
          endpoint: 'COS write endpoint',
          bucket_domain: 'Public access domain',
          created_at: 'Created At',
          updated_at: 'Updated At'
        },
        addTitle: 'Add Upload Driver',
        editTitle: 'Edit Upload Driver',
        form: {
          driver: 'Driver',
          bucket: 'Bucket',
          region: 'Region',
          endpoint: 'COS write endpoint (optional)',
          endpoint_placeholder: 'Defaults to https://{bucket}.cos.{region}.myqcloud.com',
          bucket_domain: 'Public access domain',
          bucket_domain_placeholder: 'For example cos.example.com. Do not include https://. Used to build public file URLs',
          cos_only: 'Only Tencent COS is supported currently',
          secret_id: 'SecretId',
          secret_key: 'SecretKey',
          role_arn: 'Role ARN',
          appid: 'APPID',
          status: 'Status'
        }
      },
      rule: {
        filter: { title: 'Rule Title' },
        table: {
          title: 'Rule Title',
          max_size_mb: 'Max MB',
          created_at: 'Created At',
          updated_at: 'Updated At'
        },
        addTitle: 'Add Upload Rule',
        editTitle: 'Edit Upload Rule',
        form: {
          title: 'Rule Title',
          max_size_mb: 'Max MB',
          only_image: 'Only Image'
        }
      },
      setting: {
        filter: { remark: 'Remark', status: 'Status' },
        table: {
          driver: 'Driver',
          rule: 'Rule',
          remark: 'Remark',
          status: 'Status',
          created_at: 'Created At',
          updated_at: 'Updated At'
        },
        addTitle: 'Add Upload Setting',
        editTitle: 'Edit Upload Setting',
        form: {
          driver: 'Select Driver',
          rule: 'Select Rule',
          remark: 'Remark',
          status: 'Status'
        }
      }
    },
  setting: {
      filter: { key: 'Key', status: 'Status' },
      table: {
        key: 'Key',
        value: 'Value',
        type: 'Type',
        remark: 'Remark',
        status: 'Status',
        created_at: 'Created At',
        updated_at: 'Updated At'
      },
      form: {
        key: 'Key',
        value: 'Value',
        type: 'Value Type',
        remark: 'Remark'
      },
      dict: {
        value_type: 'Value Type'
      }
    },
  queueMonitor: {
      title: 'Queue Monitor',
      officialAsynqmonDesc: 'Uses the official read-only Asynqmon UI instead of duplicating queue details, task lists, and runtime pages by hand.',
      openStandalone: 'Open Standalone',
      queueName: 'Queue Name',
      group: 'Group',
      waiting: 'Waiting',
      delayed: 'Delayed',
      failed: 'Failed',
      viewFailed: 'View Failed',
      clearWaiting: 'Clear Waiting',
      clearFailed: 'Clear Failed',
      retry: 'Retry',
      autoRefresh: 'Auto Refresh',
      autoRefreshOn: 'Auto Refreshing',
      autoRefreshOff: 'Auto Refresh Off',
      failedListTitle: 'Failed Tasks',
      attempts: 'Attempts',
      error: 'Error',
      data: 'Data',
      retryConfirm: 'Are you sure to retry this task?',
      clearConfirm: 'Are you sure to clear {count} waiting tasks?',
      clearFailedConfirm: 'Are you sure to clear {count} failed tasks?',
      noWaitingTasks: 'No waiting tasks',
      noFailedTasks: 'No failed tasks',
    },
  websocket: {
      connected: 'Real-time connection established',
      disconnected: 'Real-time connection lost',
      reconnecting: 'Reconnecting...',
      bindSuccess: 'User bound successfully',
      bindFailed: 'User binding failed',
      error: 'Connection error',
      notification: {
        title: 'System Notification',
        newMessage: 'You have a new message'
      }
    },
  exportTask: {
      title: 'Task Name',
      fileName: 'File Name',
      fileSize: 'File Size',
      rowCount: 'Row Count',
      status: 'Status',
      expireAt: 'Expire At',
      allStatus: 'All Status',
      pending: 'Processing',
      success: 'Completed',
      failed: 'Failed',
      download: 'Download',
      noFile: 'File not generated',
    },
  cronTask: {
      title: 'Scheduled Tasks',
      taskName: 'Task Name',
      description: 'Description',
      cronExpr: 'Schedule',
      nextRunTime: 'Next Run',
      status: 'Status',
      handler: 'Task Type',
      statusEnabled: 'Running',
      statusDisabled: 'Disabled',
      viewLogs: 'View Logs',
      logsTitle: '{name} - Execution Logs',
      confirmToggle: 'Are you sure you want to {action} task "{name}"?',
      form: {
        name: 'Task ID',
        namePlaceholder: 'Unique identifier, e.g. clean_export',
        title: 'Task Name',
        titlePlaceholder: 'e.g. Clean expired export files',
        description: 'Description',
        descriptionPlaceholder: 'Optional, describe task function',
        cronPreset: 'Quick Select',
        cronPresetPlaceholder: 'Select common schedule',
        cron: 'Cron Expression',
        cronPlaceholder: 'e.g. 0 0 1 * * * (daily at 1am)',
        cronReadable: 'Readable Description',
        cronReadablePlaceholder: 'Optional, e.g. Daily at 1am',
        handler: 'Task Type',
        handlerPlaceholder: 'e.g. notification:dispatch-due:v1',
        restartTip: 'Changes require service restart to take effect'
      },
      log: {
        startTime: 'Start Time',
        endTime: 'End Time',
        duration: 'Duration',
        result: 'Result',
        errorMsg: 'Error Message'
      }
    },
  notification: {
      title: 'Notifications',
      empty: 'No notifications',
      markAllRead: 'Mark all as read',
      loadMore: 'Load more',
      newNotification: 'New notification received',
      unreadCount: '{count} unread notifications',
      allRead: 'All caught up',
      delete: 'Delete',
      urgent: 'Urgent',
      new: 'New',
      page: {
        keyword: 'Search title',
        type: 'Type',
        level: 'Level',
        readStatus: 'Status',
        batchRead: 'Batch Read',
        batchDelete: 'Batch Delete',
        viewAll: 'View All',
        read: 'Read',
        unread: 'Unread',
        markRead: 'Mark Read',
        noLink: 'No link',
        confirmBatchRead: 'Mark selected notifications as read?',
        confirmBatchDelete: 'Delete selected notifications?'
      }
    },
  notificationTask: {
      title: 'Title',
      content: 'Content',
      type: 'Type',
      level: 'Level',
      levelHelp: 'Normal: badge only; Urgent: popup alert',
      link: 'Link',
      platform: 'Platform',
      targetType: 'Target',
      status: 'Status',
      errorMsg: 'Error',
      progress: 'Progress',
      sendAt: 'Send Time',
      sendAtPlaceholder: 'Empty for immediate',
      immediate: 'Immediate',
      publish: 'Publish',
      cancel: 'Cancel',
      cancelConfirm: 'Are you sure to cancel this task?',
      selectUsers: 'Select Users',
      selectRoles: 'Select Roles',
      searchUsers: 'Search users',
      searchRoles: 'Search roles'
    },
  systemLog: {
      sidebar: { title: 'Log Files', empty: 'No log files', search: 'Search log files', noMatched: 'No matched log files' },
      toolbar: { keyword: 'Search keyword', level: 'Log level', query: 'Query', refresh: 'Refresh', autoScroll: 'Auto scroll', lines: 'lines' },
      meta: { currentFile: 'Current file', keyword: 'Keyword', level: 'Level', tail: 'Tail lines', filtered: 'Filtered' },
      actions: { copyFile: 'Copy file', copyLine: 'Copy line', copyVisible: 'Copy result', copySuccess: 'Copied', resetFilter: 'Reset' },
      empty: 'No log content',
      error: {
        loadFiles: 'Failed to load file list',
        loadContent: 'Failed to load log content',
        copyUnsupported: 'Clipboard is not supported',
        copyFailed: 'Copy failed'
      }
    },
  ...messaging
}
