import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';
import { red, green, cyan, bold, yellow } from 'kolorist';

async function run() {
  console.log(bold(cyan('\n🚀 Welcome to Scryme App Generator!\n')));

  const args = process.argv.slice(2);
  let defaultTargetDir = args[0] || 'my-scryme-store';

  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name / directory:',
        initial: defaultTargetDir,
        validate: (val) => (val.trim() ? true : 'Project name cannot be empty'),
      },
      {
        type: 'text',
        name: 'orgSlug',
        message: 'Scryme Organization Slug (orgSlug):',
        initial: 'demo-store',
        validate: (val) => (val.trim() ? true : 'Organization slug cannot be empty'),
      },
      {
        type: 'text',
        name: 'apiUrl',
        message: 'Scryme API Base URL:',
        initial: 'https://api.scryme.com',
        validate: (val) => (val.trim() ? true : 'API URL cannot be empty'),
      },
      {
        type: 'select',
        name: 'packageManager',
        message: 'Select package manager:',
        choices: [
          { title: 'pnpm', value: 'pnpm' },
          { title: 'npm', value: 'npm' },
          { title: 'yarn', value: 'yarn' },
        ],
        initial: 0,
      },
    ],
    {
      onCancel: () => {
        console.log(red('✖ Operation cancelled'));
        process.exit(1);
      },
    }
  );

  const { projectName, orgSlug, apiUrl, packageManager } = response;
  const targetPath = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetPath)) {
    const files = fs.readdirSync(targetPath);
    if (files.length > 0) {
      console.log(red(`\n✖ Directory "${projectName}" already exists and is not empty.`));
      process.exit(1);
    }
  } else {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  const templateDir = path.resolve(__dirname, '../template');

  if (!fs.existsSync(templateDir)) {
    console.log(red(`\n✖ Template directory not found at ${templateDir}`));
    process.exit(1);
  }

  console.log(cyan(`\n📁 Copying template files to ${projectName}...`));
  copyDir(templateDir, targetPath);

  // Write .env.local
  const envContent = `NEXT_PUBLIC_SCRYME_ORG_SLUG=${orgSlug}\nNEXT_PUBLIC_SCRYME_API_URL=${apiUrl}\n`;
  fs.writeFileSync(path.join(targetPath, '.env.local'), envContent, 'utf-8');

  // Update package.json name if present
  const pkgPath = path.join(targetPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = projectName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
  }

  // Rename _gitignore to .gitignore if needed
  const gitignorePath = path.join(targetPath, '_gitignore');
  if (fs.existsSync(gitignorePath)) {
    fs.renameSync(gitignorePath, path.join(targetPath, '.gitignore'));
  }

  console.log(green('✔ Project files generated successfully.'));

  console.log(cyan(`\n📦 Installing dependencies using ${packageManager}...`));
  try {
    execSync(`${packageManager} install`, {
      cwd: targetPath,
      stdio: 'inherit',
    });
    console.log(green('\n✔ Dependencies installed successfully!'));
  } catch (err) {
    console.log(yellow(`\n⚠️ Failed to install dependencies automatically. You can run "${packageManager} install" manually.`));
  }

  console.log(bold(green('\n🎉 Setup complete! Next steps:\n')));
  console.log(cyan(`  cd ${projectName}`));
  console.log(cyan(`  ${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev\n`));
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

run().catch((err) => {
  console.error(red('An error occurred during project generation:'), err);
  process.exit(1);
});
