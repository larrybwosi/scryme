const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const posPackageJsonPath = path.join(__dirname, "../apps/pos/package.json");
const paths = [
  path.join(__dirname, "../apps/pos/package.json"),
  path.join(__dirname, "../apps/bakery/package.json"),
  path.join(__dirname, "../packages/v3-sdk/package.json"),
  path.join(__dirname, "../packages/sdk/package.json")
];

function parseSemver(v) {
  const match = v.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) return { major: 0, minor: 0, patch: 0, suffix: "" };
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    suffix: match[4] || ""
  };
}

function compareSemver(v1, v2) {
  const p1 = parseSemver(v1);
  const p2 = parseSemver(v2);
  if (p1.major !== p2.major) return p1.major - p2.major;
  if (p1.minor !== p2.minor) return p1.minor - p2.minor;
  if (p1.patch !== p2.patch) return p1.patch - p2.patch;
  return p1.suffix.localeCompare(p2.suffix);
}

function getHighestVersion() {
  let highest = "0.0.0";
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
        if (pkg.version && compareSemver(pkg.version, highest) > 0) {
          highest = pkg.version;
        }
      } catch (e) {
        console.warn(`Error reading/parsing package at ${p}: ${e.message}`);
      }
    }
  }
  return highest;
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
      // Both remote and local checks failed - we genuinely don't know whether
      // this tag exists. Publishing under an unverified version could silently
      // overwrite or collide with an existing release, so fail loudly instead
      // of assuming it's safe to proceed.
      console.error(`Could not check local tags: ${localError.message}`);
      throw new Error(
        `Unable to verify whether tag ${tag} exists (remote and local checks both failed) — refusing to guess.`,
      );
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
  return `${major}.${minor}.${patch + 1}${suffix}`;
}

function main() {
  let currentVersion = getHighestVersion();
  const initialVersion = currentVersion;
  console.log(
    `Starting unique version check. Determined highest version: ${initialVersion}`,
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

  // Get current pos version to see if it needs update
  let posVersion = "0.0.0";
  if (fs.existsSync(posPackageJsonPath)) {
    posVersion = JSON.parse(fs.readFileSync(posPackageJsonPath, "utf8")).version;
  }

  if (currentVersion !== posVersion || wasBumped) {
    console.log(
      `Updating apps/pos/package.json to version: ${currentVersion}`,
    );
    updatePackageVersion(currentVersion);
  } else {
    console.log(
      `Version ${currentVersion} is unique and does not exist on remote. No bump required.`,
    );
  }

  // Sync version to other package.json files and Tauri configs on every run
  console.log(
    "Syncing version to other packages, SDKs, and Tauri configurations...",
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