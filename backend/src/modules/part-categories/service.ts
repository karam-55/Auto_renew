import prisma from '../../config/database';
import {
  PartCategory,
  CreatePartCategoryDto,
  UpdatePartCategoryDto,
  CategoryTreeNode,
} from './types';

export class PartCategoryService {
  async createPartCategory(tenantId: string, data: CreatePartCategoryDto): Promise<PartCategory> {
    // If parentId is provided, verify it exists and belongs to the tenant
    if (data.parentId) {
      const parentCategory = await prisma.partCategory.findFirst({
        where: { id: data.parentId, tenantId },
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    const category = await prisma.partCategory.create({
      data: {
        tenantId,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        parentId: data.parentId,
        icon: data.icon,
        color: data.color,
      },
    });

    return this.mapToPartCategoryResponse(category);
  }

  async getPartCategories(tenantId: string): Promise<PartCategory[]> {
    const categories = await prisma.partCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => this.mapToPartCategoryResponse(category));
  }

  async getPartCategoryById(id: string, tenantId: string): Promise<PartCategory | null> {
    const category = await prisma.partCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      return null;
    }

    return this.mapToPartCategoryResponse(category);
  }

  async updatePartCategory(id: string, tenantId: string, data: UpdatePartCategoryDto): Promise<PartCategory> {
    // Check if category exists and belongs to tenant
    const existingCategory = await prisma.partCategory.findFirst({
      where: { id, tenantId },
    });

    if (!existingCategory) {
      throw new Error('Part category not found');
    }

    // If updating parentId, verify the new parent exists and belongs to the tenant
    if (data.parentId) {
      // Prevent setting a category as its own parent
      if (data.parentId === id) {
        throw new Error('Cannot set category as its own parent');
      }

      const parentCategory = await prisma.partCategory.findFirst({
        where: { id: data.parentId, tenantId },
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }

      // Prevent creating circular references
      if (await this.wouldCreateCircularReference(id, data.parentId, tenantId)) {
        throw new Error('Cannot create circular reference in category hierarchy');
      }
    }

    const category = await prisma.partCategory.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        parentId: data.parentId,
        icon: data.icon,
        color: data.color,
      },
    });

    return this.mapToPartCategoryResponse(category);
  }

  async deletePartCategory(id: string, tenantId: string): Promise<void> {
    // Check if category exists and belongs to tenant
    const existingCategory = await prisma.partCategory.findFirst({
      where: { id, tenantId },
    });

    if (!existingCategory) {
      throw new Error('Part category not found');
    }

    // Check if category has child categories
    const childCategoriesCount = await prisma.partCategory.count({
      where: { parentId: id },
    });

    if (childCategoriesCount > 0) {
      throw new Error('Cannot delete category with child categories. Please delete or reassign child categories first.');
    }

    // Check if category has parts
    const partsCount = await prisma.part.count({
      where: { categoryId: id },
    });

    if (partsCount > 0) {
      throw new Error('Cannot delete category with existing parts. Please reassign parts to another category first.');
    }

    await prisma.partCategory.delete({
      where: { id },
    });
  }

  async getCategoryTree(tenantId: string): Promise<CategoryTreeNode[]> {
    const categories = await prisma.partCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    const categoryMap = new Map<string, CategoryTreeNode>();
    const rootCategories: CategoryTreeNode[] = [];

    // First pass: create all nodes
    categories.forEach((category) => {
      const node: CategoryTreeNode = {
        ...this.mapToPartCategoryResponse(category),
        children: [],
      };
      categoryMap.set(category.id, node);
    });

    // Second pass: build the tree structure
    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!;

      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        parent.children.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  }

  private async wouldCreateCircularReference(categoryId: string, newParentId: string, tenantId: string): Promise<boolean> {
    // Check if the new parent is a descendant of the current category
    let currentId = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === categoryId) {
        return true; // Circular reference detected
      }

      if (visited.has(currentId)) {
        return true; // Cycle detected
      }

      visited.add(currentId);

      const category = await prisma.partCategory.findFirst({
        where: { id: currentId, tenantId },
        select: { parentId: true },
      });

      if (!category) {
        break;
      }

      currentId = category.parentId || '';
    }

    return false;
  }

  private mapToPartCategoryResponse(category: any): PartCategory {
    return {
      id: category.id,
      tenantId: category.tenantId,
      name: category.name,
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      description: category.description,
      parentId: category.parentId,
      icon: category.icon,
      color: category.color,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
