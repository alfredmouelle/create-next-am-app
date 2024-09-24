import 'module-alias/register';

import {
  BaseDependencies,
  DatabaseDependencies,
  DateDependencies,
  I18nDependencies,
  MailDependencies,
  MdxDependencies,
} from '@/config/dependencies';
import { AppSettings } from '@/config/project';
import { finalizeProject } from '@/config/update-config';
import { FsUtils } from '@/utils/filesystem';

import { installDependencies, pmExec } from './commands';
import { prompts } from './prompts';

export const createNextApp = async () => {
  const promptAnswers = await prompts();
  const appRootPath = FsUtils.getPath(process.cwd());
  const templatePath = FsUtils.getPath(appRootPath, 'src', 'templates');
  const instanceRootPath = FsUtils.getPath(
    appRootPath,
    promptAnswers.projectName
  );
  const appSettings = {
    rootPath: appRootPath,
    instanceRootPath,
    templatePath,
    ...promptAnswers,
  } satisfies AppSettings;

  console.log('Initiating the creation of the Next.js project...');
  pmExec(
    promptAnswers.pm,
    `create-next-app@latest ${promptAnswers.projectName} --typescript --eslint --tailwind --app --src-dir --import-alias "@/*"`
  );

  FsUtils.actAs(instanceRootPath);

  console.log('Installing base libraries...');
  installDependencies(promptAnswers.pm, BaseDependencies);

  console.log('Installing and configuring shadcn...');
  pmExec(promptAnswers.pm, 'shadcn@latest init');
  ['input', 'select', 'dropdown-menu', 'drawer', 'dialog', 'skeleton', 'card', 'sheet', 'form'].map(
    component => pmExec(promptAnswers.pm, `shadcn@latest add ${component}`)
  );

  if (promptAnswers.useMail) {
    console.log('Installing dependencies for email management...');
    installDependencies(promptAnswers.pm, MailDependencies);
  }

  if (promptAnswers.dateUtil) {
    console.log(`Installing ${promptAnswers.dateUtil}...`);
    installDependencies(
      promptAnswers.pm,
      DateDependencies[promptAnswers.dateUtil]
    );
  }

  if (promptAnswers.useMdx) {
    console.log('Installing dependencies for MDX content...');
    installDependencies(promptAnswers.pm, MdxDependencies);
  }

  if (promptAnswers.useI18n) {
    console.log("Installing packages for internationalization...");
    installDependencies(promptAnswers.pm, I18nDependencies);
  }

  if (promptAnswers.database) {
    console.log(`Installing ${promptAnswers.database}...`);
    installDependencies(
      promptAnswers.pm,
      DatabaseDependencies[promptAnswers.database]
    );
  }

  finalizeProject(appSettings);
};
