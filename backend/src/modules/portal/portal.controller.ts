import { Request, Response } from 'express';
import { portalService } from './portal.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

export const getProfile = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const profile = await portalService.getProfile(userId, organizationId);

    res.json({
        success: true,
        data: profile,
    });
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const profile = await portalService.updateProfile(userId, organizationId, req.body);

    res.json({
        success: true,
        data: profile,
        message: 'Profile updated successfully',
    });
});

export const getPaystubs = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const paystubs = await portalService.getPaystubs(userId, organizationId);

    res.json({
        success: true,
        data: paystubs,
    });
});

export const getTimeOff = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const requests = await portalService.getTimeOffRequests(userId, organizationId);

    res.json({
        success: true,
        data: requests,
    });
});

export const getDocuments = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const documents = await portalService.getDocuments(userId, organizationId);

    res.json({
        success: true,
        data: documents,
    });
});

export const uploadDocument = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const document = await portalService.uploadDocument(userId, organizationId, req.body);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
    });
});

export const getEmergencyContacts = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const contacts = await portalService.getEmergencyContacts(userId, organizationId);

    res.json({
        success: true,
        data: contacts,
    });
});

export const addEmergencyContact = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const contact = await portalService.addEmergencyContact(userId, organizationId, req.body);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: contact,
        message: 'Emergency contact added',
    });
});

export const updateEmergencyContact = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const contact = await portalService.updateEmergencyContact(req.params.id, userId, organizationId, req.body);

    res.json({
        success: true,
        data: contact,
        message: 'Emergency contact updated',
    });
});

export const deleteEmergencyContact = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const organizationId = requireRequestOrganizationId(req as any);
    await portalService.deleteEmergencyContact(req.params.id, userId, organizationId);

    res.json({
        success: true,
        message: 'Emergency contact deleted',
    });
});

export const getDirectory = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const result = await portalService.getDirectory(req.query, organizationId);

    res.json({
        success: true,
        data: result.employees,
        pagination: result.pagination,
    });
});
