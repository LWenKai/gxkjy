import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { parseBigIntId } from '../../common/id';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithClientUser } from '../auth/client-auth.types';

export interface ProductCategoryItem {
  id: string;
  name: string;
  sort: number;
}

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: bigint): Promise<ProductCategoryItem[]> {
    const rows = await this.prisma.productCategory.findMany({
      where: { companyId },
      orderBy: [{ sort: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      sort: row.sort,
    }));
  }

  async create(companyId: bigint, dto: { name: string; sort?: number }) {
    const name = dto.name.trim();
    if (!name) {
      throw new ConflictException({ message: '分类名称不能为空', code: 'CATEGORY_NAME_REQUIRED' });
    }
    await this.ensureUnique(companyId, name);
    const row = await this.prisma.productCategory.create({
      data: { companyId, name, sort: dto.sort ?? 0 },
    });
    return this.toItem(row);
  }

  async update(companyId: bigint, id: string, dto: { name: string; sort?: number }) {
    const name = dto.name.trim();
    if (!name) {
      throw new ConflictException({ message: '分类名称不能为空', code: 'CATEGORY_NAME_REQUIRED' });
    }
    const row = await this.findOrThrow(companyId, id);
    if (name !== row.name) {
      await this.ensureUnique(companyId, name);
    }
    const updated = await this.prisma.productCategory.update({
      where: { id: row.id },
      data: { name, sort: dto.sort ?? row.sort },
    });
    return this.toItem(updated);
  }

  async remove(companyId: bigint, id: string) {
    const row = await this.findOrThrow(companyId, id);
    await this.prisma.productCategory.delete({ where: { id: row.id } });
    return { deleted: true };
  }

  private async ensureUnique(companyId: bigint, name: string) {
    const existing = await this.prisma.productCategory.findFirst({
      where: { companyId, name },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        message: '该分类已存在',
        code: 'CATEGORY_EXISTS',
      });
    }
  }

  private async findOrThrow(companyId: bigint, id: string) {
    const row = await this.prisma.productCategory.findFirst({
      where: { id: parseBigIntId(id), companyId },
    });
    if (!row) {
      throw new NotFoundException({ message: '分类不存在', code: 'CATEGORY_NOT_FOUND' });
    }
    return row;
  }

  private toItem(row: { id: bigint; name: string; sort: number }): ProductCategoryItem {
    return { id: row.id.toString(), name: row.name, sort: row.sort };
  }
}
