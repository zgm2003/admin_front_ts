use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};

use cloudadmin_lib::{
    credentials::RefreshCredentialInput,
    error::SafeError,
    http_policy::{is_public_ip, validate_admin_refresh_endpoint, AccessCredential},
};

#[test]
fn refresh_input_debug_and_errors_never_disclose_the_secret() {
    let secret = "refresh-token-must-never-appear";
    let input: RefreshCredentialInput = serde_json::from_str(&format!("\"{secret}\"")).unwrap();
    assert_eq!(format!("{input:?}"), "RefreshCredentialInput([REDACTED])");

    let serialized = serde_json::to_string(&SafeError::credential_store()).unwrap();
    assert!(!serialized.contains(secret));
    assert_eq!(
        serialized,
        r#"{"kind":"credential_store","message":"系统安全凭证存储不可用"}"#
    );
}

#[test]
fn refresh_endpoint_is_exact_https_without_credentials_query_or_fragment() {
    assert!(
        validate_admin_refresh_endpoint("https://www.zgm2003.cn/api/admin/v1/auth/refresh").is_ok()
    );

    for rejected in [
        "http://www.zgm2003.cn/api/admin/v1/auth/refresh",
        "https://zgm2003.cn/api/admin/v1/auth/refresh",
        "https://www.zgm2003.cn:444/api/admin/v1/auth/refresh",
        "https://user:password@www.zgm2003.cn/api/admin/v1/auth/refresh",
        "https://www.zgm2003.cn/api/admin/v1/auth/refresh?token=secret",
        "https://www.zgm2003.cn/api/admin/v1/auth/refresh#fragment",
        "https://127.0.0.1/api/admin/v1/auth/refresh",
        "https://10.0.0.1/api/admin/v1/auth/refresh",
    ] {
        assert!(
            validate_admin_refresh_endpoint(rejected).is_err(),
            "accepted {rejected}"
        );
    }
}

#[test]
fn private_loopback_link_local_multicast_and_documentation_ips_are_denied() {
    for denied in [
        IpAddr::V4(Ipv4Addr::LOCALHOST),
        IpAddr::V4(Ipv4Addr::new(10, 0, 0, 1)),
        IpAddr::V4(Ipv4Addr::new(169, 254, 1, 1)),
        IpAddr::V4(Ipv4Addr::new(224, 0, 0, 1)),
        IpAddr::V4(Ipv4Addr::new(192, 0, 2, 1)),
        IpAddr::V6(Ipv6Addr::LOCALHOST),
        "fc00::1".parse().unwrap(),
        "fe80::1".parse().unwrap(),
        "2001:db8::1".parse().unwrap(),
    ] {
        assert!(!is_public_ip(denied), "accepted {denied}");
    }

    assert!(is_public_ip("8.8.8.8".parse().unwrap()));
    assert!(is_public_ip("2606:4700:4700::1111".parse().unwrap()));
}

#[test]
fn native_access_response_can_never_serialize_a_refresh_credential() {
    let credential = AccessCredential {
        access_token: "access-only".to_owned(),
        expires_at: 61_000,
    };
    let serialized = serde_json::to_value(credential).unwrap();
    assert_eq!(
        serialized,
        serde_json::json!({"accessToken":"access-only","expiresAt":61_000})
    );
    assert!(serialized.get("refreshToken").is_none());
    assert!(serialized.get("refresh_token").is_none());
}
