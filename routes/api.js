const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const searchController = require('../controllers/searchController');
const Song = require('../models/Song');
const User = require('../models/User');

// 歌曲评论相关接口
router.post('/song/:id/comment', commentController.addSongComment);
router.post('/song/:id/comment/:commentId/reply', commentController.replySongComment);
router.post('/song/:id/comment/:commentId/like', commentController.likeSongComment);
router.get('/song/:id/comments', commentController.getSongComments);

// 歌单评论相关接口
router.post('/playlist/:id/comment', commentController.addPlaylistComment);
router.get('/playlist/:id/comments', commentController.getPlaylistComments);

// 歌词API
router.get('/lyrics/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).select('lyrics');
    
    if (!song) {
      return res.status(404).json({ message: '歌曲不存在' });
    }
    
    res.json({ lyrics: song.lyrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取歌词失败' });
  }
});

// 搜索建议API
router.get('/search-suggestions', searchController.getSearchSuggestions);

// 搜索筛选选项API
router.get('/search-filters', searchController.getSearchFilters);

// 播放历史记录API
router.post('/play-history', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(200).json({ message: '用户未登录，不记录播放历史' });
    }
    
    const { songId } = req.body;
    
    if (!songId) {
      return res.status(400).json({ message: '参数错误' });
    }
    
    // 更新播放历史
    await User.findByIdAndUpdate(req.session.user.id, {
      $push: {
        recentPlayed: {
          $each: [{ song: songId, playedAt: new Date() }],
          $position: 0
        }
      }
    });
    
    // 更新歌曲播放计数
    await Song.findByIdAndUpdate(songId, { $inc: { playCount: 1 } });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '记录播放历史失败' });
  }
});

// 检查歌曲是否被收藏
router.get('/song/:id/is-liked', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ isLiked: false });
    }
    
    const user = await User.findById(req.session.user.id);
    const isLiked = user.likedSongs.includes(req.params.id);
    
    res.json({ isLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取收藏状态失败' });
  }
});

// 获取用户创建的歌单（用于添加到歌单功能）
router.get('/user-playlists', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const playlists = await require('../models/Playlist').find({
      creator: req.session.user.id
    }).select('name');
    
    res.json({ success: true, playlists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取歌单失败' });
  }
});

module.exports = router;