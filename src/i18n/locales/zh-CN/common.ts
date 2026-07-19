export default {
  http: {
      requestFailed: '请求失败',
      unauthorized: '未授权'
    },
  jsonEditor: {
      invalidJson: 'JSON 格式错误：{message}',
      formatted: '已格式化 JSON',
      format: '格式化',
      validate: '校验'
    },
  common: {
      back: '返回',
      index: '序号',
      to: '至',
      success: {
        login: '登录成功',
        register: '注册成功',
        editPassword: '修改成功',
        sendCode: '发送成功（长时间没收到检查垃圾箱┭┮﹏┭┮）',
        operation: '操作成功',
        delete: '删除成功',
        copy: '复制成功'
      },
      fail: {
        login: '登录失败',
        operation: '操作失败',
        copy: '复制失败'
      },
      confirmTitle: '二次确认',
      confirmDelete: '确定删除吗？',
      confirmKick: '确定要踢该用户下线吗？',
      confirmBatchDelete: '确定批量删除选中记录吗？',
      confirmStatusChange: '确定变更启用状态吗？',
      invalidData: '数据契约异常',
      selectAtLeastOne: '请至少选择一个记录',
      export: {
        submitted: '导出任务已提交，完成后将通知您',
      },
      required: '为必填项',
      maxLength: '最大长度 {n}',
      lengthRange: '长度应在 {min} 到 {max} 个字符',
      notSpace: '不能包含空格',
      notSpecialCharacters: '不能包含特殊字符',
      notEqual: '两次输入不一致',
      emailError: '邮箱格式不正确',
      mobileError: '手机号格式不正确',
      urlError: 'URL格式不正确',
      yes: '是',
      no: '否',
      language: '语言', zh: '中文', en: '英文',
      status: {
        show: '显示',
        hide: '隐藏',
        enabled: '启用',
        disabled: '禁用'
      },
      actions: {
        add: '新增',
        edit: '编辑',
        del: '删除',
        enable: '启用',
        disable: '禁用',
        kick: '踢下线',
        save: '保存',
        cancel: '取消',
        confirm: '确认',
        copy: '复制',
        query: '查询',
        reset: '重置',
        export: '导出',
        batchAction: '批量操作',
        batchDelete: '批量删除',
        expandAll: '展开全部',
        collapseAll: '折叠全部',
        batchEdit: '批量修改',
        action: '操作',
        detail: '详情',
        view: '查看',
        close: '关闭',
        expand: '展开',
        collapse: '收起',
        selectAll: '全选',
        refresh: '刷新',
        columnSetting: '列设置'
      },
      welcomeBack: '欢迎回来',
      welcomeSubtitle: '今天也是充满效率的一天',
      personalSettings: '个人设置',
      loadMore: '加载更多',
      loading: '加载中...',
      scrollLoadMore: '滚动加载更多',
      noMore: '没有更多了',
      noData: '暂无数据',
      createdAt: '创建时间',
      startDate: '开始日期',
      endDate: '结束日期',
      pleaseSelect: '请先选择记录',
      placeholder: {
        leaveEmpty: '留空不修改'
      },
      setting: '设置'
    },
  network: {
      offline: {
        title: '网络连接已断开',
        message: '当前页面可能无法同步最新数据，请检查网络后刷新页面。',
        since: '检测时间：{time}',
        refresh: '刷新页面'
      }
    },
  iconSelect: {
      title: '选择图标',
      searchPlaceholder: '搜索图标名称...',
      typePlaceholder: '图标类型',
      selected: '当前选中：',
      clearSelection: '清除',
      empty: '未找到匹配的图标',
      total: '共 {count} 个图标',
      types: {
        all: '全部图标',
        element: 'Element Plus',
        iconify: 'Iconify'
      },
      badges: {
        element: 'Element'
      }
    },
  components: {
      upMedia: {
        imagePlaceholder: '或输入图片URL',
        videoPlaceholder: '或输入视频URL'
      }
    },
  error: {
      notFound: {
        title: '页面未找到',
        description: '抱歉，您访问的页面不存在或已被移除',
        back: '返回上页',
        home: '返回首页'
      },
      deadPage: {
        title: '页面组件未找到',
        description: '路由已经命中，但 view_key 没有解析到对应的页面组件。',
        detailPath: '路由路径',
        detailViewKey: 'view_key',
        back: '返回上页',
        home: '返回首页'
      }
    },
  uploadRuntime: {
      maxSize: '文件大小不能超过 {size}MB',
      unsupportedType: '文件类型不支持',
      unsupportedExt: '不支持的文件类型 .{ext}，仅支持: {exts}',
      ossUnsupported: '当前版本仅支持腾讯云 COS，历史或非 COS 配置不可用，请重新配置 COS'
    },
  time: {
      justNow: '刚刚',
      minutesAgo: '{count}分钟前',
      hoursAgo: '{count}小时前',
      daysAgo: '{count}天前',
      yesterday: '昨天 {time}',
      weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      groups: {
        today: '今天',
        yesterday: '昨天',
        week: '最近 7 天',
        month: '最近 30 天',
        older: '更早'
      }
    },
  devTest: {
      themeSwitch: '主题切换',
      dark: '暗黑',
      light: '明亮',
      downloadTitle: '下载功能测试',
      downloadUrl: '下载 URL',
      downloadUrlPlaceholder: '输入文件 URL',
      filename: '文件名',
      filenamePlaceholder: '建议的文件名（可选）',
      startDownload: '开始下载',
      editor: '富文本编辑器',
      downloadUrlRequired: '请输入下载 URL',
      downloadDone: '文件已交给浏览器下载',
      downloadFailed: '下载失败: {error}',
      editorWelcome: '<p>欢迎使用富文本编辑器</p>'
    }
}
