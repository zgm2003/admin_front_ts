export default {
  auth: {
      login: {
        title: '登录',
        account: '账号',
        accountPlaceholder: '请输入邮箱/用户名/手机号',
        email: '邮箱',
        emailPlaceholder: '请输入邮箱',
        phone: '手机号',
        phonePlaceholder: '请输入手机号',
        password: '密码',
        passwordPlaceholder: '请输入密码',
        codePlaceholder: '请输入验证码',
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
        newPasswordPlaceholder: '请输入新密码',
        confirmPassword: '确认新密码',
        confirmPasswordPlaceholder: '请再次输入新密码',
        submit: '修改密码'
      },
      forget: {
        title: '忘记密码',
        account: '邮箱 / 手机号',
        accountPlaceholder: '请输入邮箱或手机号',
        email: '邮箱',
        code: '验证码',
        codePlaceholder: '6位验证码',
        newPassword: '新密码',
        submit: '修改密码',
        toEdit: '记得原来密码'
      }
    },
  loginPage: {
      form: {
        welcomeDesc: '登录智澜系统后台，继续高效管理',
        agreePrefix: '我已阅读并同意',
        serviceTerms: '服务条款',
        and: '和',
        privacyPolicy: '隐私政策',
        loggingIn: '登录中...'
      },
      policyConfirm: {
        title: '请确认服务条款与隐私政策',
        description: '登录前，请阅读并同意服务条款和隐私政策。仅本次登录页面有效。',
        cancel: '取消',
        confirm: '同意并继续'
      },
      brand: {
        logoAlt: '智澜系统 Logo',
        name: '智澜系统',
        tag: 'ZhiLan Admin System',
        titleLine1: '科技引领',
        titleHighlight: '赋能企业管理',
        description: '集先进技术与智能分析于一体，提供高效、安全、可扩展的企业级解决方案。',
        features: {
          secureTitle: '安全可靠',
          secureDesc: '企业级数据加密，符合国际安全标准',
          stableTitle: '高效稳定',
          stableDesc: '7×24小时稳定运行，确保业务连续性',
          smartTitle: '智能分析',
          smartDesc: '基于大数据分析，提供智能化决策支持'
        },
        stats: {
          trustedUsersValue: '50万+',
          trustedUsers: '信赖用户',
          satisfactionValue: '98.5%',
          satisfaction: '满意评价',
          enterpriseCustomersValue: '2,000+',
          enterpriseCustomers: '企业客户'
        }
      },
      forgot: {
        steps: {
          verify: '身份验证',
          reset: '重置密码'
        },
        next: '下一步',
        submit: '提交重置',
        submitting: '重置中...'
      },
      loading: {
        preparing: '正在为您准备工作台...'
      }
    },
  login: {
      validation: {
        accountRequired: '账号为必填项',
        emailInvalid: '请输入正确的邮箱格式',
        phoneInvalid: '请输入正确的手机号格式',
        passwordRequired: '密码为必填项',
        codeRequired: '验证码为必填项',
        captchaLoadFailed: '验证码加载失败，请重试',
        captchaConfigInvalid: '验证码配置异常',
        policyRequired: '请先阅读并同意服务条款和隐私政策',
        loginSuccess: '登录成功',
        termsHint: '请在系统设置页查看服务条款',
        privacyHint: '请在系统设置页查看隐私政策'
      }
    },
  forgotPassword: {
      validation: {
        accountRequired: '请输入邮箱或手机号',
        accountInvalid: '请输入正确的邮箱或手机号',
        codeSent: '验证码已发送',
        sendFailed: '发送失败',
        fullInfoRequired: '请填写完整信息',
        passwordRequired: '请填写新密码',
        passwordMismatch: '确认密码与新密码不一致',
        passwordLength: '密码长度必须在6到128个字符之间',
        resetSuccess: '密码重置成功，请登录',
        resetFailed: '重置失败'
      }
    },
  authPlatform: {
      filter: { name: '平台名称', status: '状态' },
      table: {
        code: '平台标识',
        name: '平台名称',
        login_types: '登录方式',
        captcha_type: '验证码类型',
        access_ttl: 'Access TTL',
        refresh_ttl: 'Refresh TTL',
        bind_platform: '绑定平台',
        bind_device: '绑定设备',
        bind_ip: '绑定IP',
        session_policy: '会话策略',
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
        captcha_type: '验证码类型',
        access_ttl: 'Access Token 有效期（秒）',
        refresh_ttl: 'Refresh Token 有效期（秒）',
        bind_platform: '绑定平台',
        bind_device: '绑定设备',
        bind_ip: '绑定IP',
        session_policy: '会话策略',
        allow_register: '允许注册',
        policy_notice: '该页面配置会直接影响登录、会话互踢和注册入口；新平台默认采用更严格的基线策略，请按真实业务场景再放宽。',
        section_basic: '基本信息',
        section_token: 'Token 策略',
        section_security: '安全策略'
      },
      sessionMode: {
        single: '单端登录',
        limited: '限制数量',
        unlimited: '不限制',
        limitedCount: '最多 {count} 个'
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
