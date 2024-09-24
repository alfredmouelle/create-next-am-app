import { FsUtils } from '@/utils/filesystem';

import { commitProject, pmExec } from '@/commands/commands';
import { AppSettings } from './project';

export function finalizeProject(appSettings: AppSettings) {
  updateProjectFiles(appSettings);
  moveAppFolder(appSettings);

  FsUtils.actAs(appSettings.instanceRootPath);
  commitProject();
  console.log('Project created successfully!');
}

export function updateProjectFiles(appSettings: AppSettings) {
  const templatePath = appSettings.templatePath;
  const instanceRootPath = appSettings.instanceRootPath;

  updatePackageJson(instanceRootPath);
  updateTailwindConfigs(instanceRootPath);

  const readmePath = FsUtils.getPath(templatePath, 'base', 'readme.md');
  FsUtils.writeFile(
    FsUtils.getFileContent(readmePath),
    FsUtils.getPath(instanceRootPath, 'README.md')
  );

  const cursorPath = FsUtils.getPath(templatePath, 'base', 'cursor.txt');
  FsUtils.writeFile(
    FsUtils.getFileContent(cursorPath),
    FsUtils.getPath(instanceRootPath, '.cursorrules')
  );

  const eslintRcPath = FsUtils.getPath(
    templatePath,
    'configs',
    'eslintrc.json'
  );
  FsUtils.writeFile(
    FsUtils.getFileContent(eslintRcPath, true),
    FsUtils.getPath(instanceRootPath, '.eslintrc.json'),
    true
  );

  const prettierRcPath = FsUtils.getPath(
    templatePath,
    'configs',
    'prettierrc.json'
  );
  FsUtils.writeFile(
    FsUtils.getFileContent(prettierRcPath, true),
    FsUtils.getPath(instanceRootPath, '.prettierrc'),
    true
  );

  const envPath = FsUtils.getPath(templatePath, 'base', 'env.txt');
  FsUtils.writeFile(
    FsUtils.getFileContent(envPath),
    FsUtils.getPath(instanceRootPath, '.env')
  );

  const nextSafeActionLib = FsUtils.getPath(
    templatePath,
    'libs',
    'next-safe-actions.txt'
  );
  FsUtils.writeFile(
    FsUtils.getFileContent(nextSafeActionLib),
    FsUtils.getPath(instanceRootPath, 'src', 'lib', 'next-safe-action.ts')
  );

  if (appSettings.useMdx) {
    const nextConfigPath = FsUtils.getPath(
      templatePath,
      'configs',
      'next-config.txt'
    );
    FsUtils.writeFile(
      FsUtils.getFileContent(nextConfigPath),
      FsUtils.getPath(instanceRootPath, 'next.config.js')
    );

    FsUtils.deletePath(FsUtils.getPath(instanceRootPath, 'next.config.mjs'));
  }

  if (appSettings.useMail) {
    const resendLib = FsUtils.getPath(templatePath, 'libs', 'resend.txt');
    FsUtils.writeFile(
      FsUtils.getFileContent(resendLib),
      FsUtils.getPath(instanceRootPath, 'src', 'lib', 'resend.ts')
    );
  }

  if (appSettings.database === 'Prisma') {
    pmExec(appSettings.pm, 'prisma init');
    const prismaLib = FsUtils.getPath(templatePath, 'libs', 'prisma.txt');
    FsUtils.writeFile(
      FsUtils.getFileContent(prismaLib),
      FsUtils.getPath(instanceRootPath, 'prisma', 'schema.prisma')
    );
  }

  if (appSettings.database === 'Drizzle') {
    const drizzleLib = FsUtils.getPath(templatePath, 'libs', 'drizzle.txt');
    const drizzleOut = FsUtils.createFolder(FsUtils.getPath(instanceRootPath, 'src', 'db'))
    if (drizzleOut) {
      FsUtils.writeFile(
        FsUtils.getFileContent(drizzleLib),
        FsUtils.getPath(drizzleOut, 'schema.ts')
      );
    }
  }

  const siteMapConfig = FsUtils.getPath(
    templatePath,
    'configs',
    'next-sitemap.txt'
  );
  FsUtils.writeFile(
    FsUtils.getFileContent(siteMapConfig),
    FsUtils.getPath(instanceRootPath, 'next-sitemap.config.js')
  );

  const appConfig = FsUtils.getPath(templatePath, 'configs', 'app.config.txt');
  FsUtils.writeFile(
    FsUtils.getFileContent(appConfig),
    FsUtils.getPath(instanceRootPath, 'src', 'app.config.ts')
  );

  if (appSettings.useI18n) {
    const tsConfigPath = FsUtils.getPath(instanceRootPath, 'tsconfig.json');
    const tsConfigContent = FsUtils.getFileContent(tsConfigPath, true);
    tsConfigContent.compilerOptions.paths = {
      ...tsConfigContent.compilerOptions.paths,
      '@locales/*': ['./locales/*'],
    };
    FsUtils.writeFile(tsConfigContent, tsConfigPath, true);

    const middlewareConfig = FsUtils.getPath(
      templatePath,
      'configs',
      'middleware.txt'
    );
    FsUtils.writeFile(
      FsUtils.getFileContent(middlewareConfig),
      FsUtils.getPath(instanceRootPath, 'middleware.ts')
    );

    const localesSourcePath = FsUtils.getPath(templatePath, 'locales');
    const localesDestPath = FsUtils.getPath(instanceRootPath, 'locales');
    FsUtils.copy(localesSourcePath, localesDestPath);
  }
}

