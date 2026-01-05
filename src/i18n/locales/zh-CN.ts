export default {
  auth: {
    login: {
      title: '登录',
      account: '账号',
      accountPlaceholder: '请输入邮箱/用户名/手机号',
      email: '邮箱',
      password: '密码',
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
    success: {
      login: '登录成功',
      register: '注册成功',
      editPassword: '修改成功',
      sendCode: '发送成功（长时间没收到检查垃圾箱┭┮﹏┭┮）',
      operation: '操作成功'
    },
    fail: {
      login: '登录失败'
    },
    confirmTitle: '二次确认',
    confirmDelete: '确定删除吗？',
    confirmKick: '确定要踢该用户下线吗？',
    confirmBatchDelete: '确定批量删除选中记录吗？',
    confirmStatusChange: '确定变更启用状态吗？',
    selectAtLeastOne: '请至少选择一个记录',
    required: '为必填项',
    lengthRange: '长度应在 {min} 到 {max} 个字符',
    notSpace: '不能包含空格',
    notSpecialCharacters: '不能包含特殊字符',
    notEqual: '两次输入不一致',
    emailError: '邮箱格式不正确',
    mobileError: '手机号格式不正确',
    urlError: 'URL格式不正确',
    language: '语言', zh: '中文', en: '英文',
    status: {
      show: '显示',
      hide: '隐藏'
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
      batchEdit: '批量修改',
      action: '操作'
    },
    quickEntry: '快速入口'
  },
  menu: {
    home: '首页',
    user: '用户',
    system: '系统管理',
    userManager: '用户管理',
    role: '角色管理',
    permission: '菜单管理',
    operationLog: '操作日志',
    usersLoginLog: '登录日志',
    test: '测试页',
    uploadConfig: '上传配置',
    systemSetting: '系统设置',
    personal: '个人资料',
    component: '组件演示',
    component_upload: '上传',
    component_form: '表单',
    component_display: '展示',
    component_effect: '特效',
    ai: 'AI助手',
    ai_models: '模型配置',
    ai_agents: '智能体',
    ai_chat: '对话',
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
    logout: '退出登录'
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
      created_at: '创建时间'
    }
  },
  usersLoginLog: {
    filter: {userName: '操作人昵称', account: '登录账号', loginType: '登录类型', ip: 'IP地址', platform: '平台', date: '日期范围'},
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
    }
  },
  role: {
    filter: { name: '名称' },
    table: { id: 'ID', name: '名称', is_default: '默认角色', created_at: '创建时间', updated_at: '更新时间' },
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
      }
    }
  },
  upload: {
    tabs: { driver: '上传驱动', rule: '上传规则', setting: '上传设置' },
    driver: {
      filter: { driver: '驱动' },
      table: {
        driver: '驱动',
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
      status: '状态'
    },
    addTitle: '新增AI模型',
    editTitle: '编辑AI模型'
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
      status: '状态'
    },
    addTitle: '新增智能体',
    editTitle: '编辑智能体'
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
    confirmDeleteMessage: '确定删除这条消息吗？'
  },
  error: {notFound: '抱歉，您访问的页面不存在'}
}
