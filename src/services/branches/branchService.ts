import { prisma } from "@/lib/prisma";
import { BranchInput } from "@/lib/validations/branch";
import { Prisma } from "@prisma/client";

export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  phone: string;
  phoneAlt: string | null;
  email: string;
  emailAlt: string | null;
  workingHours: Record<string, string>;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

class BranchService {
  /**
   * Get all active branches ordered by displayOrder
   */
  async getAllBranches(): Promise<Branch[]> {
    const branches = await prisma.branch.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return branches.map(this.mapToBranch);
  }

  /**
   * Get all branches (including inactive) - for admin
   */
  async getAllBranchesAdmin(): Promise<Branch[]> {
    const branches = await prisma.branch.findMany({
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return branches.map(this.mapToBranch);
  }

  /**
   * Get branch by ID
   */
  async getBranchById(id: string): Promise<Branch | null> {
    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    return branch ? this.mapToBranch(branch) : null;
  }

  /**
   * Get branch by slug
   */
  async getBranchBySlug(slug: string): Promise<Branch | null> {
    const branch = await prisma.branch.findUnique({
      where: { slug },
    });

    return branch ? this.mapToBranch(branch) : null;
  }

  /**
   * Create a new branch
   */
  async createBranch(data: BranchInput): Promise<Branch> {
    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        slug: data.slug,
        address: data.address,
        city: data.city,
        country: data.country,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        placeId: data.placeId ?? null,
        phone: data.phone,
        phoneAlt: data.phoneAlt ?? null,
        email: data.email,
        emailAlt: data.emailAlt ?? null,
        workingHours: data.workingHours as Prisma.InputJsonValue,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
      },
    });

    return this.mapToBranch(branch);
  }

  /**
   * Update an existing branch
   */
  async updateBranch(id: string, data: Partial<BranchInput>): Promise<Branch> {
    const updateData: Prisma.BranchUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.latitude !== undefined) updateData.latitude = data.latitude ?? null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude ?? null;
    if (data.placeId !== undefined) updateData.placeId = data.placeId ?? null;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.phoneAlt !== undefined) updateData.phoneAlt = data.phoneAlt ?? null;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.emailAlt !== undefined) updateData.emailAlt = data.emailAlt ?? null;
    if (data.workingHours !== undefined) updateData.workingHours = data.workingHours as Prisma.InputJsonValue;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

    const branch = await prisma.branch.update({
      where: { id },
      data: updateData,
    });

    return this.mapToBranch(branch);
  }

  /**
   * Delete a branch
   */
  async deleteBranch(id: string): Promise<void> {
    await prisma.branch.delete({
      where: { id },
    });
  }

  /**
   * Map Prisma branch to Branch interface
   */
  private mapToBranch(branch: any): Branch {
    return {
      id: branch.id,
      name: branch.name,
      slug: branch.slug,
      address: branch.address,
      city: branch.city,
      country: branch.country,
      latitude: branch.latitude,
      longitude: branch.longitude,
      placeId: branch.placeId,
      phone: branch.phone,
      phoneAlt: branch.phoneAlt,
      email: branch.email,
      emailAlt: branch.emailAlt,
      workingHours: branch.workingHours as Record<string, string>,
      isActive: branch.isActive,
      displayOrder: branch.displayOrder,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }
}

export const branchService = new BranchService();


