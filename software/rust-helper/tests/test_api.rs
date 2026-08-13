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
