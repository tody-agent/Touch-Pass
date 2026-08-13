use touchpass_helper::api::create_router;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = create_router();
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("TouchPass Rust Helper listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
