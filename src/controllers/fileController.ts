import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { fileService } from '../services/fileService';
import path from 'path';
import fs from 'fs/promises';

/**
 * Upload file(s)
 */
export const uploadFiles = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { entityType, entityId, fileType } = req.body;

  if (!req.files && !req.file) {
    throw new AppError('No files uploaded', 400);
  }

  if (!entityType || !entityId || !fileType) {
    throw new AppError('entityType, entityId, and fileType are required', 400);
  }

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file!];
  
  const uploadedFiles = [];

  for (const file of files) {
    const fileData = {
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: userId,
      entityType,
      entityId,
      fileType,
    };

    const savedFile = await fileService.saveFileMetadata(fileData);
    uploadedFiles.push(savedFile);
  }

  res.status(201).json({
    success: true,
    message: `${uploadedFiles.length} file(s) uploaded successfully`,
    data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles,
  });
});

/**
 * Get file by ID (tenant-scoped)
 */
export const getFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = (req as any).schoolId;
  const file = await fileService.getFileById(id, schoolId);

  res.json({
    success: true,
    data: file,
  });
});

/**
 * Get files by entity (tenant-scoped)
 */
export const getFilesByEntity = asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { fileType } = req.query;
  const schoolId = (req as any).schoolId;

  const files = await fileService.getFilesByEntity(
    entityType,
    entityId,
    fileType as string | undefined,
    schoolId
  );

  res.json({
    success: true,
    data: files,
    count: files.length,
  });
});

/**
 * Download file (tenant-scoped)
 */
export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = (req as any).schoolId;
  const file = await fileService.getFileById(id, schoolId);

  // Check if file exists
  const fileExists = await fileService.fileExists(file.filePath);
  if (!fileExists) {
    throw new AppError('File not found on server', 404);
  }

  // Set headers for download
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.setHeader('Content-Length', file.fileSize);

  // Stream file
  const fileBuffer = await fs.readFile(file.filePath);
  res.send(fileBuffer);
});

/**
 * Delete file
 */
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await fileService.deleteFile(id, userId);

  res.json({
    success: true,
    message: 'File deleted successfully',
  });
});

/**
 * Update file metadata
 */
export const updateFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fileName, fileType } = req.body;

  const updatedFile = await fileService.updateFileMetadata(id, {
    fileName,
    fileType,
  });

  res.json({
    success: true,
    message: 'File updated successfully',
    data: updatedFile,
  });
});

/**
 * Get file statistics
 */
export const getFileStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { entityType } = req.query;
  const userRole = req.user!.role;

  // Only admins can view file statistics
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view file statistics', 403);
  }

  const stats = await fileService.getFileStatistics(entityType as string | undefined);

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Upload profile picture
 */
export const uploadProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { entityType, entityId } = req.body;

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  if (!entityType || !entityId) {
    throw new AppError('entityType and entityId are required', 400);
  }

  // Delete old profile picture if exists
  const existingFiles = await fileService.getFilesByEntity(entityType, entityId, 'profile_picture');
  for (const file of existingFiles) {
    await fileService.deleteFile(file.id, userId);
  }

  // Save new profile picture
  const fileData = {
    fileName: req.file.filename,
    originalName: req.file.originalname,
    filePath: req.file.path,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedBy: userId,
    entityType,
    entityId,
    fileType: 'profile_picture',
  };

  const savedFile = await fileService.saveFileMetadata(fileData);

  res.status(201).json({
    success: true,
    message: 'Profile picture uploaded successfully',
    data: savedFile,
  });
});
