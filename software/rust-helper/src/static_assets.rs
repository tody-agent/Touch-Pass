use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "../macos-helper/portal/"]
pub struct WebPortalAssets;
