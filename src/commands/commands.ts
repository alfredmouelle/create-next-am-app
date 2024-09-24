import { execSync } from 'child_process';

import { PackageDependencies } from '@/config/dependencies';
import { ProjectConfig } from '@/config/project';

function getPmx(pm: ProjectConfig['pm']) {
  switch (pm) {
    case 'npm':
      return 'npx';
    case 'pnpm':
      return 'pnpm dlx';
    case 'yarn':
      return 'yarn';
    default:
      return 'bunx';
  }
}

export function runCommand(command: string, rootPath?: string): void {
  rootPath && process.chdir(rootPath);

  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(
      `An error encountered when executing command: ${command}`,
      error
    );
    process.exit(1);
  }
}

export function pmExec(pm: ProjectConfig['pm'], command: string) {
  runCommand(`${getPmx(pm)} ${command}`);
}

export function installDependencies(
  pm: ProjectConfig['pm'],
  dependencies: PackageDependencies,
  cb?: () => void
) {
  runCommand(`${pm} add ${dependencies.base.join(' ')}`);
  if (dependencies.dev?.length) {
    runCommand(`${pm} add -D ${dependencies.dev.join(' ')}`);
  }

  cb && cb();
}

export async function commitProject(): Promise<void> {
  runCommand('git add .');
  runCommand('git commit --amend --no-edit');
}
