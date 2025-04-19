const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const User = require('../models/User'); // 添加User模型引入
const mongoose = require('mongoose');

// 获取歌曲详情
router.get('/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    
    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(songId)) {
      console.error(`无效的歌曲ID格式: ${songId}`);
      return res.status(400).render('error', { 
        title: '请求错误', 
        message: '无效的歌曲ID格式' 
      });
    }
    
    // 查找歌曲并关联艺术家和专辑信息
    const song = await Song.findById(songId)
      .populate('artist')
      .populate('album');
    
    if (!song) {
      return res.status(404).render('404', { title: '歌曲不存在' });
    }
    
    // 检查艺术家引用是否存在
    if (!song.artist) {
      song.artist = { name: '未知艺术家', _id: null };
    }
    
    // 更新播放次数
    song.playCount += 1;
    await song.save();
    
    // 渲染歌曲详情页面
    res.render('song-details', {
      title: song.title,
      song
    });
  } catch (error) {
    console.error('获取歌曲详情失败:', error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取歌曲详情失败: ' + error.message
    });
  }
});

// 喜欢/取消喜欢歌曲
router.post('/:id/like', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const user = await User.findById(req.session.user.id);
    const songId = req.params.id;
    
    // 检查歌曲是否已被喜欢
    const isLiked = user.likedSongs.includes(songId);
    
    if (isLiked) {
      // 取消喜欢
      await User.findByIdAndUpdate(req.session.user.id, {
        $pull: { likedSongs: songId }
      });
      await Song.findByIdAndUpdate(songId, { $inc: { likes: -1 } });
    } else {
      // 添加喜欢
      await User.findByIdAndUpdate(req.session.user.id, {
        $push: { likedSongs: songId }
      });
      await Song.findByIdAndUpdate(songId, { $inc: { likes: 1 } });
    }
    
    res.json({ success: true, liked: !isLiked });
  } catch (error) {
    console.error('喜欢/取消喜欢歌曲失败:', error);
    res.status(500).json({ message: '操作失败' });
  }
});

module.exports = router;