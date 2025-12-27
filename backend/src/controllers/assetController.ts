import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/shared/config/database'
import { NotFoundError, BadRequestError, ForbiddenError } from '@/shared/utils/errors'
import { requireRequestOrganizationId } from '@/shared/utils/tenant'

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { status, type, search } = req.query

        const where: any = { organizationId }
        if (status) where.status = status
        if (type) where.type = type
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { serialNumber: { contains: String(search), mode: 'insensitive' } }
            ]
        }

        const assets = await prisma.asset.findMany({
            where,
            include: {
                assignments: {
                    where: { returnedDate: null },
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeNumber: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        res.json({ success: true, data: assets })
    } catch (error) {
        next(error)
    }
}

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { name, serialNumber, type, purchaseDate, purchasePrice, vendor, description } = req.body

        const existingAsset = await prisma.asset.findFirst({ where: { organizationId, serialNumber } })
        if (existingAsset) {
            throw new BadRequestError('Asset with this serial number already exists')
        }

        const asset = await prisma.asset.create({
            data: {
                organizationId,
                name,
                serialNumber,
                type,
                purchaseDate: new Date(purchaseDate),
                purchasePrice: purchasePrice ? Number(purchasePrice) : null,
                vendor,
                description,
                status: 'available'
            }
        })

        res.status(201).json({ success: true, data: asset })
    } catch (error) {
        next(error)
    }
}

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { id } = req.params
        const data = req.body

        if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate)
        if (data.purchasePrice) data.purchasePrice = Number(data.purchasePrice)

        const result = await prisma.asset.updateMany({ where: { id, organizationId }, data })
        if (!result.count) {
            throw new NotFoundError('Asset not found')
        }

        const asset = await prisma.asset.findFirst({ where: { id, organizationId } })

        res.json({ success: true, data: asset })
    } catch (error) {
        next(error)
    }
}

export const getEmployeeAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { employeeId } = req.params

        const authReq: any = req as any
        const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : []
        const selfEmployeeId: string | undefined = authReq?.user?.employeeId
        const canViewAll =
            permissions.includes('assets.view') ||
            permissions.includes('assets.manage') ||
            permissions.includes('assets.assign')

        if (!canViewAll) {
            if (!selfEmployeeId || employeeId !== selfEmployeeId) {
                throw new ForbiddenError('You can only view your own assets')
            }
        }

        const employeeExists = await prisma.employee.findFirst({ where: { id: employeeId, organizationId } })
        if (!employeeExists) {
            throw new NotFoundError('Employee not found')
        }

        const assets = await prisma.asset.findMany({
            where: {
                organizationId,
                assignments: {
                    some: {
                        employeeId,
                        returnedDate: null,
                    },
                },
            },
            include: {
                assignments: {
                    where: { employeeId, returnedDate: null },
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeNumber: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        res.json({ success: true, data: assets })
    } catch (error) {
        next(error)
    }
}

export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { id } = req.params

        const asset = await prisma.asset.findFirst({ where: { id, organizationId } })
        if (!asset) throw new NotFoundError('Asset not found')

        const activeAssignment = await prisma.assetAssignment.findFirst({
            where: { assetId: id, returnedDate: null },
            select: { id: true },
        })
        if (activeAssignment) {
            throw new BadRequestError('Cannot delete asset that is assigned. Please return it first.')
        }

        await prisma.asset.deleteMany({ where: { id, organizationId } })
        res.json({ success: true, message: 'Asset deleted successfully' })
    } catch (error) {
        next(error)
    }
}

export const assignAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { id } = req.params
        const { employeeId, notes } = req.body

        const asset = await prisma.asset.findFirst({ where: { id, organizationId } })
        if (!asset) throw new NotFoundError('Asset not found')
        if (asset.status !== 'available') throw new BadRequestError('Asset is not available for assignment')

        const employeeExists = await prisma.employee.findFirst({ where: { id: employeeId, organizationId } })
        if (!employeeExists) {
            throw new NotFoundError('Employee not found')
        }

        const result = await prisma.$transaction(async (prisma) => {
            const assignment = await prisma.assetAssignment.create({
                data: {
                    assetId: id,
                    employeeId,
                    notes,
                    assignedDate: new Date()
                }
            })

            const assetUpdateResult = await prisma.asset.updateMany({
                where: { id, organizationId },
                data: { status: 'assigned' }
            })
            if (!assetUpdateResult.count) {
                throw new NotFoundError('Asset not found')
            }

            return assignment
        })

        res.json({ success: true, data: result })
    } catch (error) {
        next(error)
    }
}

export const returnAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { id } = req.params // Asset ID

        const asset = await prisma.asset.findFirst({ where: { id, organizationId } })
        if (!asset) throw new NotFoundError('Asset not found')

        const activeAssignment = await prisma.assetAssignment.findFirst({
            where: { assetId: id, returnedDate: null }
        })

        if (!activeAssignment) throw new BadRequestError('Asset is not currently assigned')

        const result = await prisma.$transaction(async (prisma) => {
            const assignment = await prisma.assetAssignment.update({
                where: { id: activeAssignment.id },
                data: { returnedDate: new Date() }
            })

            const assetUpdateResult = await prisma.asset.updateMany({
                where: { id, organizationId },
                data: { status: 'available' }
            })
            if (!assetUpdateResult.count) {
                throw new NotFoundError('Asset not found')
            }

            return assignment
        })

        res.json({ success: true, data: result })
    } catch (error) {
        next(error)
    }
}

export const addMaintenanceLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { id } = req.params
        const { description, cost, date, performedBy } = req.body

        const asset = await prisma.asset.findFirst({ where: { id, organizationId } })
        if (!asset) throw new NotFoundError('Asset not found')

        const log = await prisma.maintenanceLog.create({
            data: {
                assetId: id,
                description,
                cost: cost ? Number(cost) : null,
                date: date ? new Date(date) : new Date(),
                performedBy
            }
        })

        res.status(201).json({ success: true, data: log })
    } catch (error) {
        next(error)
    }
}

export const getAssetDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const { id } = req.params

        const asset = await prisma.asset.findFirst({
            where: { id, organizationId },
            include: {
                assignments: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeNumber: true
                            }
                        }
                    },
                    orderBy: { assignedDate: 'desc' }
                },
                maintenance: {
                    orderBy: { date: 'desc' }
                }
            }
        })

        if (!asset) throw new NotFoundError('Asset not found')

        res.json({ success: true, data: asset })
    } catch (error) {
        next(error)
    }
}
