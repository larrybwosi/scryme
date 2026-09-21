fn main() {
    println!("cargo:rerun-if-changed=../../../packages/sdk/openapi.json");
    let pnpm_cmd = if cfg!(windows) { "pnpm.cmd" } else { "pnpm" };
    let status = std::process::Command::new(pnpm_cmd)
        .current_dir("../../..")
        .status();

    match status {
        Ok(s) if s.success() => {},
        Ok(s) => println!("cargo:warning=pnpm generate:rust exited with status {}", s),
        Err(e) => println!("cargo:warning=Failed to launch pnpm generate:rust: {}", e),
    }

    tauri_build::build();
}
