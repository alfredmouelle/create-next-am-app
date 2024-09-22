#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import fsExtra from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const eslintConf = fs.readFileSync(path.join(__dirname, 'configs/eslintrc.json'), 'utf8');
const prettierConf = fs.readFileSync(path.join(__dirname, 'configs/prettierrc.json'), 'utf8');
const nextConf = fs.readFileSync(path.join(__dirname, 'configs/next-config.js'), 'utf8');
const appConf = fs.readFileSync(path.join(__dirname, 'configs/app-config.js'), 'utf8')
const middlewareConf = fs.readFileSync(path.join(__dirname, 'configs/middleware.js'), 'utf8')
const nextSafeActionConf = fs.readFileSync(path.join(__dirname, 'configs/next-safe-actions.js'), 'utf8');
const nextSitemapConf = fs.readFileSync(path.join(__dirname, 'configs/next-sitemap.js'), 'utf8')
const resendConf = fs.readFileSync(path.join(__dirname, 'configs/resend.js'), 'utf8')
const envConf = fs.readFileSync(path.join(__dirname, 'configs/env.txt'), 'utf8');
const cursorConf = fs.readFileSync(path.join(__dirname, 'configs/cursor.txt'), 'utf8');
const readmeConf = fs.readFileSync(path.join(__dirname, 'configs/readme.md'), 'utf8');

