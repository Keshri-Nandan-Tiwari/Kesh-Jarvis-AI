// Kesh desktop wrapper. This just hosts the existing React frontend
// (kesh-frontend) inside a native window via Tauri — no separate logic
// needed here since all the real work happens in the Spring Boot backend
// and the React app, both unchanged.

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Kesh desktop app");
}
