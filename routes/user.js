const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置Multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB大小限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (ext && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件!'));
  }
});

// 身份验证中间件
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    // 保存当前URL，以便登录后重定向回来
    req.session.returnTo = req.originalUrl;
    req.session.authMessage = '请先登录后访问此页面';
    return res.redirect('/auth/login');
  }
  next();
};

// 个人资料页面
router.get('/profile', isAuthenticated, userController.getProfile);

// 更新个人资料
router.post('/profile', isAuthenticated, userController.updateProfile);

// 上传头像
router.post('/upload-avatar', isAuthenticated, upload.single('avatar'), userController.uploadAvatar);

// 我喜欢的音乐页面
router.get('/liked-songs', isAuthenticated, userController.getLikedSongs);

// 修改密码
router.post('/update-password', isAuthenticated, userController.updatePassword);

module.exports = router;