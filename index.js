#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const fsExtra = require('fs-extra');

const eslintConf = require('./configs/eslintrc.json')
const prettierConf = require('./configs/prettierrc.json')
const nextConf = fs.readFileSync(path.join(__dirname, 'configs/next-config.js'), 'utf8');
const appConf = fs.readFileSync(path.join(__dirname, 'configs/app-config.js'), 'utf8')
const middlewareConf = fs.readFileSync(path.join(__dirname, 'configs/middleware.js'), 'utf8')
const nextSafeActionConf = fs.readFileSync(path.join(__dirname, 'configs/next-safe-actions.js'), 'utf8');
const nextSitemapConf = fs.readFileSync(path.join(__dirname, 'configs/next-sitemap.js'), 'utf8')
const envConf = fs.readFileSync(path.join(__dirname, 'configs/env.txt'), 'utf8');
const cursorConf = fs.readFileSync(path.join(__dirname, 'configs/cursor.txt'), 'utf8');
const readmeConf = fs.readFileSync(path.join(__dirname, 'configs/readme.md'), 'utf8');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande: ${command}`, error);
    process.exit(1);
  }
};

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
    console.log('Tailwind configuration updated with @tailwindcss/typography plugin.');
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

    console.log('Dossier app déplacé de src/app à la racine du projet.');

    if (useI18n) {
      const localeDirPath = path.join(rootAppPath, '[locale]');
      if (!fs.existsSync(localeDirPath)) {
        fs.mkdirSync(localeDirPath);
      }

      // Déplacer tous les fichiers .tsx dans le sous-dossier [locale]
      fs.readdirSync(rootAppPath).forEach(file => {
        if (file.endsWith('.tsx')) {
          const oldPath = path.join(rootAppPath, file);
          const newPath = path.join(localeDirPath, file);
          fs.renameSync(oldPath, newPath);
        }
      });

      console.log('Fichiers .tsx déplacés dans le sous-dossier [locale] pour l\'internationalisation.');
    }
  } else {
    console.log('Le dossier src/app n\'existe pas. Aucun déplacement nécessaire.');
  }
};

const copyLocalesFolder = (projectPath) => {
  const localesSourcePath = path.join(__dirname, 'configs', 'locales');
  const localesDestPath = path.join(projectPath, 'locales');

  if (fs.existsSync(localesSourcePath)) {
    fsExtra.copySync(localesSourcePath, localesDestPath);
    console.log('Dossier locales copié à la racine du projet.');
  } else {
    console.log('Le dossier locales n\'existe pas dans configs.');
  }
};

const finalizeProject = (projectPath) => {
  process.chdir(projectPath);
  
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit --amend --no-edit', { stdio: 'inherit' });
  } catch (error) {
    console.error('Erreur lors du commit amend:', error);
  }
};

const createNextApp = async () => {
  const projectName = await question('Quel est le nom de votre projet ? ');
  const projectPath = path.join(process.cwd(), projectName);

  console.log('Création du projet Next.js...');
  runCommand(`bunx create-next-app@latest ${projectName} --typescript --eslint --tailwind --app --src-dir --import-alias "@/*"`);

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

  runCommand(`bun add ${Object.keys(defaultDependencies).join(' ')}`);
  runCommand(`bun add -D ${Object.keys(defaultDevDependencies).join(' ')}`);
  updatePackageJson

  console.log('Installation et configuration de shadcn...');
  runCommand('bunx shadcn@latest init');

  // console.log('Installation des composants shadcn...');
  // const shadcnComponents = [
  //   'input', 'button', 'select', 'label', 'dropdown-menu', 'drawer',
  //   'dialog', 'skeleton', 'card', 'sheet', 'form'
  // ];
  // shadcnComponents.map(component => {
  //   runCommand(`bunx shadcn@latest add ${component}`);
  // });
  updateTailwindConfig(projectPath)

  const useMail = await question('Voulez-vous utiliser l\'envoi de mails ? (y/n) ');
  if (useMail.toLowerCase() !== 'n') {
    console.log('Installation des dépendances pour l\'envoi de mails...');
    runCommand('bun add resend @react-email/components @react-email/render @react-email/tailwind');
    const resendConfig = `
      import { Resend } from 'resend';

      export const resend = new Resend(process.env.RESEND_API_KEY);
    `;
    fs.mkdirSync(path.join(projectPath, 'src/lib'), { recursive: true });
    fs.writeFileSync(path.join(projectPath, 'src/lib/resend.ts'), resendConfig);
  }

  const useI18n = await question('Voulez-vous internationaliser l\'application ? (y/n) ');
  if (useI18n.toLowerCase() !== 'n') {
    console.log('Installation de next-international...');
    runCommand('bun add next-international');

    console.log('Mis à jour du fichier tsconfig.json...');
    const tsConfig = JSON.parse(fs.readFileSync(path.join(projectPath, 'tsconfig.json'), 'utf8'));
    tsConfig.compilerOptions.paths = { ...tsConfig.compilerOptions.paths, "@locales/*": ["./locales/*"] };
    fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
    
    console.log('Configuration du middleware...');
    fs.writeFileSync(path.join(projectPath, 'middleware.ts'), middlewareConf);

    copyLocalesFolder(projectPath)
  }

  const useMdx = await question('Voulez-vous utiliser des fichiers MDX pour du contenu statique ? (y/n) ');
  if (useMdx.toLowerCase() !== 'n') {
    console.log('Installation des dépendances pour MDX...');
    runCommand('bun add @mdx-js/loader @mdx-js/react @next/mdx gray-matter');
  }

  const useDateFns = await question('Voulez-vous installer date-fns pour gérer les dates ? (y/n) ');
  if (useDateFns.toLowerCase() !== 'n') {
    console.log('Installation de date-fns...');
    runCommand('bun add date-fns');
  }


  const useDb = await question('Voulez-vous utiliser une base de données ? (y/n) ');
  if (useDb.toLowerCase() !== 'n') {
    const usePrisma = await question('Voulez-vous utiliser Prisma ? (y/n) ');
    
    if (usePrisma.toLowerCase() !== 'n') {
      console.log('Installation et configuration de Prisma...');
      runCommand('bun add -D prisma');
      runCommand('bunx prisma init');
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
      const useDrizzle = await question('Voulez-vous utiliser Drizzle ? (y/n) ');
      if (useDrizzle.toLowerCase() !== 'n') {
        console.log('Installation et configuration de Drizzle...');
        runCommand('bun add drizzle-orm pg');
        runCommand('bun add -D drizzle-kit');
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

  console.log('Mise à jour du package.json...');
  updatePackageJson(projectPath);

  console.log('Configuration de Prettier...');
  fs.writeFileSync(path.join(projectPath, '.prettierrc'), JSON.stringify(prettierConf, null, 2));

  console.log('Configuration de ESLint...');
  fs.writeFileSync(path.join(projectPath, '.eslintrc.json'), JSON.stringify(eslintConf, null, 2));

  console.log('Configuration de next-sitemap...');
  fs.writeFileSync(path.join(projectPath, 'next-sitemap.config.js'), nextSitemapConf);

  console.log('Configuration de cursor IDE...');
  fs.writeFileSync(path.join(projectPath, '.cursorrules'), cursorConf);
  
  console.log('Intégration du readme');
  fs.writeFileSync(path.join(projectPath, 'README.md'), readmeConf);

  console.log('Configuration de Next Safe Actions...');
  fs.writeFileSync(path.join(projectPath, 'src/lib/next-safe-action.ts'), nextSafeActionConf);

  console.log('Configuration des variables d\'environnement...');
  fs.writeFileSync(path.join(projectPath, '.env.local'), envConf);

  console.log('Configuration des paramètes système');
  fs.writeFileSync(path.join(projectPath, 'src/app.config.ts'), appConf);

  if (useMdx.toLowerCase() !== 'n') {
    console.log('Configuration de MDX...');
    fs.writeFileSync(path.join(projectPath, 'next.config.js'), nextConf);
  }

  moveAppFolder(projectPath, useI18n.toLowerCase !== 'n');
  finalizeProject(projectPath);
  console.log('Projet créé avec succès !');
  rl.close();
};

createNextApp();