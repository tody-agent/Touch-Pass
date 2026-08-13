use axum::{routing::get, Json, Router, response::{IntoResponse, Response}, http::{StatusCode, header}};
use serde_json::{json, Value};
use crate::static_assets::WebPortalAssets;

async fn status_handler() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "helper": "rust-touchpass-0.1.0",
        "device_connected": true
    }))
}

async fn static_handler(axum::extract::Path(path): axum::extract::Path<String>) -> Response {
    let path = if path.is_empty() { "index.html" } else { &path };
    match WebPortalAssets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            (
                [(header::CONTENT_TYPE, mime.as_ref())],
                content.data.into_owned(),
            ).into_response()
        }
        None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
    }
}

pub fn create_router() -> Router {
    Router::new()
        .route("/api/status", get(status_handler))
        .route("/", get(|| static_handler(axum::extract::Path("index.html".to_string()))))
        .route("/*path", get(static_handler))
}
