export interface ProjectConfig {
  pm: 'bun' | 'npm' | 'pnpm' | 'yarn';
  projectName: string;
  useMail: boolean;
  useI18n: boolean;
  useMdx: boolean;
  dateUtil: 'date-fns' | 'moment' | null;
  database: 'Prisma' | 'Drizzle' | null;
}

export const defaultConfig: Partial<ProjectConfig> = {
  pm: 'bun',
  useMdx: true,
  useMail: true,
  useI18n: true,
  database: 'Prisma',
  dateUtil: 'date-fns',
  projectName: 'my-next-app',
};

export type AppSettings = ProjectConfig & {
  rootPath: string;
  templatePath: string;
  instanceRootPath: string;
};
