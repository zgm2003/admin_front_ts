export default {
  auth: {
    login: {
      title: 'Sign In',
      account: 'Account',
      accountPlaceholder: 'Email/Username/Phone',
      email: 'Email',
      password: 'Password',
      passwordPlaceholder: 'Enter password',
      remember: 'Remember me',
      submit: 'Sign In',
      toRegister: 'Register',
      toForget: 'Forgot password?'
    },
    register: {
      title: 'Register',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      code: 'Verification Code',
      sendCode: 'Send Code',
      resend: 'Resend in {timer}s',
      submit: 'Register',
      toLogin: 'Already have an account? Sign In'
    },
    edit: {
      title: 'Change Password',
      oldPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      submit: 'Change Password'
    },
    forget: {
      title: 'Forgot Password',
      email: 'Email',
      code: 'Verification Code',
      newPassword: 'New Password',
      submit: 'Change Password',
      toEdit: 'I remember old password'
    }
  },
  common: {
    back: 'Back',
    index: 'Index',
    to: 'to',
    success: {
      login: 'Signed in successfully',
      register: 'Registered successfully',
      editPassword: 'Password updated',
      sendCode: 'Code sent successfully',
      operation: 'Operation successful',
      delete: 'Deleted successfully',
      copy: 'Copied successfully'
    },
    fail: {
      login: 'Login Failed',
      operation: 'Operation Failed',
      copy: 'Copy failed'
    },
    confirmTitle: 'Confirmation',
    confirmDelete: 'Are you sure you want to delete?',
    confirmKick: 'Are you sure you want to kick this user offline?',
    confirmBatchDelete: 'Delete all selected records?',
    confirmStatusChange: 'Change enabled status?',
    selectAtLeastOne: 'Please select at least one record',
    export: {
      submitted: 'Export task submitted, you will be notified when complete',
    },
    required: 'is required',
    lengthRange: 'Length should be between {min} and {max}',
    notSpace: 'Should not contain spaces',
    notSpecialCharacters: 'Should not contain special characters',
    notEqual: 'Inputs do not match',
    emailError: 'Invalid email format',
    mobileError: 'Invalid mobile number format',
    urlError: 'Invalid URL format',
    yes: 'Yes',
    no: 'No',
    language: 'Language', zh: 'Chinese', en: 'English',
    status: {
      show: 'Show',
      hide: 'Hide',
      enabled: 'Enabled',
      disabled: 'Disabled'
    },
    actions: {
      add: 'Add',
      edit: 'Edit',
      del: 'Delete',
      enable: 'Enable',
      disable: 'Disable',
      kick: 'Kick Offline',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      copy: 'Copy',
      query: 'Query',
      export: 'Export',
      batchAction: 'Batch Actions',
      batchDelete: 'Batch Delete',
      expandAll: 'Expand All',
      collapseAll: 'Collapse All',
      batchEdit: 'Batch Edit',
      action: 'Actions',
      detail: 'Detail',
      view: 'View',
      close: 'Close',
      expand: 'Expand',
      collapse: 'Collapse',
      selectAll: 'Select All',
      refresh: 'Refresh'
    },
    quickEntry: 'Quick Entry',
    welcomeBack: 'Welcome back',
    welcomeSubtitle: 'Another productive day ahead',
    personalSettings: 'Settings',
    loadMore: 'Load More',
    loading: 'Loading...',
    scrollLoadMore: 'Scroll to load more',
    noMore: 'No more data',
    noData: 'No data',
    createdAt: 'Created At',
    startDate: 'Start Date',
    endDate: 'End Date',
    pleaseSelect: 'Please select a record first',
    placeholder: {
      leaveEmpty: 'Leave empty to keep unchanged'
    },
    setting: 'Setting'
  },
  home: {
    quickEntry: 'Quick Entry',
    quickEntrySetting: 'Quick Entry Settings',
    noQuickEntry: 'Click settings to add quick entries',
    addQuickEntry: 'Add Quick Entry'
  },
  menu: {
    home: 'Home',
    // Level 1 menus
    user: 'User',
    permissionMgmt: 'Permission',
    system: 'System',
    component: 'Components',
    ai: 'AI Assistant',
    devTools: 'Dev Tools',
    // Standalone pages
    personal: 'Personal',
    notification: 'Notifications',
    test: 'Test',
    // User module
    user_userManager: 'User Manager',
    user_usersLoginLog: 'Login Log',
    // Permission module
    permission_permission: 'Admin Menu Manager',
    permission_role: 'Role Manager',
    // System module
    system_operationLog: 'Operation Log',
    system_uploadConfig: 'Upload Config',
    system_setting: 'System Settings',
    system_authPlatform: 'Auth Platform',
    system_test: 'Test',
    system_notificationTask: 'Notifications',
    system_log: 'System Log',
    // Component module
    component_upload: 'Upload',
    component_download: 'Download Manager',
    component_form: 'Form',
    component_display: 'Display',
    component_effect: 'Effect',
    // AI module
    ai_models: 'Models',
    ai_agents: 'Agents',
    ai_chat: 'Chat',
    ai_runs: 'Run Monitor',
    ai_prompt: 'Prompts',
    ai_goods: 'E-commerce Script',
    // DevTools module
    devTools_gen: 'Code Generator',
    devTools_queueMonitor: 'Queue Monitor',
    devTools_operationLog: 'Operation Log',
    // Chat
    chat: 'Chat Room',
    devTools_exportTask: 'Export Tasks',
    devTools_cronTask: 'Scheduled Tasks',
    devTools_tauriVersion: 'Version Management',
  },
  personal: {
    title: 'Personal Info',
    username: 'Username',
    email: 'Email',
    phone: 'Phone',
    sex: 'Gender',
    role: 'Role',
    passwordStatus: 'Password Status',
    bio: 'Bio',
    notSet: 'Not Set',
    noBio: 'No bio yet',
    unknown: 'Unknown',
    set: 'Set',
    tabs: {
      basic: 'Basic Info',
      security: 'Account & Security',
      loginLog: 'Login Log',
      operationLog: 'Operation Log'
    },
    log: {
      recentLoginDesc: 'Recent 5 login records',
      recentOperationDesc: 'Recent 5 operation records',
      noData: 'No records'
    },
    form: {
      avatar: 'Avatar',
      username: 'Username',
      usernamePlaceholder: 'Enter username',
      sex: 'Gender',
      sexPlaceholder: 'Select gender',
      birthday: 'Birthday',
      birthdayPlaceholder: 'Select date',
      address: 'Address',
      addressPlaceholder: 'Select address',
      detailAddress: 'Detail Address',
      bio: 'Bio',
      bioPlaceholder: 'Enter content',
      saveBasic: 'Save Basic Info'
    },
    security: {
      phone: 'Phone',
      email: 'Email',
      password: 'Login Password',
      bound: 'Bound',
      unbound: 'Unbound',
      notBound: 'Not bound yet',
      changePhone: 'Change Phone',
      bindPhone: 'Bind Phone',
      changeEmail: 'Change Email',
      bindEmail: 'Bind Email',
      newPhone: 'New Phone',
      newPhonePlaceholder: 'Enter new phone number',
      newEmail: 'New Email',
      newEmailPlaceholder: 'Enter new email',
      code: 'Code',
      codePlaceholder: 'Enter verification code',
      getCode: 'Get Code',
      retryAfter: 'Retry in {timer}s',
      save: 'Save',
      changePassword: 'Change Password',
      setPassword: 'Set Password',
      passwordTip: 'Set password to enable password login',
      oldPassword: 'Current Password',
      oldPasswordPlaceholder: 'Enter current password',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter new password (min 6 chars)',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Enter new password again',
      forgetOldPassword: 'Forgot password? Use verification code',
      rememberOldPassword: 'Remember password? Use password',
      codeSendTo: 'Code will be sent to',
      warning: {
        enterNewPhone: 'Please enter new phone number',
        enterNewEmail: 'Please enter new email',
        fillComplete: 'Please fill in all required fields',
        enterNewPassword: 'Please enter new password',
        passwordNotMatch: 'Passwords do not match',
        passwordMinLength: 'Password must be at least 6 characters',
        enterOldPassword: 'Please enter current password',
        enterCode: 'Please enter verification code',
        bindAccountFirst: 'Please bind email or phone first'
      }
    }
  },
  header: {
    projectConfig: 'Project Settings',
    theme: 'Theme',
    settings: 'Settings',
    search: 'Search',
    downloads: 'Downloads',
    systemTheme: 'System Theme',
    headerTheme: 'Header Theme',
    menuTheme: 'Menu Theme',
    display: 'Display',
    transition: 'Page Transitions',
    transitionEnable: 'Enable Transitions',
    transitionType: 'Transition Type',
    breadcrumb: 'Breadcrumb',
    hamburger: 'Hamburger',
    fullscreen: 'Fullscreen',
    tab: 'Tab',
    uniqueOpen: 'Accordion',
    footer: 'Footer',
    clearAndReset: 'Clear cache and reset',
    resetLight: 'Reset Light',
    resetDark: 'Reset Dark',
    logoutTitle: 'Reminder',
    logoutText: 'Exit the system?',
    cancel: 'Cancel',
    ok: 'OK',
    personal: 'Personal',
    logout: 'Logout',
    layoutSingle: 'Single Column',
    layoutDouble: 'Double Column'
  },
  search: {
    placeholder: 'Search pages by name or path',
    wake: 'Toggle search panel',
    navigate: 'Navigate results',
    enter: 'Open page',
    esc: 'Close search panel',
    empty: 'No matches'
  },
  footer: {copyright: 'Copyright© Zhilang · AI Cloud-Native High-Concurrency Workflow Platform'},
  operationLog: {
    filter: {userName: 'Operator Name', userEmail: 'Operator Email', action: 'Action', date: 'Date Range'},
    table: {
      id: 'ID',
      user_name: 'Operator Name',
      user_email: 'Operator Email',
      action: 'Action',
      request_data: 'Request',
      response_data: 'Response',
      is_success: 'Success',
      created_at: 'Created At',
      params: 'Parameters'
    }
  },
  usersLoginLog: {
    filter: {userName: 'Operator Name', account: 'Account', loginType: 'Login Type', ip: 'IP Address', platform: 'Platform', is_success: 'Login Status', date: 'Date Range'},
    table: {
      user_name: 'Operator Name',
      account: 'Account',
      loginType: 'Login Type',
      platform: 'Platform',
      ip: 'IP Address',
      ua: 'User Agent',
      is_success: 'Success',
      reason: 'Reason',
      created_at: 'Created At'
    }
  },
  user: {
    tabs: {
      userList: 'User List',
      sessionList: 'Session Manager'
    },
    filter: {
      username: 'Username',
      email: 'Email',
      role: 'Role',
      sex: 'Sex',
      address: 'Address',
      detail_address: 'Detail Address'
    },
    table: {
      id: 'User ID',
      username: 'Username',
      avatar: 'Avatar',
      phone: 'Phone',
      sex: 'Sex',
      email: 'Email',
      role: 'Role',
      address: 'Address',
      desc: 'Bio',
      expires_in: 'Token Expiration',
      is_expired: 'Token Expired'
    },
    batchEdit: {
      field: 'Field'
    }
  },
  userSession: {
    stats: {
      totalActive: 'Online Sessions',
      adminOnline: 'Admin Online',
      appOnline: 'App Online'
    },
    filter: {
      username: 'Username',
      platform: 'Platform',
      status: 'Status'
    },
    table: {
      username: 'Username',
      platform: 'Platform',
      device_id: 'Device ID',
      ip: 'IP Address',
      last_seen_at: 'Last Active',
      expires_at: 'Expires At',
      status: 'Status'
    },
    status: {
      active: 'Active',
      expired: 'Expired',
      revoked: 'Revoked'
    },
    confirmKick: 'Are you sure to kick this session offline?',
    confirmBatchKick: 'Are you sure to kick {count} selected sessions offline?',
    batchKick: 'Batch Kick'
  },
  role: {
    filter: {name: 'Name'},
    table: {id: 'ID', name: 'Name', is_default: 'Default Role', created_at: 'Created At', updated_at: 'Updated At'},
    form: { permission: 'Permissions' },
    confirmSetDefault: 'Set as default role?',
    actions: { setDefault: 'Set Default' }
  },
  permission: {
    filter: { name: 'Name' },
    table: {
      id: 'ID',
      name: 'Name',
      path: 'Path',
      icon: 'Icon',
      component: 'Component',
      status: 'Enabled',
      type: 'Type',
      sort: 'Sort',
      code: 'Code',
      i18n_key: 'I18N Key',
      actions: 'Actions'
    },
    form: {
      show_menu: 'Show in Menu',
      type: 'Type',
      parent_id: 'Parent Menu',
      name: 'Name',
      i18n_key: 'i18n_key',
      sort: 'Sort',
      icon: 'Icon',
      path: 'Route Path',
      component: 'Component Path',
      code: 'Code',
      placeholder: {
        name: 'Please enter name',
        i18n_key: 'Please enter i18n_key',
        path: 'Please enter route path',
        component: 'Please enter component path',
        code: 'Please enter code'
      },
      rule: {
        type: 'Please select type',
        name: 'Please enter name',
        i18n_key: 'Please enter i18n_key',
        code: 'Please enter code',
        show_menu: 'Please select show status'
      },
      help: {
        component: 'Example: user/userManager (file path without /)',
        path: 'Should be "/" + component, e.g., /user/userManager',
        i18n_key: 'Format: menu.{parent}_{current}, e.g., menu.user_userManager'
      },
      codeHint: 'Naming convention: module_action, e.g. profile_edit, scan_submit'
    }
  },
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
        endpoint: 'Endpoint',
        bucket_domain: 'Bucket Domain',
        created_at: 'Created At',
        updated_at: 'Updated At'
      },
      addTitle: 'Add Upload Driver',
      editTitle: 'Edit Upload Driver',
      form: {
        driver: 'Driver',
        bucket: 'Bucket',
        region: 'Region',
        endpoint: 'Endpoint',
        bucket_domain: 'Bucket Domain',
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
  aiModels: {
    filter: { name: 'Model Name', driver: 'Driver', status: 'Status' },
    table: {
      name: 'Model Name',
      driver: 'Driver',
      model_code: 'Model Code',
      endpoint: 'Endpoint',
      api_key_hint: 'API Key',
      default_params: 'Default Params',
      modalities: 'Modalities',
      status: 'Status',
      created_at: 'Created At',
      updated_at: 'Updated At'
    },
    form: {
      name: 'Model Name',
      driver: 'Driver',
      model_code: 'Model Code',
      endpoint: 'Endpoint',
      api_key: 'API Key',
      default_params: 'Default Params',
      status: 'Status',
      modalities: 'Modalities',
      modalitiesHint: 'Select supported input types for this model',
      image: 'Image',
      audio: 'Audio',
      video: 'Video',
      file: 'File'
    },
    addTitle: 'Add AI Model',
    editTitle: 'Edit AI Model'
  },
  aiAgents: {
    filter: { name: 'Agent Name', model_id: 'Model', mode: 'Mode', status: 'Status' },
    table: {
      name: 'Agent Name',
      model_name: 'Model',
      mode: 'Mode',
      avatar: 'Avatar',
      system_prompt: 'System Prompt',
      temperature: 'Temperature',
      max_tokens: 'Max Tokens',
      status: 'Status',
      created_at: 'Created At'
    },
    form: {
      name: 'Agent Name',
      model_id: 'Model',
      avatar: 'Avatar',
      system_prompt: 'System Prompt',
      mode: 'Mode',
      temperature: 'Temperature',
      max_tokens: 'Max Tokens',
      extra_params: 'Extra Params',
      status: 'Status'
    },
    addTitle: 'Add Agent',
    editTitle: 'Edit Agent'
  },
  aiChat: {
    newConversation: 'New Chat',
    rename: 'Rename',
    delete: 'Delete',
    send: 'Send',
    inputPlaceholder: 'Type your question...',
    noConversation: 'No conversations',
    selectConversation: 'Select or create a conversation',
    untitled: 'Untitled',
    confirmDelete: 'Are you sure to delete this conversation?',
    renameTitle: 'Rename Conversation',
    newTitle: 'New Title',
    selectAgent: 'Select Agent',
    you: 'You',
    assistant: 'Assistant',
    welcome: 'Hi, how can I help you?',
    welcomeTip: 'Type a message to start',
    copyMessage: 'Copy',
    deleteMessage: 'Delete',
    regenerate: 'Regenerate',
    copied: 'Copied to clipboard',
    confirmDeleteMessage: 'Are you sure to delete this message?',
    noDescription: 'No description',
    noAgentTip: 'No available agents, please configure in settings',
    // Image upload related
    uploadImage: 'Upload Image',
    uploadFailed: 'Upload failed',
    waitUpload: 'Please wait for image upload to complete',
    uploadHasError: 'Some images failed to upload, please remove and retry',
    networkError: 'Upload failed, please check network connection',
    tokenError: 'Failed to get upload credentials',
    modelNotSupportImage: 'Current model does not support image input',
    maxImagesReached: 'Maximum {max} images allowed',
    // Input hints
    inputHint: 'Enter to send, Shift + Enter for new line',
    inputHintImage: ', supports paste/drag images',
    selectAgentFirst: 'Please select an agent first',
    // Message actions
    copyFailed: 'Copy failed',
    sendFailed: 'Send failed',
    regenerateFailed: 'Regenerate failed',
    userMessageNotFound: 'Cannot find corresponding user message',
    stopFailed: 'Stop failed',
    // Loading states
    loading: 'Loading...',
    noMoreHistory: 'No more history',
    // Archive
    archived: 'Archived',
    unarchived: 'Unarchived',
    // Conversation list
    tabNormal: 'Active',
    tabArchive: 'Archived',
    doArchive: 'Archive',
    doUnarchive: 'Unarchive',
    startNewChat: 'Start a new conversation',
    noMoreConversations: 'No more conversations',
    searchPlaceholder: 'Search conversations...',
    editMessage: 'Edit',
    editSubmit: 'Save & Resend',
    editFailed: 'Edit failed',
    // Time groups
    timeGroup: {
      today: 'Today',
      yesterday: 'Yesterday',
      lastWeek: 'Last 7 Days',
      lastMonth: 'Last 30 Days',
      older: 'Older'
    },
    // Agent list
    agentList: 'Agents',
    noAgent: 'No agents available',
    // History conversations
    historyConversations: 'History',
    currentAgent: 'Current Agent'
  },
  aiRuns: {
    filter: {
      status: 'Status',
      agent: 'Agent',
      user: 'User',
      request_id: 'Request ID',
      dateRange: 'Date Range',
      date_start: 'Start Date',
      date_end: 'End Date'
    },
    table: {
      request_id: 'Request ID',
      agent: 'Agent',
      conversation: 'Conversation',
      status: 'Status',
      model: 'Model',
      tokens: 'Tokens',
      latency: 'Latency',
      error: 'Error',
      created_at: 'Created At'
    },
    detail: {
      title: 'Run Detail',
      user: 'User',
      agent: 'Agent',
      conversation: 'Conversation',
      status: 'Status',
      model: 'Model',
      promptTokens: 'Prompt Tokens',
      completionTokens: 'Completion Tokens',
      totalTokens: 'Total Tokens',
      latency: 'Latency',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      error: 'Error',
      userMessage: 'User Message',
      assistantMessage: 'AI Response',
      executionSteps: 'Execution Steps'
    },
    tabs: {
      list: 'Run List',
      stats: 'Statistics'
    },
    stats: {
      dateRange: 'Date Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      overview: 'Overview',
      totalRuns: 'Total Runs',
      successRate: 'Success Rate',
      failRuns: 'Failed',
      totalTokens: 'Total Tokens',
      promptTokens: 'Input Tokens',
      completionTokens: 'Output Tokens',
      avgLatency: 'Avg Latency',
      totalCost: 'Total Cost',
      byDate: 'By Date',
      byAgent: 'By Agent',
      byUser: 'By User',
      date: 'Date',
      agent: 'Agent',
      user: 'User',
      runs: 'Runs',
      tokens: 'Tokens',
      input: 'Input',
      output: 'Output',
      latency: 'Latency',
      noData: 'No statistics data'
    }
  },
  aiPrompt: {
    title: 'Prompt Management',
    search: 'Search title/category/tags',
    add: 'Add',
    addTitle: 'Add Prompt',
    editTitle: 'Edit Prompt',
    empty: 'No prompts yet',
    useCount: 'Used {count} times',
    use: 'Use',
    form: {
      title: 'Title',
      titlePlaceholder: 'Prompt name',
      content: 'Content',
      contentPlaceholder: 'Prompt content',
      category: 'Category',
      categoryPlaceholder: 'e.g. Development, Writing, Translation',
      tags: 'Tags',
      tagsPlaceholder: 'Multiple tags separated by commas'
    }
  },
  codeGen: {
    title: 'Code Generator',
    helpButton: 'Help',
    steps: {
      selectTable: 'Select Table',
      configFields: 'Configure Fields',
      previewCode: 'Preview Code'
    },
    form: {
      selectTable: 'Select Table',
      selectTablePlaceholder: 'Please select a table',
      moduleName: 'Module Name',
      moduleNamePlaceholder: 'e.g. Article (PascalCase)',
      domain: 'Domain',
      domainPlaceholder: 'Select domain',
      menuName: 'Menu Name',
      menuNamePlaceholder: 'Name shown in menu',
      routePath: 'Route Path',
      routePathPlaceholder: 'e.g. /article'
    },
    table: {
      columnName: 'Column',
      comment: 'Comment',
      dataType: 'Type',
      showInList: 'List',
      showInSearch: 'Search',
      showInForm: 'Form',
      formType: 'Form Type'
    },
    formTypes: {
      input: 'Text',
      password: 'Password',
      number: 'Number',
      textarea: 'Textarea',
      editor: 'Rich Text',
      select: 'Select',
      date: 'Date',
      datetime: 'DateTime',
      image: 'Image Upload'
    },
    actions: {
      prevStep: 'Previous',
      nextStep: 'Next',
      generate: 'Generate',
      iKnow: 'Got it'
    },
    messages: {
      selectTableRequired: 'Please select a table',
      moduleNameRequired: 'Please enter module name',
      generateConfirm: 'Generate code? Existing files will be skipped.',
      generateSuccess: 'Successfully generated {count} files',
      generateSkipped: 'Skipped {count} existing files'
    },
    help: {
      quickStart: 'Quick Start',
      quickStartDesc: 'The code generator creates complete CRUD code (backend + frontend) from database table structure.',
      usageSteps: 'Usage Steps',
      step1: 'Step 1: Select Table',
      step1Desc: 'Select a database table and configure module name, domain, etc.',
      step2: 'Step 2: Configure Fields',
      step2Desc: 'Toggle field visibility in list, search, and form; select form types',
      step3: 'Step 3: Preview & Generate',
      step3Desc: 'Preview generated code and click generate to confirm',
      configDesc: 'Configuration',
      moduleNameDesc: 'PascalCase format, e.g. Article, UserProfile',
      domainDesc: 'Business module the code belongs to, e.g. System, User, Ai',
      menuNameDesc: 'Name displayed in the frontend menu',
      routePathDesc: 'Frontend route path, e.g. /system/article',
      fieldConfig: 'Field Configuration',
      showInListDesc: 'When checked, the field will be shown in the list page',
      showInSearchDesc: 'When checked, the field can be used as a search filter (fuzzy match)',
      showInFormDesc: 'When checked, the field will appear in add/edit forms',
      formTypeDesc: 'Select the appropriate form control type',
      formTypeExamples: 'Form Type Reference',
      formTypeTable: {
        type: 'Type',
        desc: 'Description',
        example: 'Use Case'
      },
      generatedFiles: 'Generated Files',
      backendFiles: 'Backend files:',
      controller: 'Controller - Route entry point',
      module: 'Module - Business logic layer',
      dep: 'Dep - Data access layer',
      model: 'Model - Data model',
      validate: 'Validate - Validation rules',
      frontendFiles: 'Frontend files:',
      api: 'API - API definitions',
      vue: 'Vue - Page component (list, search, form)',
      notices: 'Notes',
      notice1: 'After generation, manually add routes to routes/admin.php',
      notice2: 'Create menu and permissions in the database',
      notice3: 'For select fields, configure dictionary data in Module init() method',
      notice4: 'Existing files will not be overwritten; delete old files to regenerate',
      bestPractices: 'Best Practices',
      practice1: 'Use lowercase + underscore for table names, e.g. user_profile',
      practice2: 'Add clear column comments — they become form labels automatically',
      practice3: 'Set NOT NULL constraints for required fields',
      practice4: 'Use standard fields: is_del, created_at, updated_at',
      practice5: 'Status fields: 1=enabled/yes, 2=disabled/no'
    }
  },
  queueMonitor: {
    title: 'Queue Monitor',
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
    handler: 'Handler',
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
      handler: 'Handler Class',
      handlerPlaceholder: 'e.g. app\\process\\CleanExportTask',
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
  tauriVersion: {
    version: 'Version',
    platform: 'Platform',
    notes: 'Release Notes',
    fileSize: 'File Size',
    isLatest: 'Latest',
    forceUpdate: 'Force Update',
    latest: 'Latest',
    setLatest: 'Set Latest',
    setLatestConfirm: 'Set {version} as the latest version?',
    setForce: 'Set Force',
    cancelForce: 'Cancel Force',
    setForceConfirm: 'Set {version} as force update?',
    cancelForceConfirm: 'Cancel force update for {version}?',
    download: 'Download',
    viewUpdateJson: 'View update.json',
    addVersion: 'New Release',
    bytes: 'bytes',
    form: {
      version: 'Version',
      platform: 'Platform',
      fileUrl: 'File URL',
      signature: 'Signature',
      notes: 'Release Notes',
      notesPlaceholder: 'What\'s new in this release...',
      fileSize: 'File Size',
      forceUpdate: 'Force Update'
    },
    signature: {
      dropHint: 'Drop .sig file here, or click to browse',
      acceptTip: 'Only .sig signature files accepted',
      placeholder: 'Or paste signature content here...',
      or: 'or enter manually',
      reUpload: 'Re-upload',
      clear: 'Clear',
      onlySig: 'Only .sig files are supported'
    }
  },
  updater: {
    title: 'Update Available',
    newVersion: 'New version {version} found. Update now?',
    updateNow: 'Update Now',
    later: 'Later',
    updating: 'Updating',
    downloading: 'Downloading update, please wait...'
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
  components: {
    upMedia: {
      imagePlaceholder: 'Or enter image URL',
      videoPlaceholder: 'Or enter video URL'
    }
  },
  error: {notFound: 'Sorry, the page you visited does not exist'},
  systemLog: {
    sidebar: { title: 'Log Files', empty: 'No log files' },
    toolbar: { keyword: 'Search keyword', level: 'Log level', query: 'Query', refresh: 'Refresh', autoScroll: 'Auto scroll', lines: 'lines' },
    empty: 'No log content',
    error: { loadFiles: 'Failed to load file list', loadContent: 'Failed to load log content' }
  },
  goods: {
    filter: { title: 'Product Title', platform: 'Platform', status: 'Status' },
    table: {
      title: 'Title', main_img: 'Image', platform: 'Platform',
      status: 'Status', audio_url: 'Audio'
    },
    form: {
      title: 'Title', main_img: 'Main Image URL',
      link: 'Product Link', tips: 'Prompt', point: 'Selling Points', script_text: 'Script'
    },
    actions: { generate: 'Generate', selectProduct: 'Select Product' },
    editTitle: 'Edit Product', detailTitle: 'Product Detail',
    platform: { title: 'Select Platform', hint: 'Open platform and use browser extension to capture product data' },
    detail: { ocrResult: 'Result', images: 'Detail Images' },
    ocr: {
      title: 'OCR Recognition', hint: 'Click to select images for recognition',
      selectImages: 'Please select at least one image', start: 'Start OCR',
      imagesSelected: ' selected', previousResult: 'Previous Result'
    },
    generate: {
      title: 'AI Script Generation', noOcr: 'No OCR result yet, recommend running OCR first',
      tipsPlaceholder: 'Optional, e.g.: highlight value, target young audience', start: 'Generate'
    },
    tts: {
      title: 'Text to Speech', noScript: 'Please enter script text first',
      placeholder: 'Enter or edit script text', start: 'Synthesize', currentAudio: 'Current Audio'
    }
  },
  authPlatform: {
    filter: { name: 'Platform Name', status: 'Status' },
    table: {
      code: 'Code',
      name: 'Name',
      login_types: 'Login Types',
      access_ttl: 'Access TTL',
      refresh_ttl: 'Refresh TTL',
      bind_platform: 'Bind Platform',
      bind_device: 'Bind Device',
      bind_ip: 'Bind IP',
      single_session: 'Single Session',
      max_sessions: 'Max Sessions',
      allow_register: 'Allow Register',
      status: 'Status',
      created_at: 'Created At',
      updated_at: 'Updated At'
    },
    form: {
      code: 'Platform Code',
      codePlaceholder: 'Lowercase, e.g. admin, app, mini',
      codeHelp: 'Cannot be changed after creation, used in platform header',
      name: 'Platform Name',
      namePlaceholder: 'e.g. Admin Panel, Mobile App',
      login_types: 'Login Types',
      access_ttl: 'Access Token TTL (seconds)',
      refresh_ttl: 'Refresh Token TTL (seconds)',
      bind_platform: 'Bind Platform',
      bind_device: 'Bind Device',
      bind_ip: 'Bind IP',
      single_session: 'Single Session (kick)',
      max_sessions: 'Max Sessions',
      max_sessions_help: '0 means unlimited',
      allow_register: 'Allow Register',
      section_basic: 'Basic Info',
      section_token: 'Token Policy',
      section_security: 'Security Policy'
    },
    addTitle: 'Add Auth Platform',
    editTitle: 'Edit Auth Platform',
    ttlFormat: {
      day: 'days',
      hour: 'hours',
      minute: 'minutes'
    }
  }
}
