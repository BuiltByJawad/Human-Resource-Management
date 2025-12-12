export interface CreateAssetDto {
    name: string;
    assetType: string;
    serialNumber?: string;
    purchaseDate?: Date | string;
    purchaseCost?: number;
    assignedTo?: string;
    status?: 'available' | 'assigned' | 'maintenance' | 'retired';
}

export interface UpdateAssetDto {
    name?: string;
    assetType?: string;
    serialNumber?: string;
    purchaseDate?: Date | string;
    purchaseCost?: number;
    assignedTo?: string;
    status?: 'available' | 'assigned' | 'maintenance' | 'retired';
}

export interface AssetQueryDto {
    page?: number;
    limit?: number;
    status?: string;
    assetType?: string;
    assignedTo?: string;
    search?: string;
}
