export default {
  auth: {
    login: {
      title: '登录',
      account: '账号',
      accountPlaceholder: '请输入邮箱/用户名/手机号',
      email: '邮箱',
      password: '密码',
      passwordPlaceholder: '请输入密码',
      remember: '记住我',
      submit: '登录',
      toRegister: '注册',
      toForget: '忘记密码?'
    },
    register: {
      title: '注册',
      username: '用户名',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      code: '验证码',
      sendCode: '发送验证码',
      resend: '{timer}秒后重新发送',
      submit: '注册',
      toLogin: '已有账号？去登录'
    },
    edit: {
      title: '修改密码',
      oldPassword: '原始密码',
      newPassword: '新密码',
      confirmPassword: '确认新密码',
      submit: '修改密码'
    },
    forget: {
      title: '忘记密码',
      email: '邮箱',
      code: '验证码',
      newPassword: '新密码',
      submit: '修改密码',
      toEdit: '记得原来密码'
    }
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
    selectAtLeastOne: '请至少选择一个记录',
    export: {
      submitted: '导出任务已提交，完成后将通知您',
    },
    required: '为必填项',
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
      refresh: '刷新'
    },
    quickEntry: '快速入口',
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
  home: {
    quickEntry: '快捷入口',
    quickEntrySetting: '快捷入口设置',
    noQuickEntry: '点击设置添加快捷入口',
    addQuickEntry: '添加快捷入口'
  },
  menu: {
    home: '首页',
    // 一级菜单
    user: '用户',
    permissionMgmt: '权限管理',
    system: '系统管理',
    component: '组件演示',
    ai: 'AI助手',
    devTools: '开发工具',
    // 独立页面
    personal: '个人资料',
    notification: '通知中心',
    test: '测试页',
    // 用户模块
    user_userManager: '用户管理',
    user_usersLoginLog: '登录日志',
    // 权限管理模块
    permission_permission: '后台菜单管理',
    permission_role: '角色管理',
    // 系统管理模块
    system_operationLog: '操作日志',
    system_uploadConfig: '上传配置',
    system_setting: '系统设置',
    system_authPlatform: '认证平台',
    system_test: '测试',
    system_notificationTask: '通知管理',
    system_log: '系统日志',
    // 组件演示模块
    component_upload: '上传',
    component_download: '下载管理器',
    component_form: '表单',
    component_display: '展示',
    component_effect: '特效',
    // AI助手模块
    ai_models: '模型配置',
    ai_agents: '智能体',
    ai_chat: '对话',
    ai_runs: '运行监控',
    ai_prompt: '提示词',
    ai_goods: '电商口播',
    // 开发工具模块
    devTools_gen: '代码生成',
    devTools_queueMonitor: '队列监控',
    devTools_operationLog: '操作日志',
    // 聊天
    chat: '聊天室',
    devTools_exportTask: '导出任务',
    devTools_cronTask: '定时任务',
    devTools_tauriVersion: '版本管理',
  },
  personal: {
    title: '个人信息',
    username: '用户名',
    email: '邮箱',
    phone: '手机号',
    sex: '性别',
    role: '权限',
    passwordStatus: '密码状态',
    bio: '个人简介',
    notSet: '未设置',
    noBio: '暂无简介',
    unknown: '未知',
    set: '已设置',
    tabs: {
      basic: '基本资料',
      security: '账号与安全',
      loginLog: '登录日志',
      operationLog: '操作日志'
    },
    log: {
      recentLoginDesc: '最近5次登录记录',
      recentOperationDesc: '最近5次操作记录',
      noData: '暂无记录'
    },
    form: {
      avatar: '头像',
      username: '用户名',
      usernamePlaceholder: '请输入用户名',
      sex: '性别',
      sexPlaceholder: '请选择性别',
      birthday: '生日',
      birthdayPlaceholder: '选择日期',
      address: '地址',
      addressPlaceholder: '请选择地址',
      detailAddress: '详细地址',
      bio: '个人简介',
      bioPlaceholder: '请输入内容',
      saveBasic: '保存基本资料'
    },
    security: {
      phone: '手机号',
      email: '邮箱',
      password: '登录密码',
      bound: '已绑定',
      unbound: '未绑定',
      notBound: '暂未绑定',
      changePhone: '更换手机号',
      bindPhone: '绑定手机号',
      changeEmail: '更换邮箱',
      bindEmail: '绑定邮箱',
      newPhone: '新手机号',
      newPhonePlaceholder: '请输入新手机号',
      newEmail: '新邮箱',
      newEmailPlaceholder: '请输入新邮箱',
      code: '验证码',
      codePlaceholder: '请输入验证码',
      getCode: '获取验证码',
      retryAfter: '{timer}秒后重试',
      save: '保存',
      changePassword: '修改密码',
      setPassword: '设置密码',
      passwordTip: '设置密码后可使用密码登录，更加便捷',
      oldPassword: '原密码',
      oldPasswordPlaceholder: '请输入原密码',
      newPassword: '新密码',
      newPasswordPlaceholder: '请输入新密码（至少6位）',
      confirmPassword: '确认密码',
      confirmPasswordPlaceholder: '请再次输入新密码',
      forgetOldPassword: '忘记原密码？使用验证码验证',
      rememberOldPassword: '记得原密码？使用密码验证',
      codeSendTo: '验证码将发送至',
      warning: {
        enterNewPhone: '请输入新手机号',
        enterNewEmail: '请输入新邮箱',
        fillComplete: '请填写完整信息',
        enterNewPassword: '请填写新密码',
        passwordNotMatch: '两次输入的密码不一致',
        passwordMinLength: '密码长度至少6位',
        enterOldPassword: '请输入原密码',
        enterCode: '请输入验证码',
        bindAccountFirst: '请先绑定邮箱或手机号'
      }
    }
  },
  header: {
    projectConfig: '项目配置',
    theme: '主题',
    settings: '设置',
    search: '搜索',
    downloads: '下载管理',
    systemTheme: '系统主题',
    headerTheme: '头部主题',
    menuTheme: '菜单主题',
    display: '界面显示',
    transition: '过渡动画',
    transitionEnable: '开启过渡',
    transitionType: '过渡效果',
    breadcrumb: '面包屑',
    hamburger: '折叠图标',
    fullscreen: '全屏图标',
    tab: '标签页',
    uniqueOpen: '手风琴',
    footer: '页脚',
    clearAndReset: '清除缓存并重置',
    resetLight: '恢复明亮默认',
    resetDark: '恢复暗黑默认',
    logoutTitle: '温馨提示',
    logoutText: '是否退出本系统？',
    cancel: '取消',
    ok: '确定',
    personal: '个人资料',
    logout: '退出登录',
    layoutSingle: '单列模式',
    layoutDouble: '双列模式'
  },
  search: {
    placeholder: '搜索页面，支持名称与路径',
    wake: '唤醒搜索面板',
    navigate: '切换搜索结果',
    enter: '进入页面',
    esc: '关闭搜索面板',
    empty: '暂无匹配'
  },
  footer: {copyright: 'Copyright©智澜·AI云原生高并发智能工作流平台 · 鄂ICP备2025095115号-1'},
  operationLog: {
    filter: {userName: '操作人昵称', userEmail: '操作人邮箱', action: '动作', date: '日期范围'},
    table: {
      id: 'ID',
      user_name: '操作人昵称',
      user_email: '操作人邮箱',
      action: '动作',
      request_data: '请求参数',
      response_data: '输出参数',
      is_success: '是否成功',
      created_at: '创建时间',
      params: '参数详情'
    }
  },
  usersLoginLog: {
    filter: {userName: '操作人昵称', account: '登录账号', loginType: '登录类型', ip: 'IP地址', platform: '平台', is_success: '登录状态', date: '日期范围'},
    table: {
      user_name: '操作人昵称',
      account: '登录账号',
      loginType: '登录类型',
      platform: '平台',
      ip: 'IP地址',
      ua: 'User Agent',
      is_success: '是否成功',
      reason: '原因',
      created_at: '创建时间'
    }
  },
  user: {
    tabs: {
      userList: '用户列表',
      sessionList: '会话管理'
    },
    filter: {
      username: '用户名',
      email: '邮箱',
      role: '权限',
      sex: '性别',
      address: '地址',
      detail_address: '详细地址'
    },
    table: {
      id: '用户ID',
      username: '用户名',
      avatar: '头像',
      phone: '手机号',
      sex: '性别',
      email: '邮箱',
      role: '角色',
      address: '地址',
      desc: '个人简介',
      expires_in: 'token过期时间',
      is_expired: 'token是否过期'
    },
    batchEdit: {
      field: '字段'
    }
  },
  userSession: {
    stats: {
      totalActive: '在线会话',
      adminOnline: '后台在线',
      appOnline: 'APP在线'
    },
    filter: {
      username: '用户名',
      platform: '平台',
      status: '状态'
    },
    table: {
      username: '用户名',
      platform: '平台',
      device_id: '设备ID',
      ip: 'IP地址',
      last_seen_at: '最后活跃',
      expires_at: '过期时间',
      status: '状态'
    },
    status: {
      active: '活跃',
      expired: '已过期',
      revoked: '已撤销'
    },
    confirmKick: '确定要踢该会话下线吗？',
    confirmBatchKick: '确定要批量踢选中的 {count} 个会话下线吗？',
    batchKick: '批量踢下线'
  },
  role: {
    filter: { name: '名称' },
    table: { id: 'ID', name: '名称', is_default: '默认角色', created_at: '创建时间', updated_at: '更新时间' },
    form: { permission: '权限' },
    confirmSetDefault: '确定设置为默认角色吗？',
    actions: { setDefault: '设为默认' }
  },
  permission: {
    filter: { name: '名称' },
    table: {
      id: 'ID',
      name: '名称',
      path: '路径',
      icon: '图标',
      component: '组件',
      status: '是否启用',
      type: '类型',
      sort: '排序',
      code: 'CODE',
      i18n_key: 'I18N_KEY',
      actions: '操作'
    },
    form: {
      show_menu: '菜单显示',
      type: '类型',
      parent_id: '父级菜单',
      name: '名称',
      i18n_key: 'i18n_key',
      sort: '排序',
      icon: 'ICON',
      path: '路由',
      component: 'component',
      code: 'code',
      placeholder: {
        name: '请输入名称',
        i18n_key: '请输入 i18n_key',
        path: '请输入路由地址',
        component: '请输入组件路径',
        code: '请输入 code'
      },
      rule: {
        type: '请选择类型',
        name: '请输入名称',
        i18n_key: '请输入 i18n_key',
        code: '请输入 code',
        show_menu: '请选择是否显示'
      },
      help: {
        component: '示例：user/userManager（文件路径，不带 /）',
        path: '应为 "/" + component，如：/user/userManager',
        i18n_key: '格式：menu.[parent]_[current]，如：menu.user_userManager'
      },
      codeHint: '命名规范：模块_操作，如 profile_edit、scan_submit'
    }
  },
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
        endpoint: 'Endpoint',
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
        endpoint: 'Endpoint',
        bucket_domain: '访问域名',
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
  aiModels: {
    filter: { name: '模型名称', driver: '驱动', status: '状态' },
    table: {
      name: '模型名称',
      driver: '驱动',
      model_code: '模型标识',
      endpoint: '接口地址',
      api_key_hint: 'API Key',
      default_params: '默认参数',
      modalities: '多模态能力',
      status: '状态',
      created_at: '创建时间',
      updated_at: '更新时间'
    },
    form: {
      name: '模型名称',
      driver: '驱动',
      model_code: '模型标识',
      endpoint: '接口地址',
      api_key: 'API Key',
      default_params: '默认参数',
      status: '状态',
      modalities: '多模态能力',
      modalitiesHint: '选择该模型支持的输入类型',
      image: '图片',
      audio: '音频',
      video: '视频',
      file: '文件',
      modelCodePlaceholder: '如 gpt-4o / qwen-turbo',
      endpointPlaceholder: '可留空，使用驱动默认地址',
      apiKeyPlaceholder: '输入API Key',
      apiKeyEditPlaceholder: '留空则不修改',
      invalidJson: '默认参数必须为合法JSON'
    },
    addTitle: '新增AI模型',
    editTitle: '编辑AI模型',
    invalidJson: '默认参数必须为合法JSON'
  },
  aiAgents: {
    filter: { name: '智能体名称', model_id: '关联模型', mode: '模式', status: '状态' },
    table: {
      name: '智能体名称',
      model_name: '关联模型',
      mode: '模式',
      avatar: '头像',
      system_prompt: '系统提示词',
      temperature: '温度',
      max_tokens: '最大输出',
      status: '状态',
      scene: '场景',
      created_at: '创建时间'
    },
    form: {
      name: '智能体名称',
      model_id: '关联模型',
      avatar: '头像',
      system_prompt: '系统提示词',
      mode: '模式',
      temperature: '温度',
      max_tokens: '最大输出',
      extra_params: '额外参数',
      status: '状态',
      scene: '场景',
      systemPromptPlaceholder: '设定智能体的角色和行为',
      invalidJson: '额外参数必须为合法JSON'
    },
    addTitle: '新增智能体',
    editTitle: '编辑智能体',
    deleted: '已删除'
  },
  aiChat: {
    newConversation: '新建对话',
    rename: '重命名',
    delete: '删除',
    send: '发送',
    inputPlaceholder: '输入你想问的问题…',
    noConversation: '暂无对话',
    selectConversation: '请选择或新建一个对话',
    untitled: '未命名对话',
    confirmDelete: '确定删除该对话吗？',
    renameTitle: '重命名对话',
    newTitle: '新标题',
    selectAgent: '选择智能体',
    you: '你',
    assistant: '助手',
    welcome: '你好，有什么可以帮你的？',
    welcomeTip: '直接输入消息开始对话',
    copyMessage: '复制',
    deleteMessage: '删除',
    regenerate: '重新生成',
    copied: '已复制到剪贴板',
    confirmDeleteMessage: '确定删除这条消息吗？',
    noDescription: '暂无描述',
    noAgentTip: '暂无可用智能体，请先在设置中配置',
    // 图片上传相关
    uploadImage: '上传图片',
    uploadFailed: '上传失败',
    waitUpload: '请等待图片上传完成',
    uploadHasError: '有图片上传失败，请删除后重试',
    networkError: '上传失败，请检查网络连接',
    tokenError: '获取上传凭证失败',
    modelNotSupportImage: '当前模型不支持图片输入',
    maxImagesReached: '最多只能上传 {max} 张图片',
    // 输入框提示
    inputHint: 'Enter 发送，Shift + Enter 换行',
    inputHintImage: '，支持粘贴/拖拽图片',
    selectAgentFirst: '请先选择智能体',
    // 消息操作
    copyFailed: '复制失败',
    sendFailed: '发送失败',
    regenerateFailed: '重新生成失败',
    userMessageNotFound: '找不到对应的用户消息',
    stopFailed: '停止失败',
    // 加载状态
    loading: '加载中...',
    noMoreHistory: '没有更多历史消息了',
    // 归档
    archived: '已归档',
    unarchived: '已取消归档',
    // 会话列表
    tabNormal: '正常',
    tabArchive: '归档',
    doArchive: '归档',
    doUnarchive: '取消归档',
    startNewChat: '开始一个新对话吧',
    noMoreConversations: '没有更多会话了',
    searchPlaceholder: '搜索会话...',
    editMessage: '编辑',
    editSubmit: '保存并重新生成',
    editFailed: '编辑失败',
    like: '赞',
    dislike: '踩',
    // 时间分组
    timeGroup: {
      today: '今天',
      yesterday: '昨天',
      lastWeek: '最近7天',
      lastMonth: '最近30天',
      older: '更早'
    },
    // 智能体列表
    agentList: '智能体',
    noAgent: '暂无智能体',
    // 历史会话
    historyConversations: '历史会话',
    currentAgent: '当前智能体',
    // 语音输入
    voiceInput: '语音输入',
    voiceNotSupported: '当前浏览器不支持语音识别',
    voiceNoSpeech: '未检测到语音，请重试',
    voiceDenied: '麦克风权限被拒绝',
    voiceError: '语音识别失败',
    voiceRecording: '正在识别语音，点击停止',
    // Emoji
    insertEmoji: '插入表情'
  },
  aiRuns: {
    filter: {
      status: '状态',
      agent: '智能体',
      user: '用户',
      request_id: 'Request ID',
      dateRange: '日期范围',
      date_start: '开始日期',
      date_end: '结束日期'
    },
    table: {
      request_id: 'Request ID',
      agent: '智能体',
      conversation: '会话',
      status: '状态',
      model: '模型',
      tokens: 'Tokens',
      latency: '耗时',
      error: '错误信息',
      created_at: '创建时间'
    },
    detail: {
      title: '运行详情',
      user: '用户',
      agent: '智能体',
      conversation: '会话',
      status: '状态',
      model: '模型',
      promptTokens: 'Prompt Tokens',
      completionTokens: 'Completion Tokens',
      totalTokens: 'Total Tokens',
      latency: '耗时',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      error: '错误信息',
      userMessage: '用户消息',
      assistantMessage: 'AI 回复',
      executionSteps: '执行步骤',
      fetchFailed: '获取详情失败'
    },
    tabs: {
      list: '运行列表',
      stats: '统计分析'
    },
    stats: {
      dateRange: '日期范围',
      startDate: '开始日期',
      endDate: '结束日期',
      overview: '概览',
      totalRuns: '总请求数',
      successRate: '成功率',
      failRuns: '失败数',
      totalTokens: '总 Tokens',
      promptTokens: '输入 Tokens',
      completionTokens: '输出 Tokens',
      avgLatency: '平均耗时',
      totalCost: '总成本',
      byDate: '按日期',
      byAgent: '按智能体',
      byUser: '按用户',
      date: '日期',
      agent: '智能体',
      user: '用户',
      runs: '请求',
      tokens: 'Tokens',
      input: '输入',
      output: '输出',
      latency: '耗时',
      noData: '暂无统计数据'
    }
  },
  aiPrompt: {
    title: '提示词管理',
    search: '搜索标题/分类/标签',
    add: '新增',
    addTitle: '新增提示词',
    editTitle: '编辑提示词',
    empty: '暂无提示词',
    useCount: '使用 {count} 次',
    use: '使用',
    form: {
      title: '标题',
      titlePlaceholder: '提示词名称',
      content: '内容',
      contentPlaceholder: '提示词内容',
      category: '分类',
      categoryPlaceholder: '如：开发、写作、翻译',
      tags: '标签',
      tagsPlaceholder: '多个标签用逗号分隔'
    }
  },
  codeGen: {
    title: '代码生成器',
    helpButton: '使用帮助',
    steps: {
      selectTable: '选择表',
      configFields: '配置字段',
      previewCode: '预览代码'
    },
    form: {
      selectTable: '选择表',
      selectTablePlaceholder: '请选择表',
      moduleName: '模块名',
      moduleNamePlaceholder: '如 Article（大驼峰）',
      domain: '业务域',
      domainPlaceholder: '选择业务域',
      menuName: '菜单名称',
      menuNamePlaceholder: '显示在菜单的名称',
      routePath: '路由路径',
      routePathPlaceholder: '如 /article'
    },
    table: {
      columnName: '字段名',
      comment: '注释',
      dataType: '类型',
      showInList: '列表显示',
      showInSearch: '搜索条件',
      showInForm: '表单显示',
      formType: '表单类型'
    },
    formTypes: {
      input: '文本框',
      password: '密码框',
      number: '数字',
      textarea: '文本域',
      editor: '富文本',
      select: '下拉框',
      date: '日期',
      datetime: '日期时间',
      image: '图片上传'
    },
    actions: {
      prevStep: '上一步',
      nextStep: '下一步',
      generate: '生成代码',
      iKnow: '我知道了'
    },
    messages: {
      selectTableRequired: '请选择表',
      moduleNameRequired: '请输入模块名',
      generateConfirm: '确定生成代码吗？已存在的文件将被跳过。',
      generateSuccess: '成功生成 {count} 个文件',
      generateSkipped: '跳过 {count} 个已存在的文件'
    },
    help: {
      quickStart: '快速开始',
      quickStartDesc: '代码生成器可以根据数据库表结构，自动生成完整的 CRUD 代码（后端 + 前端）。',
      usageSteps: '使用步骤',
      step1: '第一步：选择表',
      step1Desc: '选择数据库表，配置模块名、业务域等基本信息',
      step2: '第二步：配置字段',
      step2Desc: '勾选字段在列表、搜索、表单中的显示，选择表单类型',
      step3: '第三步：预览生成',
      step3Desc: '预览生成的代码，确认无误后点击生成',
      configDesc: '配置说明',
      moduleNameDesc: '大驼峰格式，如 Article、UserProfile',
      domainDesc: '代码所属的业务模块，如 System、User、Ai',
      menuNameDesc: '显示在前端菜单的名称',
      routePathDesc: '前端路由地址，如 /system/article',
      fieldConfig: '字段配置',
      showInListDesc: '勾选后该字段会在列表页显示',
      showInSearchDesc: '勾选后可以按该字段搜索（支持模糊查询）',
      showInFormDesc: '勾选后该字段会在新增/编辑表单中显示',
      formTypeDesc: '选择合适的表单控件类型',
      formTypeExamples: '表单类型说明',
      formTypeTable: {
        type: '类型',
        desc: '说明',
        example: '适用场景'
      },
      generatedFiles: '生成的文件',
      backendFiles: '后端文件：',
      controller: 'Controller - 控制器（路由入口）',
      module: 'Module - 业务逻辑层',
      dep: 'Dep - 数据访问层',
      model: 'Model - 数据模型',
      validate: 'Validate - 验证规则',
      frontendFiles: '前端文件：',
      api: 'API - 接口定义',
      vue: 'Vue - 页面组件（列表、搜索、表单）',
      notices: '注意事项',
      notice1: '生成代码后需要手动添加路由到 routes/admin.php',
      notice2: '需要在数据库中创建菜单和权限',
      notice3: '如果表单有下拉选择，需要在 Module 的 init() 方法中配置字典数据',
      notice4: '已存在的文件不会被覆盖，如需重新生成请先删除旧文件',
      bestPractices: '最佳实践',
      practice1: '表名使用小写+下划线，如 user_profile',
      practice2: '字段添加清晰的注释，会自动作为表单 label',
      practice3: '必填字段设置 NOT NULL 约束',
      practice4: '使用标准字段名：is_del, created_at, updated_at',
      practice5: '状态字段：1=启用/是，2=禁用/否'
    }
  },
  queueMonitor: {
    title: '队列监控',
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
    handler: '处理类',
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
      handler: '处理类',
      handlerPlaceholder: '如：app\\process\\CleanExportTask',
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
  tauriVersion: {
    version: '版本号',
    platform: '平台',
    notes: '更新说明',
    fileSize: '文件大小',
    isLatest: '最新版本',
    forceUpdate: '强制更新',
    latest: '最新',
    setLatest: '设为最新',
    setLatestConfirm: '确定将 {version} 设为最新版本吗？',
    setForce: '设为强制',
    cancelForce: '取消强制',
    setForceConfirm: '确定将 {version} 设为强制更新吗？',
    cancelForceConfirm: '确定取消 {version} 的强制更新吗？',
    download: '下载',
    viewUpdateJson: '查看 update.json',
    addVersion: '发布新版本',
    bytes: '字节',
    form: {
      version: '版本号',
      platform: '平台',
      fileUrl: '文件地址',
      signature: '签名',
      notes: '更新说明',
      notesPlaceholder: '本次更新内容...',
      fileSize: '文件大小',
      forceUpdate: '强制更新'
    },
    signature: {
      dropHint: '拖拽 .sig 文件到此处，或点击选择文件',
      acceptTip: '仅支持 .sig 签名文件',
      placeholder: '或在此手动粘贴签名内容...',
      or: '或手动输入',
      reUpload: '重新上传',
      clear: '清空',
      onlySig: '仅支持 .sig 格式文件'
    }
  },
  updater: {
    title: '版本更新',
    newVersion: '发现新版本 {version}，是否立即更新？',
    updateNow: '立即更新',
    later: '稍后',
    updating: '更新中',
    downloading: '正在下载更新，请稍候...'
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
  chat: {
    tabs: { chat: '聊天', contacts: '联系人' },
    createGroup: '创建群聊',
    groupName: '群名称',
    groupNamePlaceholder: '请输入群名称',
    selectFriends: '选择好友',
    selectFriendsPlaceholder: '请选择好友（至少1人）',
    selectContact: '选择一个联系人查看资料',
    selectConversation: '选择一个会话开始聊天',
    sendMessage: '发消息',
    addedTime: '添加时间',
    online: '在线',
    offline: '离线',
    startChatFailed: '发起聊天失败'
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
  components: {
    upMedia: {
      imagePlaceholder: '或输入图片URL',
      videoPlaceholder: '或输入视频URL'
    }
  },
  error: {notFound: '抱歉，您访问的页面不存在'},
  systemLog: {
    sidebar: { title: '日志文件', empty: '暂无日志文件' },
    toolbar: { keyword: '搜索关键字', level: '日志级别', query: '查询', refresh: '刷新', autoScroll: '自动滚底', lines: '行' },
    empty: '暂无日志内容',
    error: { loadFiles: '加载文件列表失败', loadContent: '加载日志内容失败' }
  },
  goods: {
    filter: { title: '商品标题', platform: '平台', status: '状态' },
    table: {
      title: '商品标题', main_img: '主图', platform: '平台',
      status: '状态', audio_url: '音频'
    },
    form: {
      title: '商品标题', main_img: '商品主图URL',
      link: '商品链接', tips: '提示词', point: '卖点', script_text: '口播词'
    },
    actions: { generate: '生成口播', selectProduct: '去选品' },
    editTitle: '编辑商品', detailTitle: '商品详情',
    platform: { title: '选品平台', hint: '打开平台后，使用浏览器插件抓取商品数据' },
    detail: { ocrResult: '识别结果', images: '详情图片', productInfo: '商品信息',
      promptEng: 'AI提示词工程', sellingPoints: '生成卖点', sellingPointsHint: 'AI生成的核心卖点，可手动编辑',
      finalScript: '最终卖点效应，口播词', finalScriptHint: 'AI生成的口播词，可手动编辑调整',
      modelOrigin: 'AI原始输出' },
    meta: {
      title: '采集元数据', hint: '由爬虫自动采集，可能不准确，可手动修正',
      placeholder: '每行一条，格式：字段名: 值\n如：价格: 58\n销量: 已售 1万+',
      price: '价格', originalPrice: '原价', sales: '销量', brand: '品牌',
      shop: '店铺', specs: '规格', description: '描述', reviews: '评论'
    },
    ocr: {
      title: 'OCR图片识别', hint: '点击选择需要识别的图片，选中后点击开始识别',
      selectImages: '请至少选择一张图片', start: '开始识别',
      imagesSelected: '张已选', previousResult: '上次识别结果',
      submitted: 'OCR任务已提交', buttonText: 'OCR识别（{count}张已选）'
    },
    generate: {
      title: 'AI生成口播词', noOcr: '暂无OCR结果，建议先进行图片识别',
      tipsPlaceholder: '可选，例如：突出性价比、强调限时优惠、语气活泼等', start: '开始生成',
      agent: '选择智能体', selectAgent: '请选择智能体',
      submitted: '生成任务已提交'
    },
    tts: {
      title: '语音合成', noScript: '请先填写口播词内容',
      placeholder: '输入或编辑口播词内容', start: '开始合成', currentAudio: '当前音频',
      voice: 'TTS音色', emotion: '情绪预设', submitted: 'TTS任务已提交'
    },
    srt: { download: '下载SRT字幕', noSrt: '暂无字幕文件' }
  },
  tabTag: {
    refresh: '刷新当前',
    fullscreen: '内容全屏',
    exitFullscreen: '退出全屏',
    close: '关闭',
    closeOther: '关闭其他',
    closeAll: '关闭所有'
  },
  download: {
    manager: '下载管理',
    noTasks: '暂无下载任务',
    completed: '下载完成',
    failed: '下载失败',
    cancelled: '已取消',
    cancel: '取消',
    openFolder: '打开文件夹',
    clearCompleted: '清除已完成',
    clearAll: '清空列表',
    confirmCancel: '确定要取消这个下载吗？',
    confirmClearAll: '确定要清空所有下载记录吗？',
    hint: '提示',
    savedTo: '已保存至',
    webNotSupported: 'Web环境不支持下载管理',
    userCancelled: '用户取消下载',
    folderOpened: '已打开文件夹',
    folderOpenFailed: '打开文件夹失败',
    clickToOpen: '点击打开文件夹',
    fileType: {
      pdf: 'PDF文档',
      word: 'Word文档',
      excel: 'Excel表格',
      archive: '压缩文件',
      image: '图片文件',
      video: '视频文件',
      audio: '音频文件',
      all: '所有文件'
    }
  },
  authPlatform: {
    filter: { name: '平台名称', status: '状态' },
    table: {
      code: '平台标识',
      name: '平台名称',
      login_types: '登录方式',
      access_ttl: 'Access TTL',
      refresh_ttl: 'Refresh TTL',
      bind_platform: '绑定平台',
      bind_device: '绑定设备',
      bind_ip: '绑定IP',
      single_session: '单端登录',
      max_sessions: '最大会话数',
      allow_register: '允许注册',
      status: '状态',
      created_at: '创建时间',
      updated_at: '更新时间'
    },
    form: {
      code: '平台标识',
      codePlaceholder: '小写字母开头，如 admin、app、mini',
      codeHelp: '创建后不可修改，用于请求头 platform 字段',
      name: '平台名称',
      namePlaceholder: '如：PC后台、H5/APP',
      login_types: '登录方式',
      access_ttl: 'Access Token 有效期（秒）',
      refresh_ttl: 'Refresh Token 有效期（秒）',
      bind_platform: '绑定平台',
      bind_device: '绑定设备',
      bind_ip: '绑定IP',
      single_session: '单端登录（互踢）',
      max_sessions: '最大会话数',
      max_sessions_help: '0 表示不限制',
      allow_register: '允许注册',
      section_basic: '基本信息',
      section_token: 'Token 策略',
      section_security: '安全策略'
    },
    addTitle: '新增认证平台',
    editTitle: '编辑认证平台',
    ttlFormat: {
      day: '天',
      hour: '小时',
      minute: '分钟'
    }
  }
}
