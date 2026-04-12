import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Ensure upload directories exist
const uploadDirs = {
  students: './uploads/students',
  teachers: './uploads/teachers',
  staff: './uploads/staff',
  documents: './uploads/documents',
  receipts: './uploads/receipts',
  reports: './uploads/reports',
  temp: './uploads/temp',
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Determine upload directory based on file type or request path
    let uploadPath = uploadDirs.temp;

    if (req.path.includes('/students')) {
      uploadPath = uploadDirs.students;
    } else if (req.path.includes('/teachers')) {
      uploadPath = uploadDirs.teachers;
    } else if (req.path.includes('/staff')) {
      uploadPath = uploadDirs.staff;
    } else if (req.path.includes('/documents')) {
      uploadPath = uploadDirs.documents;
    } else if (req.path.includes('/receipts')) {
      uploadPath = uploadDirs.receipts;
    } else if (req.path.includes('/reports')) {
      uploadPath = uploadDirs.reports;
    }

    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    // Text
    'text/plain',
  ];

  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`, 400));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Max 5 files per request
  },
});

// Export upload middleware variants
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount: number }[]) => upload.fields(fields);

// Profile picture upload (single image, smaller size)
export const uploadProfilePicture = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files (JPG, PNG, WEBP) are allowed for profile pictures', 400));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for profile pictures
    files: 1,
  },
}).single('profilePicture');

// Document upload (PDF, DOC, DOCX)
export const uploadDocument = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx'];

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Only document files (PDF, DOC, DOCX) are allowed', 400));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 5,
  },
}).array('documents', 5);

// Helper function to delete file
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper function to get file URL
export const getFileUrl = (filePath: string): string => {
  // Remove 'uploads/' prefix if present
  const relativePath = filePath.replace(/^uploads\//, '');
  return `/uploads/${relativePath}`;
};

// CSV upload (memory storage — for bulk import parsing)
export const uploadCSV = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new AppError('Only CSV files are allowed for bulk import', 400));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('file');

export default upload;
