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
        type: 'multiselect',
        name: 'features',
        message: 'Select features to include in your Scryme app:',
        choices: [
          { title: 'Products Catalog', value: 'products', selected: true },
          { title: 'Services & Bookings', value: 'services', selected: true },
          { title: 'Shopping Cart', value: 'cart', selected: true },
          { title: 'Customer Authentication', value: 'auth', selected: true },
          { title: 'Customer Registration & Management', value: 'customers', selected: true },
        ],
        hint: '- Space to select. Return to submit',
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

  const { projectName, orgSlug, apiUrl, features = [], packageManager } = response;
  const targetPath = path.resolve(process.cwd(), projectName);

  const hasProducts = features.includes('products');
  const hasServices = features.includes('services');
  const hasCart = features.includes('cart');
  const hasAuth = features.includes('auth');
  const hasCustomers = features.includes('customers');

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

  // Strip unwanted features based on user selection
  if (!hasCart) {
    fs.rmSync(path.join(targetPath, 'providers/cart-provider.tsx'), { force: true });
    fs.rmSync(path.join(targetPath, 'app/checkout'), { recursive: true, force: true });
  }

  if (!hasAuth && !hasCustomers) {
    fs.rmSync(path.join(targetPath, 'providers/customer-auth-provider.tsx'), { force: true });
    fs.rmSync(path.join(targetPath, 'app/account'), { recursive: true, force: true });
    fs.rmSync(path.join(targetPath, 'app/register'), { recursive: true, force: true });
  } else {
    if (!hasCustomers) {
      fs.rmSync(path.join(targetPath, 'app/register'), { recursive: true, force: true });
    }
    if (!hasAuth) {
      fs.rmSync(path.join(targetPath, 'app/account'), { recursive: true, force: true });
    }
  }

  if (!hasServices) {
    fs.rmSync(path.join(targetPath, 'app/services'), { recursive: true, force: true });
  }

  if (!hasProducts) {
    fs.rmSync(path.join(targetPath, 'app/products'), { recursive: true, force: true });
  }

  // Adjust root layout wrappers
  generateLayoutFile(targetPath, { hasCart, hasAuth: hasAuth || hasCustomers });

  // Adjust Navbar links & features
  generateNavbarFile(targetPath, { hasProducts, hasServices, hasCart, hasAuth: hasAuth || hasCustomers });

  // Write .env.local
  const envContent = `NEXT_PUBLIC_SCRYME_ORG_SLUG=${orgSlug}\nNEXT_PUBLIC_SCRYME_API_URL=${apiUrl}\n`;
  fs.writeFileSync(path.join(targetPath, '.env.local'), envContent, 'utf-8');

  // Update package.json name
  const pkgPath = path.join(targetPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = projectName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
  }

  // Rename _gitignore to .gitignore
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

function generateLayoutFile(targetPath: string, opts: { hasCart: boolean; hasAuth: boolean }) {
  const { hasCart, hasAuth } = opts;

  let imports = "import type { Metadata } from 'next';\nimport './globals.css';\nimport { Navbar } from '@/components/navbar';\n";
  if (hasAuth) imports += "import { CustomerAuthProvider } from '@/providers/customer-auth-provider';\n";
  if (hasCart) imports += "import { CartProvider } from '@/providers/cart-provider';\n";

  let innerContent = `
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>`;

  if (hasCart) {
    innerContent = `<CartProvider>${innerContent}\n          </CartProvider>`;
  }
  if (hasAuth) {
    innerContent = `<CustomerAuthProvider>\n          ${innerContent}\n        </CustomerAuthProvider>`;
  }

  const content = `${imports}
export const metadata: Metadata = {
  title: 'Scryme E-commerce Store',
  description: 'Powered by Scryme V3 SDK',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
        ${innerContent}
      </body>
    </html>
  );
}
`;

  fs.writeFileSync(path.join(targetPath, 'app/layout.tsx'), content, 'utf-8');
}

function generateNavbarFile(
  targetPath: string,
  opts: { hasProducts: boolean; hasServices: boolean; hasCart: boolean; hasAuth: boolean }
) {
  const { hasProducts, hasServices, hasCart, hasAuth } = opts;

  let imports = "'use client';\n\nimport React, { useState } from 'react';\nimport Link from 'next/link';\n";
  const icons: string[] = ['ShoppingBag'];

  if (hasAuth) icons.push('User');
  if (hasCart) icons.push('ShoppingCart', 'X');

  imports += `import { ${icons.join(', ')} } from 'lucide-react';\n`;

  if (hasCart) imports += "import { useCart } from '@/providers/cart-provider';\n";
  if (hasAuth) imports += "import { useCustomerAuth } from '@/providers/customer-auth-provider';\n";

  let navItems = '';
  if (hasProducts) {
    navItems += '\n            <Link href="/" className="text-sm font-medium hover:text-indigo-600 transition">Products</Link>';
  }
  if (hasServices) {
    navItems += '\n            <Link href="/services" className="text-sm font-medium hover:text-indigo-600 transition">Services</Link>';
  }
  if (hasAuth) {
    navItems += `
            <Link href="/account" className="text-sm font-medium hover:text-indigo-600 transition flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{user ? user.firstName || 'Account' : 'Login'}</span>
            </Link>`;
  }

  let cartButton = '';
  let slideoverCart = '';

  if (hasCart) {
    cartButton = `
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 transition"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>`;

    slideoverCart = `
      {/* Slide-over Cart */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col p-6">
            <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Your Cart ({totalItems})</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.length === 0 ? (
                <p className="text-center text-zinc-500 py-10">Your cart is empty.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
                    <div>
                      <h4 className="font-medium text-zinc-900 dark:text-white">{item.name}</h4>
                      <p className="text-sm text-zinc-500">\${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t pt-4 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Subtotal:</span>
                  <span>\${subtotal.toFixed(2)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}`;
  }

  const content = `${imports}
export const Navbar: React.FC = () => {
  ${hasCart ? 'const { totalItems, items, subtotal, removeItem, updateQuantity } = useCart();' : ''}
  ${hasAuth ? 'const { user } = useCustomerAuth();' : ''}
  ${hasCart ? 'const [isCartOpen, setIsCartOpen] = useState(false);' : ''}

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            <span>ScrymeStore</span>
          </Link>

          <nav className="flex items-center gap-6">
            ${navItems}
            ${cartButton}
          </nav>
        </div>
      </header>
      ${slideoverCart}
    </>
  );
};
`;

  fs.writeFileSync(path.join(targetPath, 'components/navbar.tsx'), content, 'utf-8');
}

run().catch((err) => {
  console.error(red('An error occurred during project generation:'), err);
  process.exit(1);
});
