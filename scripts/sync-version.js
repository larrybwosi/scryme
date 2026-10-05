const fs = require("fs");
const path = require("path");

function getPosVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../apps/pos/package.json"), "utf8"));
    return pkg.version || "";
  } catch (e) {
    return "";
  }
}

const version = process.argv[2] || getPosVersion();

if (!version) {
  console.error("Error: Could not determine target version");
  process.exit(1);
}

console.log(`Synchronizing version ${version} across monorepo...`);

function parseSemver(v) {
  const match = v.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return { major: 10, minor: 2, patch: 0 };
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

const sem = parseSemver(version);
const versionCode = sem.major * 10000 + sem.minor * 100 + sem.patch;
const root = path.join(__dirname, "..");

// 1. Apps package.json files
const appsDir = path.join(root, "apps");
if (fs.existsSync(appsDir)) {
  const appDirs = fs.readdirSync(appsDir);
  for (const d of appDirs) {
    const pkgPath = path.join(appsDir, d, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        pkg.version = version;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
        console.log(`Updated ${pkgPath} -> ${version}`);
      } catch (e) {
        console.error(`Failed to update ${pkgPath}:`, e.message);
      }
    }
  }
}

// 2. Packages package.json files
const pkgsDir = path.join(root, "packages");
if (fs.existsSync(pkgsDir)) {
  const pkgDirs = fs.readdirSync(pkgsDir);
  for (const d of pkgDirs) {
    const pkgPath = path.join(pkgsDir, d, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        pkg.version = version;
        if (d === "sdk" && pkg.scripts && pkg.scripts["generate:rust"]) {
          pkg.scripts["generate:rust"] = `openapi-generator-cli generate --skip-validate-spec -i ./openapi.json -g rust -o ./rust --additional-properties=packageName=scryme-sdk,packageVersion=${version} --global-property apiDocs=false,modelDocs=false`;
        }
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
        console.log(`Updated ${pkgPath} -> ${version}`);
      } catch (e) {
        console.error(`Failed to update ${pkgPath}:`, e.message);
      }
    }
  }
}

// 3. create-app template package.json
const templatePkgPath = path.join(root, "packages/create-app/template/package.json");
if (fs.existsSync(templatePkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(templatePkgPath, "utf8"));
    if (pkg.dependencies && pkg.dependencies["@scryme/sdk"]) {
      pkg.dependencies["@scryme/sdk"] = `^${version}`;
    }
    fs.writeFileSync(templatePkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log(`Updated ${templatePkgPath} dependency @scryme/sdk -> ^${version}`);
  } catch (e) {
    console.error(`Failed to update ${templatePkgPath}:`, e.message);
  }
}

// 4. Cargo.toml files
const cargoFiles = [
  path.join(root, "apps/pos/src-tauri/Cargo.toml"),
  path.join(root, "apps/bakery/src-tauri/Cargo.toml"),
  path.join(root, "packages/sdk/rust/Cargo.toml")
];

for (const cPath of cargoFiles) {
  if (fs.existsSync(cPath)) {
    let content = fs.readFileSync(cPath, "utf8");
    content = content.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);
    fs.writeFileSync(cPath, content, "utf8");
    console.log(`Updated ${cPath} -> ${version}`);
  }
}

// 5. Android build.gradle.kts
const gradlePath = path.join(root, "apps/android/app/build.gradle.kts");
if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, "utf8");
  content = content.replace(/versionCode\s*=\s*\d+/, `versionCode = ${versionCode}`);
  content = content.replace(/versionName\s*=\s*"[^"]+"/, `versionName = "${version}"`);
  fs.writeFileSync(gradlePath, content, "utf8");
  console.log(`Updated ${gradlePath} -> versionName=${version}, versionCode=${versionCode}`);
}

// 6. Tauri JSON config files
function sanitizeTauriVersion(v) {
  if (!v.includes("-")) return v;
  const parts = v.split("-");
  const mainVersion = parts[0];
  const prerelease = parts.slice(1).join("-");
  const match = prerelease.match(/(\d+)$/);
  if (match && parseInt(match[1], 10) <= 65535) {
    return `${mainVersion}-${match[1]}`;
  }
  return mainVersion;
}

const tauriVersion = sanitizeTauriVersion(version);

const posTauriDir = path.join(root, "apps/pos/src-tauri");
if (fs.existsSync(posTauriDir)) {
  const tauriConfigs = [
    ...fs.readdirSync(posTauriDir)
      .filter(f => f.startsWith("tauri.") && f.endsWith(".json"))
      .map(f => path.join(posTauriDir, f)),
    path.join(root, "apps/bakery/src-tauri/tauri.conf.json")
  ];

  for (const tPath of tauriConfigs) {
    if (fs.existsSync(tPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(tPath, "utf8"));
        cfg.version = tauriVersion;
        fs.writeFileSync(tPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
        console.log(`Updated ${tPath} -> ${tauriVersion}`);
      } catch (e) {
        console.error(`Failed to update ${tPath}:`, e.message);
      }
    }
  }
}

console.log(`Version synchronization complete for ${version}.`);
