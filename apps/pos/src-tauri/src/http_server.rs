use axum::{
    extract::{DefaultBodyLimit, State},
    response::Html,
    routing::{get, post},
    Router,
};
use axum_typed_multipart::{TryFromMultipart, TypedMultipart};
use local_ip_address::local_ip;
use log::{error, info};
use std::{net::SocketAddr, path::PathBuf, sync::OnceLock};
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;

static DOWNLOAD_PATH: OnceLock<PathBuf> = OnceLock::new();
static SERVER_PORT: OnceLock<u16> = OnceLock::new(); // Store the active port

#[derive(Clone)]
struct AppState {
    app: AppHandle,
}

#[derive(TryFromMultipart)]
struct UploadForm {
    #[form_data(limit = "unlimited")]
    file: axum_typed_multipart::FieldData<axum::body::Bytes>,
}

async fn handle_upload(
    State(state): State<AppState>,
    TypedMultipart(UploadForm { file }): TypedMultipart<UploadForm>,
) -> Html<&'static str> {
    let file_name = file
        .metadata
        .file_name
        .unwrap_or("uploaded_file.bin".to_string());
    let safe_file_name = std::path::Path::new(&file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("uploaded_file.bin");

    // Basic Content Type Validation
    if let Some(content_type) = &file.metadata.content_type {
        // Block executable types
        if content_type.contains("application/x-msdownload")
            || content_type.contains("application/x-executable")
            || file_name.ends_with(".exe")
            || file_name.ends_with(".bat")
            || file_name.ends_with(".cmd")
            || file_name.ends_with(".sh")
        {
            return Html("<h1>Upload Failed: File type not allowed</h1>");
        }
    }

    if let Some(save_dir) = DOWNLOAD_PATH.get() {
        let path = save_dir.join(safe_file_name);
        match tokio::fs::File::create(&path).await {
            Ok(mut f) => {
                if f.write_all(&file.contents).await.is_ok() {
                    info!("File saved to: {:?}", path);
                    // Emit event to frontend
                    let _ = state.app.emit("file-received", &file_name);
                    // Return a simple success page for the phone
                    return Html(
                        r#"
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Success</title>
                            <style>
                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                body {
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                                    background: #0f172a;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    min-height: 100vh;
                                    padding: 20px;
                                }
                                .container {
                                    background: #1e293b;
                                    border: 1px solid #334155;
                                    padding: 3rem;
                                    border-radius: 20px;
                                    text-align: center;
                                    max-width: 400px;
                                    width: 100%;
                                }
                                .icon {
                                    width: 80px;
                                    height: 80px;
                                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    margin: 0 auto 1.5rem;
                                    font-size: 2.5rem;
                                }
                                h1 {
                                    color: #f8fafc;
                                    font-size: 1.75rem;
                                    margin-bottom: 0.5rem;
                                }
                                p {
                                    color: #cbd5e1;
                                    margin-bottom: 2rem;
                                }
                                a {
                                    display: inline-block;
                                    background: #3b82f6;
                                    color: white;
                                    padding: 1rem 2rem;
                                    border-radius: 10px;
                                    text-decoration: none;
                                    font-weight: 600;
                                    transition: all 0.2s;
                                }
                                a:hover {
                                    background: #2563eb;
                                    transform: translateY(-1px);
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="icon">✓</div>
                                <h1>Success!</h1>
                                <p>File sent to desktop</p>
                                <a href="/">Send Another</a>
                            </div>
                        </body>
                        </html>
                    "#,
                    );
                }
            }
            Err(e) => error!("Error saving file: {}", e),
        }
    }
    Html("<h1>Upload Failed</h1>")
}

async fn show_upload_page() -> Html<&'static str> {
    Html(
        r#"
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Transfer</title>
            <style>
                :root {
                    --primary: #0f172a;
                    --primary-light: #1e293b;
                    --accent: #3b82f6;
                    --accent-hover: #2563eb;
                    --text-primary: #f8fafc;
                    --text-secondary: #cbd5e1;
                    --border: #334155;
                    --success: #10b981;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
                    background: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                }
                
                body::before {
                    content: '';
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
                    top: -250px;
                    right: -250px;
                    pointer-events: none;
                }
                
                body::after {
                    content: '';
                    position: absolute;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
                    bottom: -200px;
                    left: -200px;
                    pointer-events: none;
                }
                
                .container {
                    background: var(--primary-light);
                    border: 1px solid var(--border);
                    padding: 3rem;
                    border-radius: 20px;
                    max-width: 480px;
                    width: 100%;
                    position: relative;
                    z-index: 1;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }
                
                .icon-wrapper {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                }
                
                .icon {
                    font-size: 2rem;
                }
                
                h1 {
                    color: var(--text-primary);
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.03em;
                }
                
                .subtitle {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    line-height: 1.5;
                }
                
                .upload-area {
                    position: relative;
                    margin-bottom: 1.5rem;
                }
                
                .file-input-wrapper {
                    position: relative;
                    border: 2px dashed var(--border);
                    border-radius: 12px;
                    padding: 2.5rem 1.5rem;
                    text-align: center;
                    background: rgba(59, 130, 246, 0.03);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                
                .file-input-wrapper:hover {
                    border-color: var(--accent);
                    background: rgba(59, 130, 246, 0.08);
                }
                
                .file-input-wrapper.drag-over {
                    border-color: var(--accent);
                    background: rgba(59, 130, 246, 0.12);
                    border-style: solid;
                }
                
                input[type="file"] {
                    position: absolute;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    cursor: pointer;
                }
                
                .upload-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    opacity: 0.6;
                }
                
                .upload-text {
                    color: var(--text-primary);
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }
                
                .upload-hint {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }
                
                .file-name {
                    margin-top: 1rem;
                    padding: 0.75rem 1rem;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 8px;
                    color: var(--accent);
                    font-size: 0.9rem;
                    word-break: break-all;
                    display: none;
                }
                
                .file-name.show {
                    display: block;
                }
                
                button {
                    width: 100%;
                    background: var(--accent);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                
                button:hover {
                    background: var(--accent-hover);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                }
                
                button:active {
                    transform: translateY(0);
                }
                
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .features {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--border);
                }
                
                .feature {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }
                
                .feature-icon {
                    font-size: 1rem;
                }
                
                @media (max-width: 480px) {
                    .container {
                        padding: 2rem 1.5rem;
                    }
                    
                    h1 {
                        font-size: 1.5rem;
                    }
                    
                    .features {
                        flex-direction: column;
                        gap: 0.75rem;
                        align-items: center;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon-wrapper">
                        <div class="icon">⚡</div>
                    </div>
                    <h1>File Transfer</h1>
                    <p class="subtitle">Send files to your desktop instantly</p>
                </div>
                
                <form action="/upload" method="post" enctype="multipart/form-data" id="uploadForm">
                    <div class="upload-area">
                        <div class="file-input-wrapper" id="dropZone">
                            <input type="file" name="file" id="fileInput" required>
                            <div class="upload-icon">📎</div>
                            <div class="upload-text">Click to browse</div>
                            <div class="upload-hint">or drag and drop your file here</div>
                        </div>
                        <div class="file-name" id="fileName"></div>
                    </div>
                    <button type="submit" id="submitBtn">
                        <span id="btnText">Send File</span>
                    </button>
                </form>
                
                <div class="features">
                    <div class="feature">
                        <span class="feature-icon">🔒</span>
                        <span>Secure</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">⚡</span>
                        <span>Instant</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🔐</span>
                        <span>Private</span>
                    </div>
                </div>
            </div>
            
            <script>
                const fileInput = document.getElementById('fileInput');
                const fileName = document.getElementById('fileName');
                const dropZone = document.getElementById('dropZone');
                const form = document.getElementById('uploadForm');
                const submitBtn = document.getElementById('submitBtn');
                const btnText = document.getElementById('btnText');
                
                fileInput.addEventListener('change', function(e) {
                    if (this.files.length > 0) {
                        fileName.textContent = '📄 ' + this.files[0].name;
                        fileName.classList.add('show');
                    }
                });
                
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, preventDefaults, false);
                });
                
                function preventDefaults(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => {
                        dropZone.classList.add('drag-over');
                    });
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => {
                        dropZone.classList.remove('drag-over');
                    });
                });
                
                dropZone.addEventListener('drop', function(e) {
                    const dt = e.dataTransfer;
                    const files = dt.files;
                    fileInput.files = files;
                    
                    if (files.length > 0) {
                        fileName.textContent = '📄 ' + files[0].name;
                        fileName.classList.add('show');
                    }
                });
                
                form.addEventListener('submit', function() {
                    submitBtn.disabled = true;
                    btnText.textContent = 'Sending...';
                });
            </script>
        </body>
        </html>
    "#,
    )
}

#[tauri::command]
pub async fn start_file_server(app: AppHandle) -> Result<String, String> {
    let ip = local_ip().map_err(|e| e.to_string())?;

    // Initialize path if not set
    if DOWNLOAD_PATH.get().is_none() {
        let download_dir = app.path().download_dir().map_err(|e| e.to_string())?;
        let _ = DOWNLOAD_PATH.set(download_dir);
    }

    // 1. CHECK IF SERVER ALREADY RUNNING
    if let Some(port) = SERVER_PORT.get() {
        return Ok(format!("http://{}:{}", ip, port));
    }

    // 2. BIND TO PORT 0 (Random available port)
    let addr = SocketAddr::from((ip, 0));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| e.to_string())?;

    // 3. GET THE ASSIGNED PORT
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let _ = SERVER_PORT.set(port);

    let app_handle = app.clone();

    tauri::async_runtime::spawn(async move {
        let state = AppState { app: app_handle };

        let router = Router::new()
            .route("/", get(show_upload_page))
            .route("/upload", post(handle_upload))
            .layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100MB liimit
            .with_state(state);

        info!("File server running on http://{}:{}", ip, port);

        let _ = axum::serve(listener, router).await;
    });

    Ok(format!("http://{}:{}", ip, port))
}
