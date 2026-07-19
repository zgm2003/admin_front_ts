export default {
  http: {
      requestFailed: 'Request failed',
      unauthorized: 'Unauthorized'
    },
  jsonEditor: {
      invalidJson: 'Invalid JSON: {message}',
      formatted: 'JSON formatted',
      format: 'Format',
      validate: 'Validate'
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
      invalidData: 'Invalid data contract',
      selectAtLeastOne: 'Please select at least one record',
      export: {
        submitted: 'Export task submitted, you will be notified when complete',
      },
      required: 'is required',
      maxLength: 'Max length {n}',
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
        reset: 'Reset',
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
        refresh: 'Refresh',
        columnSetting: 'Column settings'
      },
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
  network: {
      offline: {
        title: 'Network disconnected',
        message: 'This page may not sync the latest data. Check your connection and refresh.',
        since: 'Detected at {time}',
        refresh: 'Refresh page'
      }
    },
  iconSelect: {
      title: 'Select Icon',
      searchPlaceholder: 'Search icon names...',
      typePlaceholder: 'Icon type',
      selected: 'Currently selected:',
      clearSelection: 'Clear',
      empty: 'No matching icons found',
      total: '{count} icons total',
      types: {
        all: 'All Icons',
        element: 'Element Plus',
        iconify: 'Iconify'
      },
      badges: {
        element: 'Element'
      }
    },
  components: {
      upMedia: {
        imagePlaceholder: 'Or enter image URL',
        videoPlaceholder: 'Or enter video URL'
      }
    },
  error: {
      notFound: {
        title: 'Page not found',
        description: 'Sorry, the page you visited does not exist or has been removed.',
        back: 'Go back',
        home: 'Go home'
      },
      deadPage: {
        title: 'Component not found',
        description: 'The route matched, but the backend view_key did not resolve to a page component.',
        detailPath: 'Route path',
        detailViewKey: 'view_key',
        back: 'Go back',
        home: 'Go home'
      }
    },
  uploadRuntime: {
      maxSize: 'File size must not exceed {size}MB',
      unsupportedType: 'Unsupported file type',
      unsupportedExt: 'Unsupported file extension .{ext}. Allowed: {exts}',
      ossUnsupported: 'Only Tencent COS is supported currently. Historical or non-COS configuration is unavailable; configure COS again.'
    },
  time: {
      justNow: 'Just now',
      minutesAgo: '{count} minutes ago',
      hoursAgo: '{count} hours ago',
      daysAgo: '{count} days ago',
      yesterday: 'Yesterday {time}',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      groups: {
        today: 'Today',
        yesterday: 'Yesterday',
        week: 'Last 7 days',
        month: 'Last 30 days',
        older: 'Older'
      }
    },
  devTest: {
      themeSwitch: 'Theme switch',
      dark: 'Dark',
      light: 'Light',
      downloadTitle: 'Download test',
      downloadUrl: 'Download URL',
      downloadUrlPlaceholder: 'Enter file URL',
      filename: 'File name',
      filenamePlaceholder: 'Suggested file name (optional)',
      startDownload: 'Start download',
      editor: 'Rich text editor',
      downloadUrlRequired: 'Enter a download URL',
      downloadDone: 'File handed to the browser for download',
      downloadFailed: 'Download failed: {error}',
      editorWelcome: '<p>Welcome to the rich text editor</p>'
    }
}
