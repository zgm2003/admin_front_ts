export default {
  role: {
      filter: { name: '名称' },
      table: { id: 'ID', name: '名称', is_default: '默认角色', created_at: '创建时间', updated_at: '更新时间' },
      form: { permission: '权限' },
      permissionGroup: { rootPages: '未分组页面', rootButtons: '根级按钮' },
      permissionMatrix: {
        helper: '目录只负责分组展示；入库只保存页面访问和页面动作。勾选动作会自动拥有页面访问。',
        selected: '已选',
        pages: '页面',
        actions: '动作',
        pageAccess: '页面访问',
        clearGroup: '清空本组',
        clearPlatform: '清空当前平台',
        emptyActions: '无动作，仅控制页面访问'
      },
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
          parent_id: '后台按钮必须挂在页面权限下',
          name: '请输入名称',
          i18n_key: '请输入 i18n_key',
          code: '请输入 code',
          show_menu: '请选择是否显示',
          path: '请输入路由地址',
          component: '请输入组件路径'
        },
        help: {
          component: '示例：user/userManager（文件路径，不带 /）',
          path: '应为 "/" + component，如：/user/userManager',
          i18n_key: '格式：menu.[parent]_[current]，如：menu.user_userManager'
        },
        codeHint: '命名规范：模块_操作，如 profile_edit、scan_submit'
      },
      health: {
        title: '请修正后再分配给角色，避免前端路由或按钮权限失真',
        pageMissingRoute: '{count} 个页面权限缺少路由或组件',
        buttonMissingCode: '{count} 个按钮权限缺少 code',
        adminButtonRoot: '{count} 个后台按钮权限仍挂在根节点'
      }
    }
}
