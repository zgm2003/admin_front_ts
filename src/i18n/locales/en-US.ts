export default {
  auth: {
    login: {
      title: 'Sign In',
      email: 'Email',
      password: 'Password',
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
    success: {
      login: 'Signed in successfully',
      register: 'Registered successfully',
      editPassword: 'Password updated',
      sendCode: 'Code sent successfully',
      operation: 'Operation successful'
    },
    confirmTitle: 'Confirmation',
    confirmDelete: 'Are you sure you want to delete?',
    confirmBatchDelete: 'Delete all selected records?',
    confirmStatusChange: 'Change enabled status?',
    selectAtLeastOne: 'Please select at least one record',
    required: 'is required',
    language: 'Language', zh: 'Chinese', en: 'English',
    actions: {
      add: 'Add',
      edit: 'Edit',
      del: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      query: 'Query',
      export: 'Export',
      batchAction: 'Batch Actions',
      batchDelete: 'Batch Delete',
      batchEdit: 'Batch Edit',
      action: 'Actions'
    },
    quickEntry: 'Quick Entry'
  },
  menu: {
    home: 'Home',
    user: 'User',
    system: 'System',
    userManager: 'User Manager',
    role: 'Role Manager',
    permission: 'Permission',
    logs: 'System Log',
    test: 'Test',
    uploadConfig: 'Upload Config'
  },
  header: {
    projectConfig: 'Project Settings',
    theme: 'Theme',
    systemTheme: 'System Theme',
    headerTheme: 'Header Theme',
    menuTheme: 'Menu Theme',
    display: 'Display',
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
    logout: 'Logout'
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
  log: {
    filter: {userName: 'Operator Name', userEmail: 'Operator Email', action: 'Action', date: 'Date Range'},
    table: {
      id: 'ID',
      user_name: 'Operator Name',
      user_email: 'Operator Email',
      action: 'Action',
      request_data: 'Request',
      response_data: 'Response',
      is_success: 'Success',
      created_at: 'Created At'
    }
  },
  user: {
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
    }
  },
  role: {
    filter: {name: 'Name'},
    table: {id: 'ID', name: 'Name', created_at: 'Created At', updated_at: 'Updated At'}
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
    }
  },
  upload: {
    tabs: { driver: 'Drivers', rule: 'Rules', setting: 'Settings' },
    driver: {
      filter: { driver: 'Driver' },
      table: {
        driver: 'Driver',
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
    }
  },
  error: {notFound: 'Sorry, the page you visited does not exist'}
}
