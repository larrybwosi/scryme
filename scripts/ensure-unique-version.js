const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const posPackageJsonPath = path.join(__dirname, "../apps/pos/package.json");

function getPackageVersion() {
  const content = fs.readFileSync(posPackageJsonPath, "utf8");
  const pkg = JSON.parse(content);
  return pkg.version;
}

function updatePackageVersion(newVersion) {
  const content = fs.readFileSync(posPackageJsonPath, "utf8");
  const pkg = JSON.parse(content);
  pkg.version = newVersion;
  fs.writeFileSync(
    posPackageJsonPath,
    JSON.stringify(pkg, null, 2) + "\n",
    "utf8",
  );
}

function tagExistsOnRemote(version) {
  const tag = `v${version}`;
  try {
    // Run git ls-remote to check if the tag exists on the remote repository
    const output = execSync(`git ls-remote --tags origin refs/tags/${tag}`, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      timeout: 10000,
    }).trim();

    if (output) {
      console.log(`Remote tag ${tag} exists.`);
      return true;
    }
    return false;
  } catch (error) {
    // In local development or if remote is unreachable/unconfigured, we fall back to local tags check
    console.warn(
      `Could not check remote tags: ${error.message}. Checking local tags instead.`,
    );
    try {
      const localOutput = execSync(`git tag -l ${tag}`, {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      }).trim();
      return localOutput === tag;
    } catch (localError) {
      console.error(`Could not check local tags: ${localError.message}`);
      return false;
    }
  }
}

function bumpVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);
  const suffix = match[4] || "";

  if (patch === 0 && minor === 0) {
    // Major release
    return `${major + 1}.0.0${suffix}`;
  } else if (patch === 0 && minor > 0) {
    // Minor release
    return `${major}.${minor + 1}.0${suffix}`;
  } else {
    // Patch release
    return `${major}.${minor}.${patch + 1}${suffix}`;
  }
}

function main() {
  let currentVersion = getPackageVersion();
  const initialVersion = currentVersion;
  console.log(
    `Starting unique version check. Initial version: ${initialVersion}`,
  );

  let wasBumped = false;
  while (tagExistsOnRemote(currentVersion)) {
    const nextVersion = bumpVersion(currentVersion);
    console.log(
      `Version ${currentVersion} already exists on remote. Jumping to next version: ${nextVersion}`,
    );
    currentVersion = nextVersion;
    wasBumped = true;
  }

  if (wasBumped) {
    console.log(
      `Updating apps/pos/package.json to unique version: ${currentVersion}`,
    );
    updatePackageVersion(currentVersion);

    // Sync version to other package.json files and Tauri configs
    console.log(
      "Syncing version to apps/bakery/package.json and Tauri configurations...",
    );
    const syncScriptPath = path.join(__dirname, "sync-tauri-version.sh");
    try {
      execSync(`bash "${syncScriptPath}"`, { stdio: "inherit" });
      console.log("Version synchronization complete.");
    } catch (syncError) {
      console.error(
        `Error executing sync-tauri-version.sh: ${syncError.message}`,
      );
      process.exit(1);
    }
  } else {
    console.log(
      `Version ${currentVersion} is unique and does not exist on remote. No bump required.`,
    );
  }

  // Expose the final version to GitHub Actions step outputs if running in CI
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${currentVersion}\n`,
      "utf8",
    );
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `was_bumped=${wasBumped}\n`,
      "utf8",
    );
  }
}

if (require.main === module) {
  main();
}
