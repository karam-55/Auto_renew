use std::collections::HashMap;

#[tauri::command]
async fn native_http_request(
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<serde_json::Value, String> {
    println!("[native_http_request] {} {} headers={:?} body={}", method, url, headers.is_some(), body.is_some());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .connect_timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Client build failed: {}", e))?;
    let mut req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "PATCH" => client.patch(&url),
        "DELETE" => client.delete(&url),
        _ => return Err("Unsupported HTTP method".to_string()),
    };

    if let Some(h) = headers {
        for (k, v) in h {
            req = req.header(k, v);
        }
    }

    if let Some(b) = body {
        req = req.header("Content-Type", "application/json").body(b);
    }

    match req.send().await {
        Ok(res) => {
            let status = res.status().as_u16();
            let body_text = res.text().await.unwrap_or_default();
            println!("[native_http_request] response status={} body_len={}", status, body_text.len());
            let body_json: serde_json::Value = serde_json::from_str(&body_text).unwrap_or_else(|_| serde_json::Value::String(body_text));
            Ok(serde_json::json!({
                "status": status,
                "body": body_json
            }))
        }
        Err(e) => {
            println!("[native_http_request] request error: {}", e);
            Err(format!("Request failed: {}", e))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![native_http_request])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                let _window = _app.get_webview_window("main").unwrap();
                _window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
