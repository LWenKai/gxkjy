import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join, normalize, relative } from 'path';

export interface MemoryUploadFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface SavedUploadFile {
  originalName: string;
  storedName: string;
  relativePath: string;
  mimeType: string;
  extension: string;
  size: number;
}

export function getUploadRoot() {
  return (
    process.env.UPLOAD_DIR ||
    process.env.UPLOAD_STORAGE_DIR ||
    join(process.cwd(), 'uploads')
  );
}

export function buildUploadUrl(relativePath: string) {
  const apiBase = process.env.API_BASE_URL || '';
  const publicBase = apiBase.replace(/\/api\/?$/, '') || '';
  return `${publicBase}/uploads/${relativePath.replace(/\\/g, '/')}`;
}

export async function saveValidatedFile(
  file: MemoryUploadFile,
  subDir: string,
  options: {
    maxSize: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
  },
): Promise<SavedUploadFile> {
  if (!file?.buffer) {
    throw new BadRequestException({ message: '请选择要上传的文件', code: 'FILE_REQUIRED' });
  }
  if (file.size > options.maxSize) {
    throw new BadRequestException({ message: '文件大小超过限制', code: 'FILE_TOO_LARGE' });
  }

  const extension = extname(file.originalname || '').toLowerCase();
  if (!options.allowedExtensions.includes(extension)) {
    throw new BadRequestException({ message: '不支持的文件格式', code: 'FILE_TYPE_NOT_ALLOWED' });
  }
  if (!options.allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException({ message: '文件类型校验未通过', code: 'FILE_MIME_NOT_ALLOWED' });
  }

  const root = getUploadRoot();
  const safeSubDir = normalize(subDir).replace(/^(\.\.(\/|\\|$))+/, '');
  const targetDir = normalize(join(root, safeSubDir));
  const rootRelative = relative(root, targetDir);
  if (rootRelative.startsWith('..') || rootRelative === '..') {
    throw new BadRequestException({ message: '上传路径不合法', code: 'INVALID_UPLOAD_PATH' });
  }

  await mkdir(targetDir, { recursive: true });
  const storedName = `${Date.now()}-${randomUUID()}${extension}`;
  const fullPath = join(targetDir, storedName);
  await writeFile(fullPath, file.buffer);

  return {
    originalName: sanitizeOriginalName(file.originalname),
    storedName,
    relativePath: normalize(join(safeSubDir, storedName)).replace(/\\/g, '/'),
    mimeType: file.mimetype,
    extension: extension.slice(1),
    size: file.size,
  };
}

function sanitizeOriginalName(name: string) {
  return (name || '未命名文件')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}
