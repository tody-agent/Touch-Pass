use touchpass_helper::api::create_router;
use axum_test::TestServer;

#[tokio::test]
async fn test_api_status_endpoint() {
    let app = create_router();
    let server = TestServer::new(app).unwrap();
    let response = server.get("/api/status").await;
    response.assert_status_ok();
    response.assert_json(&serde_json::json!({
        "status": "ok",
        "helper": "rust-touchpass-0.1.0",
        "device_connected": true
    }));
}

#[tokio::test]
async fn test_static_portal_html() {
    let app = create_router();
    let server = TestServer::new(app).unwrap();
    
    // Index page
    let response = server.get("/").await;
    response.assert_status_ok();
    assert!(response.text().contains("TouchPass"));

    // CSS asset
    let css_resp = server.get("/styles.css").await;
    css_resp.assert_status_ok();

    // JS asset
    let js_resp = server.get("/app.js").await;
    js_resp.assert_status_ok();
}

#[tokio::test]
async fn test_static_not_found() {
    let app = create_router();
    let server = TestServer::new(app).unwrap();
    let response = server.get("/nonexistent_file_404.xyz").await;
    response.assert_status_not_found();
}
