import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError, BadRequestError } from '../utils/errors'

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, type, search } = req.query

        const where: any = {}
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
        const { name, serialNumber, type, purchaseDate, purchasePrice, vendor, description } = req.body

        const existingAsset = await prisma.asset.findUnique({ where: { serialNumber } })
        if (existingAsset) {
            throw new BadRequestError('Asset with this serial number already exists')
        }

        const asset = await prisma.asset.create({
            data: {
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
        const { id } = req.params
        const data = req.body

        if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate)
        if (data.purchasePrice) data.purchasePrice = Number(data.purchasePrice)

        const asset = await prisma.asset.update({
            where: { id },
            data
        })

        res.json({ success: true, data: asset })
    } catch (error) {
        next(error)
    }
}

export const assignAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { employeeId, notes } = req.body

        const asset = await prisma.asset.findUnique({ where: { id } })
        if (!asset) throw new NotFoundError('Asset not found')
        if (asset.status !== 'available') throw new BadRequestError('Asset is not available for assignment')

        const result = await prisma.$transaction(async (prisma) => {
            const assignment = await prisma.assetAssignment.create({
                data: {
                    assetId: id,
                    employeeId,
                    notes,
                    assignedDate: new Date()
                }
            })

            await prisma.asset.update({
                where: { id },
                data: { status: 'assigned' }
            })

            return assignment
        })

        res.json({ success: true, data: result })
    } catch (error) {
        next(error)
    }
}

export const returnAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params // Asset ID

        const activeAssignment = await prisma.assetAssignment.findFirst({
            where: { assetId: id, returnedDate: null }
        })

        if (!activeAssignment) throw new BadRequestError('Asset is not currently assigned')

        const result = await prisma.$transaction(async (prisma) => {
            const assignment = await prisma.assetAssignment.update({
                where: { id: activeAssignment.id },
                data: { returnedDate: new Date() }
            })

            await prisma.asset.update({
                where: { id },
                data: { status: 'available' }
            })

            return assignment
        })

        res.json({ success: true, data: result })
    } catch (error) {
        next(error)
    }
}

export const addMaintenanceLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { description, cost, date, performedBy } = req.body

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
        const { id } = req.params

        const asset = await prisma.asset.findUnique({
            where: { id },
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
