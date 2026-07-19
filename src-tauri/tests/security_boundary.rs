use cloudadmin_lib::{
    download::policy::{
        sanitize_filename, validate_download_url, validate_selected_target, RedirectBudget,
    },
    window::is_authorized_navigation,
};
use proptest::prelude::*;

fn arbitrary_text(max_chars: usize) -> impl Strategy<Value = String> {
    proptest::collection::vec(any::<char>(), 0..=max_chars)
        .prop_map(|characters| characters.into_iter().collect())
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(128))]

    #[test]
    fn managed_urls_are_denied_or_remain_on_the_exact_https_allowlist(input in arbitrary_text(256)) {
        if let Ok(url) = validate_download_url(&input) {
            prop_assert_eq!(url.scheme(), "https");
            prop_assert!(matches!(url.host_str(), Some("cos.zgm2003.cn" | "www.zgm2003.cn")));
            prop_assert!(url.username().is_empty());
            prop_assert!(url.password().is_none());
            prop_assert!(url.port().is_none());
            prop_assert!(url.fragment().is_none());
        }
    }

    #[test]
    fn managed_filenames_are_denied_or_canonical_single_components(input in arbitrary_text(300)) {
        if let Ok(filename) = sanitize_filename(&input) {
            prop_assert_eq!(&filename, &input);
            prop_assert!(!filename.is_empty());
            prop_assert_eq!(filename.trim(), filename.as_str());
            prop_assert!(filename.encode_utf16().count() <= 255);
            prop_assert!(!filename.ends_with('.'));
            let has_forbidden_character = filename.chars().any(|character| {
                character.is_control()
                    || matches!(character, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*')
            });
            prop_assert!(!has_forbidden_character);
        }
    }

    #[test]
    fn every_accepted_redirect_hop_stays_allowlisted(
        locations in proptest::collection::vec(arbitrary_text(128), 0..9)
    ) {
        let mut current = validate_download_url("https://cos.zgm2003.cn/releases/start").unwrap();
        let mut budget = RedirectBudget::new();
        let mut accepted = 0usize;
        for location in locations {
            match budget.follow(&current, &location) {
                Ok(next) => {
                    accepted += 1;
                    prop_assert!(accepted <= 5);
                    prop_assert_eq!(next.scheme(), "https");
                    prop_assert!(matches!(next.host_str(), Some("cos.zgm2003.cn" | "www.zgm2003.cn")));
                    current = next;
                }
                Err(_) => break,
            }
        }
    }

    #[test]
    fn accepted_targets_remain_inside_the_selected_real_directory(input in arbitrary_text(128)) {
        let directory = tempfile::tempdir().unwrap();
        let candidate = directory.path().join(input);
        if let Ok(target) = validate_selected_target(&candidate) {
            prop_assert!(target.parent().is_absolute());
            prop_assert_eq!(target.parent(), target.parent().canonicalize().unwrap());
            prop_assert!(target.path().starts_with(target.parent()));
            prop_assert_eq!(target.path().parent(), Some(target.parent()));
        }
    }

    #[test]
    fn window_identity_is_denied_or_exactly_local(label in arbitrary_text(32), raw_url in arbitrary_text(256)) {
        let authorized = url::Url::parse(&raw_url)
            .ok()
            .is_some_and(|url| is_authorized_navigation(&label, &url, false));
        if authorized {
            let url = url::Url::parse(&raw_url).unwrap();
            prop_assert_eq!(label, "main");
            prop_assert_eq!(url.scheme(), "http");
            prop_assert_eq!(url.host_str(), Some("tauri.localhost"));
            prop_assert!(url.port().is_none());
            prop_assert!(url.username().is_empty());
            prop_assert!(url.password().is_none());
        }
    }
}