const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande: ${command}`, error);
    process.exit(1);
  }
};

function getPmx(pm) {
  switch (pm) {
    case 'npm':
      return 'npx';
    case 'pnpm':
      return 'pnpm dlx'
    case 'yarn':
      return 'yarn'
    default:
      return 'bunx';
  }
}

const updatePackageJson = (projectPath) => {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  packageJson.scripts = {
    ...packageJson.scripts,
    'lint': 'next lint',
    "format": "prettier app/ src/ --write",
    'type-check': 'tsc --noEmit',
    'postbuild': 'next-sitemap',
    'vercel-build': "next build"
  };
  packageJson.author = {
    "name": "Alfred Mouelle",
    "email": "alfredmouelle@gmail.com",
    "url": "https://alfred-mouelle.vercel.app"
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

const updateTailwindConfig = (projectPath) => {
  const tailwindConfigPath = path.join(projectPath, 'tailwind.config.ts');
  let tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');

  if (!tailwindConfig.includes('@tailwindcss/typography')) {
    tailwindConfig = tailwindConfig.replace(
      'plugins: [require("tailwindcss-animate")],',
      `plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],`
    );

    if (!tailwindConfig.includes('plugins: [')) {
      tailwindConfig = tailwindConfig.replace(
        '}',
        `  plugins: [require('@tailwindcss/typography')],\n}`
      );
    }

    if (tailwindConfig.includes('"./src/pages/**/*.{js,ts,jsx,tsx,mdx}"')) {
      tailwindConfig = tailwindConfig.replace(
        '"./src/pages/**/*.{js,ts,jsx,tsx,mdx}"',
        '"./app/**/*.{ts,tsx,mdx}"'
      );
    }

    if (tailwindConfig.includes('"./src/components/**/*.{js,ts,jsx,tsx,mdx}"')) {
      tailwindConfig = tailwindConfig.replace(
        '"./src/components/**/*.{js,ts,jsx,tsx,mdx}",',
        '"./src/**/*.{ts,tsx,mdx}"'
      );
    }

    if (tailwindConfig.includes('"./src/app/**/*.{js,ts,jsx,tsx,mdx}"')) {
      tailwindConfig = tailwindConfig.replace(
        '"./src/app/**/*.{js,ts,jsx,tsx,mdx}",',
        ''
      );
    }

    fs.writeFileSync(tailwindConfigPath, tailwindConfig);
  }
};

const moveAppFolder = (projectPath, useI18n) => {
  const srcAppPath = path.join(projectPath, 'src', 'app');
  const rootAppPath = path.join(projectPath, 'app');

  if (fs.existsSync(srcAppPath)) {
    fs.renameSync(srcAppPath, rootAppPath);

    const componentsJsonPath = path.join(projectPath, 'components.json');
    const componentsJson = JSON.parse(fs.readFileSync(componentsJsonPath, 'utf8'));
    componentsJson.tailwind = { ...componentsJson.tailwind, "css": "app/globals.css" }
    fs.writeFileSync(componentsJsonPath, JSON.stringify(componentsJson, null, 2));

    if (useI18n) {
      const localeDirPath = path.join(rootAppPath, '[locale]');
      if (!fs.existsSync(localeDirPath)) {
        fs.mkdirSync(localeDirPath);
      }


      const layout = fs.readFileSync(path.join(__dirname, 'configs/app/intl-layout.js'), 'utf8');
      fs.writeFileSync(path.join(projectPath, 'app/layout.tsx'), layout);
      fs.readdirSync(rootAppPath).forEach(file => {
        if (file.endsWith('.tsx')) {
          const oldPath = path.join(rootAppPath, file);
          const newPath = path.join(localeDirPath, file);
          fs.renameSync(oldPath, newPath);
        }
      });
    }
  }
};

const copyLocalesFolder = (projectPath) => {
  const localesSourcePath = path.join(__dirname, 'configs', 'locales');
  const localesDestPath = path.join(projectPath, 'locales');

  if (fs.existsSync(localesSourcePath)) {
    fsExtra.copySync(localesSourcePath, localesDestPath);
    console.log('Dossier locales copié à la racine du projet.');
  }
};

const commitProject = (projectPath) => {
  process.chdir(projectPath);
  
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit --amend --no-edit', { stdio: 'inherit' });
  } catch (error) {
    console.error('Erreur lors du commit amend:', error);
  }
};

const createNextApp = async () => {
  const { pm } = await inquirer.prompt([{ type: 'list', name: 'pm', message: 'Quel package manager utiliser ?', choices: ['bun', 'npm', 'pnpm', 'yarn'] }]);
  const pmx = getPmx(pm);

  const { projectName } = await inquirer.prompt([{ type: 'input', name: 'projectName', message: 'Quel est le nom de votre projet ?', default: 'my-next-am-app' }]);
  const projectPath = path.join(process.cwd(), projectName);

  console.log('Création du projet Next.js...');
  runCommand(`${pmx} create-next-app@latest ${projectName} --typescript --eslint --tailwind --app --src-dir --import-alias "@/*"`);

  process.chdir(projectPath);

  console.log('Installation des dépendances par défaut...');
  const defaultDependencies = {
    '@hookform/resolvers': 'latest',
    'zod': 'latest',
    '@mantine/hooks': 'latest',
    'lucide-react': 'latest',
    'next-safe-action': 'latest',
    'next-sitemap': 'latest',
    'next-themes': 'latest',
    'react-hook-form': 'latest',
    'sonner': 'latest',
    '@tailwindcss/typography': 'latest'
  };

  const defaultDevDependencies = {
    'prettier-plugin-tailwindcss': 'latest',
    'prettier': 'latest',
    'eslint-plugin-check-file': 'latest',
    'eslint-config-prettier': 'latest',
    'eslint-config-next': 'latest',
    '@trivago/prettier-plugin-sort-imports': 'latest',
    '@next/eslint-plugin-next': 'latest',
    '@total-typescript/ts-reset': 'latest'
  };

  runCommand(`${pm} add ${Object.keys(defaultDependencies).join(' ')}`);
  runCommand(`${pm} add -D ${Object.keys(defaultDevDependencies).join(' ')}`);
  updatePackageJson

  console.log('Installation et configuration de shadcn...');
  runCommand(`${pmx} shadcn@latest init`);

  console.log('Installation des composants shadcn...');
  const shadcnComponents = [
    'input', 'select', 'dropdown-menu', 'drawer',
    'dialog', 'skeleton', 'card', 'sheet', 'form'
  ];
  shadcnComponents.map(component => {
    runCommand(`${pmx} shadcn@latest add ${component}`);
  });
  updateTailwindConfig(projectPath)

  const { useMail } = await inquirer.prompt([{ type: 'confirm', name: 'useMail', message: 'Voulez-vous utiliser l\'envoi de mails ?' }]);
  if (useMail) {
    console.log('Installation des dépendances pour l\'envoi de mails...');
    runCommand(`${pm} add resend @react-email/components @react-email/render @react-email/tailwind`);
    fs.mkdirSync(path.join(projectPath, 'src/lib'), { recursive: true });
    fs.writeFileSync(path.join(projectPath, 'src/lib/resend.ts'), resendConf);
  }

  const { useI18n } = await inquirer.prompt([{ type: 'confirm', name: 'useI18n', message: 'Voulez-vous internationaliser l\'application ?' }]);
  if (useI18n) {
    console.log('Installation de next-international...');
    runCommand(`${pm} add next-international`);

    const tsConfig = JSON.parse(fs.readFileSync(path.join(projectPath, 'tsconfig.json'), 'utf8'));
    tsConfig.compilerOptions.paths = { ...tsConfig.compilerOptions.paths, "@locales/*": ["./locales/*"] };
    fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
    fs.writeFileSync(path.join(projectPath, 'middleware.ts'), middlewareConf);
    copyLocalesFolder(projectPath)
  }

  const { useMdx } = await inquirer.prompt([{ type: 'confirm', name: 'useMdx', message: 'Voulez-vous utiliser des fichiers MDX pour du contenu statique ?' }]);
  if (useMdx) {
    console.log('Installation des dépendances pour MDX...');
    runCommand(`${pm} add @mdx-js/loader @mdx-js/react @next/mdx gray-matter`);
    
    fs.writeFileSync(path.join(projectPath, 'next.config.js'), nextConf);
    const oldNextConfigPath = path.join(projectPath, 'next.config.mjs');
    if (fs.existsSync(oldNextConfigPath)) {
      fs.unlinkSync(oldNextConfigPath);
    }
  }

  const { dateUtil } = await inquirer.prompt([{ type: 'list', name: 'dateUtil', message: 'Utilitaire de gestion de date à installer', choices: ['date-fns', 'moment'] }]);
  if (dateUtil) {
    console.log(`Installation de ${dateUtil}...`);
    runCommand(`${pm} add ${dateUtil}`);
  }


  const { useDb } = await inquirer.prompt([{ type: 'confirm', name: 'useDb', message: 'Voulez-vous utiliser une base de données ?' }]);
  if (useDb) {
    const { usePrisma } = await inquirer.prompt([{ type: 'confirm', name: 'usePrisma', message: 'Voulez-vous utiliser Prisma ?' }]);
    
    if (usePrisma) {
      console.log('Installation et configuration de Prisma...');
      runCommand(`${pm} add -D prisma`);
      runCommand(`${pmx} prisma init`);
      const prismaSchema = `
        generator client {
          provider = "prisma-client-js"
        }
        
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }
        
        model User {
          id        Int      @id @default(autoincrement())
          email     String   @unique
          name      String?
          createdAt DateTime @default(now())
          updatedAt DateTime @updatedAt
        }
      `;
      fs.writeFileSync(path.join(projectPath, 'prisma/schema.prisma'), prismaSchema);
    } else {
      const { useDrizzle } = await inquirer.prompt([{ type: 'confirm', name: 'useDrizzle', message: 'Voulez-vous utiliser Drizzle ?' }]);
      if (useDrizzle) {
        console.log('Installation et configuration de Drizzle...');
        runCommand(`${pm} add drizzle-orm pg`);
        runCommand(`${pm} add -D drizzle-kit`);
        const drizzleSchema = `
          import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
  
          export const users = pgTable('users', {
            id: serial('id').primaryKey(),
            email: text('email').notNull().unique(),
            name: text('name'),
            createdAt: timestamp('created_at').defaultNow().notNull(),
            updatedAt: timestamp('updated_at').defaultNow().notNull(),
          });
        `;
        fs.mkdirSync(path.join(projectPath, 'src/db'), { recursive: true });
        fs.writeFileSync(path.join(projectPath, 'src/db/schema.ts'), drizzleSchema);
      }
    }
  }

  updatePackageJson(projectPath);
  fs.writeFileSync(path.join(projectPath, '.prettierrc'), prettierConf);
  fs.writeFileSync(path.join(projectPath, '.eslintrc.json'), eslintConf);
  fs.writeFileSync(path.join(projectPath, 'next-sitemap.config.js'), nextSitemapConf);
  fs.writeFileSync(path.join(projectPath, '.cursorrules'), cursorConf);
  fs.writeFileSync(path.join(projectPath, 'README.md'), readmeConf);
  fs.writeFileSync(path.join(projectPath, 'src/lib/next-safe-action.ts'), nextSafeActionConf);
  fs.writeFileSync(path.join(projectPath, '.env.local'), envConf);
  fs.writeFileSync(path.join(projectPath, 'src/app.config.ts'), appConf);

  moveAppFolder(projectPath, useI18n);
  commitProject(projectPath);
  console.log('Projet créé avec succès !');
};

createNextApp();