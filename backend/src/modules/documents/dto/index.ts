
import Joi from 'joi';

export interface CreateDocumentDto {
    title: string;
    description?: string;
    category: string;
    fileUrl: string;
    type: string;
    isVisible?: boolean;
}

export interface UpdateDocumentDto {
    title?: string;
    description?: string;
    category?: string;
    isVisible?: boolean;
}

export const createDocumentSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    category: Joi.string().trim().required(),
    fileUrl: Joi.string().uri().required(),
    type: Joi.string().required(),
    isVisible: Joi.boolean().default(true),
});

export const updateDocumentSchema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    category: Joi.string().trim().optional(),
    isVisible: Joi.boolean().optional(),
});
