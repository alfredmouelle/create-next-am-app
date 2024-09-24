import fs from 'fs';
import { default as fsExtra } from 'fs-extra';
import path from 'path';

export const FsUtils = {
  actAs: function (execPath: string) {
    process.chdir(execPath);
  },

  appRoot: function () {
    return path.resolve(__dirname, '..', '..', 'dist');
  },

  deletePath: function (targetPath: string) {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  },

  writeFile: function (content: string, filePath: string, isJson?: boolean) {
    fs.writeFileSync(
      filePath,
      isJson ? JSON.stringify(content, null, 2) : content
    );
  },

  moveFolder: function (origin: string, dest: string) {
    fsExtra.moveSync(origin, dest);
  },

  copy: function (origin: string, dest: string) {
    if (fs.existsSync(origin)) {
      fsExtra.copySync(origin, dest);
    }
  },

  isPathExists: function (folderPath: string): boolean {
    return fs.existsSync(folderPath);
  },

  createFolder: function (folderPath: string) {
    return fs.mkdirSync(folderPath, { recursive: true });
  },

  readdir: function (folderPath: string) {
    return fs.readdirSync(folderPath);
  },

  renameFolder: function (origin: string, dest: string) {
    fs.renameSync(origin, dest);
  },

  getPath: function (rootPath: string, ...paths: string[]) {
    return path.join(rootPath, ...paths);
  },

  getFileContent: function (filePath: string, isJson?: boolean) {
    const content = fs.readFileSync(filePath, 'utf8');
    return isJson ? JSON.parse(content) : content;
  },
};
