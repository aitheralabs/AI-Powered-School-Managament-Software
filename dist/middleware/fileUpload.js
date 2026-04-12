"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCSV = exports.getFileUrl = exports.deleteFile = exports.uploadDocument = exports.uploadProfilePicture = exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const errorHandler_1 = require("./errorHandler");
const uploadDirs = {
    students: './uploads/students',
    teachers: './uploads/teachers',
    staff: './uploads/staff',
    documents: './uploads/documents',
    receipts: './uploads/receipts',
    reports: './uploads/reports',
    temp: './uploads/temp',
};
Object.values(uploadDirs).forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = uploadDirs.temp;
        if (req.path.includes('/students')) {
            uploadPath = uploadDirs.students;
        }
        else if (req.path.includes('/teachers')) {
            uploadPath = uploadDirs.teachers;
        }
        else if (req.path.includes('/staff')) {
            uploadPath = uploadDirs.staff;
        }
        else if (req.path.includes('/documents')) {
            uploadPath = uploadDirs.documents;
        }
        else if (req.path.includes('/receipts')) {
            uploadPath = uploadDirs.receipts;
        }
        else if (req.path.includes('/reports')) {
            uploadPath = uploadDirs.reports;
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path_1.default.extname(file.originalname);
        const nameWithoutExt = path_1.default.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
    ];
    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'
    ];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`, 400));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
    },
});
const uploadSingle = (fieldName) => upload.single(fieldName);
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
exports.uploadMultiple = uploadMultiple;
const uploadFields = (fields) => upload.fields(fields);
exports.uploadFields = uploadFields;
exports.uploadProfilePicture = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new errorHandler_1.AppError('Only image files (JPG, PNG, WEBP) are allowed for profile pictures', 400));
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
    },
}).single('profilePicture');
exports.uploadDocument = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new errorHandler_1.AppError('Only document files (PDF, DOC, DOCX) are allowed', 400));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5,
    },
}).array('documents', 5);
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs_1.default.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteFile = deleteFile;
const getFileUrl = (filePath) => {
    const relativePath = filePath.replace(/^uploads\//, '');
    return `/uploads/${relativePath}`;
};
exports.getFileUrl = getFileUrl;
exports.uploadCSV = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (ext === 'csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        }
        else {
            cb(new errorHandler_1.AppError('Only CSV files are allowed for bulk import', 400));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('file');
exports.default = upload;
//# sourceMappingURL=fileUpload.js.map