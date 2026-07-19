export default {
  auth: {
      login: {
        title: 'Sign In',
        account: 'Account',
        accountPlaceholder: 'Email/Username/Phone',
        email: 'Email',
        emailPlaceholder: 'Enter email',
        phone: 'Phone',
        phonePlaceholder: 'Enter phone number',
        password: 'Password',
        passwordPlaceholder: 'Enter password',
        codePlaceholder: 'Enter verification code',
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
        newPasswordPlaceholder: 'Enter new password',
        confirmPassword: 'Confirm New Password',
        confirmPasswordPlaceholder: 'Enter the new password again',
        submit: 'Change Password'
      },
      forget: {
        title: 'Forgot Password',
        account: 'Email / Phone',
        accountPlaceholder: 'Enter email or phone number',
        email: 'Email',
        code: 'Verification Code',
        codePlaceholder: '6-digit verification code',
        newPassword: 'New Password',
        submit: 'Change Password',
        toEdit: 'I remember old password'
      }
    },
  loginPage: {
      form: {
        welcomeDesc: 'Sign in to the ZhiLan admin workspace and continue managing efficiently',
        agreePrefix: 'I have read and agree to the',
        serviceTerms: 'Terms of Service',
        and: 'and',
        privacyPolicy: 'Privacy Policy',
        loggingIn: 'Signing in...'
      },
      policyConfirm: {
        title: 'Confirm Terms of Service and Privacy Policy',
        description: 'Before signing in, please read and agree to the Terms of Service and Privacy Policy. This consent applies only to this login page session.',
        cancel: 'Cancel',
        confirm: 'Agree and continue'
      },
      brand: {
        logoAlt: 'ZhiLan system logo',
        name: 'ZhiLan System',
        tag: 'ZhiLan Admin System',
        titleLine1: 'Technology Leads',
        titleHighlight: 'Empowering Enterprise Management',
        description: 'Combining advanced technology and intelligent analytics to deliver efficient, secure, and scalable enterprise solutions.',
        features: {
          secureTitle: 'Secure and Reliable',
          secureDesc: 'Enterprise-grade data encryption aligned with international security standards',
          stableTitle: 'Efficient and Stable',
          stableDesc: 'Runs reliably 24/7 to keep your business continuous',
          smartTitle: 'Intelligent Analysis',
          smartDesc: 'Data-driven analysis that supports smarter decisions'
        },
        stats: {
          trustedUsersValue: '500K+',
          trustedUsers: 'Trusted Users',
          satisfactionValue: '98.5%',
          satisfaction: 'Satisfaction Rate',
          enterpriseCustomersValue: '2,000+',
          enterpriseCustomers: 'Enterprise Clients'
        }
      },
      forgot: {
        steps: {
          verify: 'Verify Identity',
          reset: 'Reset Password'
        },
        next: 'Next',
        submit: 'Submit Reset',
        submitting: 'Resetting...'
      },
      loading: {
        preparing: 'Preparing your workspace...'
      }
    },
  login: {
      validation: {
        accountRequired: 'Account is required',
        emailInvalid: 'Enter a valid email address',
        phoneInvalid: 'Enter a valid phone number',
        passwordRequired: 'Password is required',
        codeRequired: 'Verification code is required',
        captchaLoadFailed: 'Failed to load captcha, please try again',
        captchaConfigInvalid: 'Captcha configuration is invalid',
        policyRequired: 'Please read and agree to the terms of service and privacy policy first',
        loginSuccess: 'Signed in successfully',
        termsHint: 'View the terms of service in system settings',
        privacyHint: 'View the privacy policy in system settings'
      }
    },
  forgotPassword: {
      validation: {
        accountRequired: 'Enter email or phone number',
        accountInvalid: 'Enter a valid email or phone number',
        codeSent: 'Verification code sent',
        sendFailed: 'Send failed',
        fullInfoRequired: 'Please complete all required information',
        passwordRequired: 'Enter a new password',
        passwordMismatch: 'The confirmation password does not match',
        passwordLength: 'Password length must be 6 to 128 characters',
        resetSuccess: 'Password reset successfully. Please sign in.',
        resetFailed: 'Reset failed'
      }
    },
  authPlatform: {
      filter: { name: 'Platform Name', status: 'Status' },
      table: {
        code: 'Code',
        name: 'Name',
        login_types: 'Login Types',
        captcha_type: 'Captcha Type',
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
        captcha_type: 'Captcha Type',
        access_ttl: 'Access Token TTL (seconds)',
        refresh_ttl: 'Refresh Token TTL (seconds)',
        bind_platform: 'Bind Platform',
        bind_device: 'Bind Device',
        bind_ip: 'Bind IP',
        single_session: 'Single Session (kick)',
        max_sessions: 'Max Sessions',
        max_sessions_help: '0 means unlimited',
        allow_register: 'Allow Register',
        policy_notice: 'These settings directly affect login, session eviction, and registration. New platforms start from a stricter baseline; relax them only when the business case is clear.',
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
