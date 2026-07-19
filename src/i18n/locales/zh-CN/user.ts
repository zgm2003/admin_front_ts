export default {
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
        saveBasic: '保存基本资料',
        resetBasic: '重置',
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
      },
    },
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
      },
      page: {
        eyebrow: '变更轨迹',
        description: '按时间追踪后台操作，动作、操作人、结果和请求/响应载荷在同一视线内完成扫描。',
        total: '已加载记录',
        totalHintMore: '下方还有更早的历史记录可继续加载',
        totalHintDone: '当前结果已全部加载完成',
        success: '成功操作',
        successHint: '当前视图成功率 {rate}%',
        failed: '失败操作',
        failedHintClear: '当前视图内没有失败操作',
        failedHintRisk: '当前视图内有 {count} 条失败操作待关注',
        payload: '载荷记录',
        filters: '筛选条件',
        filtersHintNone: '当前未启用额外筛选',
        filtersHintActive: '时间流已聚焦到目标范围',
        timeline: '操作时间流',
        timelineHint: '按日期自动分组，展开条目可查看请求与响应载荷。',
        loadedTag: '已加载 {count} 条记录',
        filterTag: '已启用 {count} 个筛选',
        empty: '当前筛选条件下暂无操作日志'
      },
      entry: {
        keys: '{count} 个字段',
        items: '{count} 条项目',
        payloadNone: '无请求或响应载荷'
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
      },
      page: {
        eyebrow: '访问轨迹',
        description: '按时间流梳理用户登录行为，让失败尝试、异常设备和筛选后的访问路径更容易被快速识别。',
        total: '已加载记录',
        totalHintMore: '下方还有更早的历史记录可继续加载',
        totalHintDone: '当前结果已全部加载完成',
        success: '成功登录',
        successHint: '当前视图成功率 {rate}%',
        failed: '失败登录',
        failedHintClear: '当前视图内没有失败登录',
        failedHintRisk: '当前视图内有 {count} 次失败登录待关注',
        filters: '筛选条件',
        filtersHintNone: '当前未启用额外筛选',
        filtersHintActive: '时间流已聚焦到目标范围',
        timeline: '登录时间流',
        timelineHint: '按日期自动分组，滚动到底部可继续加载更早记录。',
        loadedTag: '已加载 {count} 条记录',
        filterTag: '已启用 {count} 个筛选',
        empty: '当前筛选条件下暂无登录记录'
      }
    },
  user: {
      fallback: {
        username: '未设置用户名'
      },
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
        status: '状态',
        expires_in: 'token过期时间',
        is_expired: 'token是否过期'
      },
      batchEdit: {
        field: '字段'
      },
      warning: {
        fillComplete: '请填写完整信息'
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
    }
}
