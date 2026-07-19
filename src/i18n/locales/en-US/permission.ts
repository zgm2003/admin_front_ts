export default {
  role: {
      filter: {name: 'Name'},
      table: {id: 'ID', name: 'Name', is_default: 'Default Role', created_at: 'Created At', updated_at: 'Updated At'},
      form: { permission: 'Permissions' },
      permissionGroup: { rootPages: 'Ungrouped Pages', rootButtons: 'Root Buttons' },
      permissionMatrix: {
        helper: 'Directories are display groups only; only page access and button actions are persisted. Selecting an action grants page access automatically.',
        selected: 'Selected',
        pages: 'Pages',
        actions: 'Actions',
        pageAccess: 'Page access',
        clearGroup: 'Clear Group',
        clearPlatform: 'Clear Current Platform',
        emptyActions: 'No actions; controls page access only'
      },
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
          parent_id: 'Admin buttons must be attached to a page permission',
          name: 'Please enter name',
          i18n_key: 'Please enter i18n_key',
          code: 'Please enter code',
          show_menu: 'Please select show status',
          path: 'Please enter route path',
          component: 'Please enter component path'
        },
        help: {
          component: 'Example: user/userManager (file path without /)',
          path: 'Should be "/" + component, e.g., /user/userManager',
          i18n_key: 'Format: menu.{parent}_{current}, e.g., menu.user_userManager'
        },
        codeHint: 'Naming convention: module_action, e.g. profile_edit, scan_submit'
      },
      health: {
        title: 'Fix these before assigning roles to avoid stale routes or button permissions',
        pageMissingRoute: '{count} page permissions are missing route path or component',
        buttonMissingCode: '{count} button permissions are missing code',
        adminButtonRoot: '{count} admin button permissions are still attached to root'
      }
    }
}
