import inquirer from 'inquirer';

import { ProjectConfig, defaultConfig } from '../config/project';

export async function prompts(): Promise<ProjectConfig> {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'pm',
      message: 'Which package manager to use?',
      choices: ['bun', 'npm', 'pnpm', 'yarn'],
      default: defaultConfig.pm,
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'What is the name of your project?',
      default: defaultConfig.projectName,
    },
    {
      type: 'confirm',
      name: 'useMail',
      message: 'Do you want to use email sending?',
      default: defaultConfig.useMail,
    },
    {
      type: 'confirm',
      name: 'useI18n',
      message: 'Do you want to internationalize the application?',
      default: defaultConfig.useI18n,
    },
    {
      type: 'confirm',
      name: 'useMdx',
      message: 'Do you want to use MDX files for static content?',
      default: defaultConfig.useMdx,
    },
    {
      type: 'list',
      name: 'dateUtil',
      message: 'Date management utility to install',
      choices: ['None', 'date-fns', 'moment'],
      filter: (val: string) => (val === 'None' ? null : val),
    },
    {
      type: 'list',
      name: 'database',
      choices: ['None', 'Prisma', 'Drizzle'],
      message: 'Select the database manager to use',
      default: defaultConfig.database,
      filter: (value: NonNullable<ProjectConfig['database']> | 'None') =>
        value === 'None' ? null : value,
    },
  ]);
}
