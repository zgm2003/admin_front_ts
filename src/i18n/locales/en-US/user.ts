export default {
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
        saveBasic: 'Save Basic Info',
        resetBasic: 'Reset',
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
      },
    },
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
      },
      page: {
        eyebrow: 'Change Trace',
        description: 'Review admin operations as a time-ordered audit stream so action, operator, result, and payload visibility stay in one scan line.',
        total: 'Loaded Records',
        totalHintMore: 'More history is available below',
        totalHintDone: 'The current result set is fully loaded',
        success: 'Successful Actions',
        successHint: 'Success rate in view: {rate}%',
        failed: 'Failed Actions',
        failedHintClear: 'No failed operations in the current view',
        failedHintRisk: '{count} failed operations need review',
        payload: 'Payloads',
        filters: 'Active Filters',
        filtersHintNone: 'No extra filters applied',
        filtersHintActive: 'The stream is narrowed to a target range',
        timeline: 'Operation Timeline',
        timelineHint: 'Grouped by date. Expand a row to inspect request and response payloads.',
        loadedTag: '{count} records loaded',
        filterTag: '{count} filters active',
        empty: 'No operation logs match the current filters'
      },
      entry: {
        keys: '{count} fields',
        items: '{count} items',
        payloadNone: 'No request or response payload'
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
      },
      page: {
        eyebrow: 'Access Trace',
        description: 'Scan login activity as a time-ordered stream so failed attempts, suspicious devices, and filtered paths are easier to spot.',
        total: 'Loaded Records',
        totalHintMore: 'More history is available below',
        totalHintDone: 'The current result set is fully loaded',
        success: 'Successful Logins',
        successHint: 'Success rate in view: {rate}%',
        failed: 'Failed Logins',
        failedHintClear: 'No failed attempts in the current view',
        failedHintRisk: '{count} failed attempts need review',
        filters: 'Active Filters',
        filtersHintNone: 'No extra filters applied',
        filtersHintActive: 'The stream is narrowed to a target range',
        timeline: 'Login Timeline',
        timelineHint: 'Grouped by date. Scroll to the bottom to continue loading older records.',
        loadedTag: '{count} records loaded',
        filterTag: '{count} filters active',
        empty: 'No login activity matches the current filters'
      }
    },
  user: {
      fallback: {
        username: 'Username not set'
      },
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
        status: 'Status',
        expires_in: 'Token Expiration',
        is_expired: 'Token Expired'
      },
      batchEdit: {
        field: 'Field'
      },
      warning: {
        fillComplete: 'Please fill in all required fields'
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
    }
}
