export default {
  auth: {
    login: {
      title: '登录',
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
    confirmTitle: '二次确认',
    confirmDelete: '确定删除吗？',
    confirmBatchDelete: '确定批量删除选中记录吗？',
    selectAtLeastOne: '请至少选择一个记录',
    required: '为必填项',
    language: '语言', zh: '中文', en: '英文',
    actions: {
      add: '新增',
      edit: '编辑',
      del: '删除',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
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
    logs: '系统日志',
    test: '测试页',
    uploadConfig: '上传配置'
  },
  header: {
    projectConfig: '项目配置',
    theme: '主题',
    systemTheme: '系统主题',
    headerTheme: '头部主题',
    menuTheme: '菜单主题',
    display: '界面显示',
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
  log: {
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
  role: {filter: {name: '名称'}, table: {id: 'ID', name: '名称', created_at: '创建时间', updated_at: '更新时间'}},
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
    }
  },
  error: {notFound: '抱歉，您访问的页面不存在'}
}
