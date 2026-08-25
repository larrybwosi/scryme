fn main() {
    println!("cargo:rerun-if-changed=../../../packages/v3-sdk/openapi.json");
    let status = std::process::Command::new("pnpm")
        .args(&["--filter", "@scryme/sdk", "generate:rust"])
        .current_dir("../../..")
        .status();

    if let Err(e) = status {
        println!("cargo:warning=Failed to generate rust SDK via pnpm: {}", e);
    }

    tauri_build::build();
}
