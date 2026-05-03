"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const userService_1 = require("../services/userService");
const auditLogger_1 = require("../middleware/auditLogger");
const userService = new userService_1.UserService();
exports.createUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService.createUser(req.body);
    auditLogger_1.auditData.create(req, 'users', user.id, true);
    res.status(201).json({ success: true, data: user });
});
exports.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await userService.getUsers(req);
    res.json({
        success: true,
        data: {
            users: result.users,
            pagination: result.pagination,
        },
    });
});
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    try {
        const user = await userService.getUserById(id);
        auditLogger_1.auditData.access(req, 'users', id, true);
        res.json({
            success: true,
            data: {
                user: user,
            },
        });
    }
    catch (error) {
        auditLogger_1.auditData.access(req, 'users', id, false);
        throw error;
    }
});
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const user = await userService.updateUser(id, updateData);
    auditLogger_1.auditData.update(req, 'users', id, true, updateData);
    res.json({
        success: true,
        message: 'User updated successfully',
        data: {
            user: user,
        },
    });
});
exports.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await userService.deleteUser(id);
    auditLogger_1.auditData.delete(req, 'users', id, true);
    res.json({
        success: true,
        message: 'User deleted successfully',
    });
});
//# sourceMappingURL=userController.js.map