function updatePackageJson(rootPath: string) {
  const filePath = FsUtils.getPath(rootPath, 'package.json');
  const fileContent = FsUtils.getFileContent(filePath, true);

  fileContent.scripts = {
    ...fileContent.scripts,
    lint: 'next lint',
    format: 'prettier app/ src/ --write',
    'type-check': 'tsc --noEmit',
    postbuild: 'next-sitemap',
    'vercel-build': 'next build',
  };
  fileContent.author = {
    name: 'Alfred Mouelle',
    email: 'alfredmouelle@gmail.com',
    url: 'https://alfredmouelle.com',
  };

  FsUtils.writeFile(fileContent, filePath, true);
}

function updateTailwindConfigs(instanceRootPath: string) {
  const filePath = FsUtils.getPath(instanceRootPath, 'tailwind.config.ts');
  let fileContent = FsUtils.getFileContent(filePath);

  if (fileContent.includes('@tailwindcss/typography')) {
    return;
  }

  fileContent = fileContent.replace(
    'plugins: [require("tailwindcss-animate")],',
    `plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],`
  );

  if (!fileContent.includes('plugins: [')) {
    fileContent = fileContent.replace(
      '}',
      `  plugins: [require('@tailwindcss/typography')],\n}`
    );
  }

  if (fileContent.includes('"./src/pages/**/*.{js,ts,jsx,tsx,mdx}"')) {
    fileContent = fileContent.replace(
      '"./src/pages/**/*.{js,ts,jsx,tsx,mdx}"',
      '"./app/**/*.{ts,tsx,mdx}"'
    );
  }

  if (fileContent.includes('"./src/components/**/*.{js,ts,jsx,tsx,mdx}"')) {
    fileContent = fileContent.replace(
      '"./src/components/**/*.{js,ts,jsx,tsx,mdx}",',
      '"./src/**/*.{ts,tsx,mdx}"'
    );
  }

  if (fileContent.includes('"./src/app/**/*.{js,ts,jsx,tsx,mdx}"')) {
    fileContent = fileContent.replace(
      '"./src/app/**/*.{js,ts,jsx,tsx,mdx}",',
      ''
    );
  }

  FsUtils.writeFile(fileContent, filePath);
}

function moveAppFolder(appSettings: AppSettings) {
  const instanceRootPath = appSettings.instanceRootPath;
  const srcAppPath = FsUtils.getPath(instanceRootPath, 'src', 'app');
  const rootAppPath = FsUtils.getPath(instanceRootPath, 'app');

  if (!FsUtils.isPathExists(srcAppPath)) {
    return;
  }

  FsUtils.renameFolder(srcAppPath, rootAppPath);

  const componentsJsonPath = FsUtils.getPath(
    instanceRootPath,
    'components.json'
  );
  const componentsJson = FsUtils.getFileContent(componentsJsonPath, true);
  componentsJson.tailwind = {
    ...componentsJson.tailwind,
    css: 'app/globals.css',
  };
  FsUtils.writeFile(componentsJson, componentsJsonPath, true);

  if (!appSettings.useI18n) {
    return;
  }

  const localeDirPath = FsUtils.getPath(rootAppPath, '[locale]');
  if (!FsUtils.isPathExists(localeDirPath)) {
    FsUtils.createFolder(localeDirPath);
  }

  const layout = FsUtils.getFileContent(
    FsUtils.getPath(appSettings.templatePath, 'nextjs', 'intl-layout.txt')
  );
  FsUtils.writeFile(layout, FsUtils.getPath(rootAppPath, 'layout.tsx'));
  FsUtils.readdir(rootAppPath).forEach((file) => {
    if (file.endsWith('.tsx')) {
      const oldPath = FsUtils.getPath(rootAppPath, file);
      const newPath = FsUtils.getPath(localeDirPath, file);
      FsUtils.renameFolder(oldPath, newPath);
    }
  });
}
