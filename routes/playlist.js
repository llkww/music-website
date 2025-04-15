const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads/playlists');
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
    return res.redirect('/auth/login');
  }
  next();
};

// 创建歌单页面
router.get('/create', isAuthenticated, (req, res) => {
  res.render('create-playlist', { title: '创建歌单' });
});

// 创建歌单处理
router.post('/create', isAuthenticated, playlistController.createPlaylist);

// 歌单详情页
router.get('/:id', playlistController.getPlaylistDetails);

// 添加歌曲到歌单
router.post('/add-song', isAuthenticated, playlistController.addSongToPlaylist);

// 从歌单移除歌曲
router.delete('/:playlistId/song/:songId', isAuthenticated, playlistController.removeSongFromPlaylist);

// 喜欢/取消喜欢歌单
router.post('/:id/like', isAuthenticated, playlistController.toggleLikePlaylist);

// 上传歌单封面
router.post('/:id/upload-cover', isAuthenticated, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    const coverPath = `/uploads/playlists/${req.file.filename}`;
    
    // 检查是否是歌单创建者
    const playlist = await require('../models/Playlist').findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: '歌单不存在' });
    }
    
    if (playlist.creator.toString() !== req.session.user.id) {
      return res.status(403).json({ message: '您没有权限修改此歌单' });
    }
    
    // 更新歌单封面
    await require('../models/Playlist').findByIdAndUpdate(req.params.id, {
      coverImage: coverPath
    });
    
    res.json({ success: true, coverPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '上传封面失败' });
  }
});

module.exports = router;