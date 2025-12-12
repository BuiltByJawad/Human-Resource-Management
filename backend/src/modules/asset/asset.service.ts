import { assetRepository } from './asset.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { CreateAssetDto, UpdateAssetDto, AssetQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class AssetService {
    async getAll(query: AssetQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.assetType) {
            where.assetType = query.assetType;
        }

        if (query.assignedTo) {
            where.assignedTo = query.assignedTo;
        }

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { serialNumber: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [assets, total] = await Promise.all([
            assetRepository.findAll({ where, skip, take: limit }),
            assetRepository.count(where),
        ]);

        return {
            assets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async getById(id: string) {
        const asset = await assetRepository.findById(id);

        if (!asset) {
            throw new NotFoundError('Asset not found');
        }

        return asset;
    }

    async create(data: CreateAssetDto) {
        const assetData: any = {
            name: data.name,
            assetType: data.assetType,
            serialNumber: data.serialNumber,
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
            purchaseCost: data.purchaseCost,
            status: data.status || 'available',
        };

        if (data.assignedTo) {
            assetData.assignedToEmployee = {
                connect: { id: data.assignedTo },
            };
            assetData.status = 'assigned';
        }

        return assetRepository.create(assetData);
    }

    async update(id: string, data: UpdateAssetDto) {
        await this.getById(id);

        const updateData: any = {};

        if (data.name) updateData.name = data.name;
        if (data.assetType) updateData.assetType = data.assetType;
        if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
        if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
        if (data.purchaseCost !== undefined) updateData.purchaseCost = data.purchaseCost;
        if (data.status) updateData.status = data.status;

        if (data.assignedTo !== undefined) {
            if (data.assignedTo) {
                updateData.assignedToEmployee = { connect: { id: data.assignedTo } };
                updateData.status = 'assigned';
            } else {
                updateData.assignedToEmployee = { disconnect: true };
                updateData.status = 'available';
            }
        }

        return assetRepository.update(id, updateData);
    }

    async delete(id: string) {
        const asset = await this.getById(id);

        if ((asset as any).assignedTo) {
            throw new BadRequestError('Cannot delete asset that is assigned. Please unassign it first.');
        }

        await assetRepository.delete(id);
    }

    async getEmployeeAssets(employeeId: string) {
        return assetRepository.findByEmployee(employeeId);
    }
}

export const assetService = new AssetService();
