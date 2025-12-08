import {createI18n} from 'vue-i18n'
import Cookies from 'js-cookie'

const messages = {
    'zh-CN': {
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
                sendCode: '发送成功（长时间没收到检查垃圾箱┭┮﹏┭┮）'
            },
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
            test: '测试页'
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
        error: {notFound: '抱歉，您访问的页面不存在'}
    },
    'en-US': {
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
                sendCode: 'Code sent successfully'
            },
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
            test: 'Test'
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
        error: {notFound: 'Sorry, the page you visited does not exist'}
    }
}
export default createI18n({legacy: false, locale: Cookies.get('lang') || 'zh-CN', fallbackLocale: 'zh-CN', messages})
