const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const User = require('../models/User');

// 获取热门歌曲
router.get('/hot-songs', async (req, res) => {
  try {
    const songs = await Song.find()
      .sort({ playCount: -1 })
      .limit(13) 
      .populate('artist');
    
    res.json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取热门歌曲失败' });
  }
});

// 获取新歌榜
router.get('/new-songs', async (req, res) => {
  try {
    const songs = await Song.find()
      .sort({ _id: -1 })
      .limit(10)
      .populate('artist');
    
    res.json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取新歌榜失败' });
  }
});

// 重要：修复歌曲详情路由 - 直接定义在这里，不使用控制器
router.get('/song/:id', async (req, res) => {
  try {
    console.log('进入歌曲详情路由，ID:', req.params.id);
    
    const song = await Song.findById(req.params.id)
      .populate('artist')
      .populate('album');
    
    if (!song) {
      console.log('歌曲未找到:', req.params.id);
      return res.status(404).render('404', { title: '歌曲不存在' });
    }
    
    console.log('找到歌曲:', song.title);
    
    // 更新播放次数
    song.playCount += 1;
    await song.save();
    
    // 不检查isLiked状态
    res.render('song-details', {
      title: song.title,
      song
    });
  } catch (error) {
    console.error('歌曲详情处理错误:', error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取歌曲详情失败: ' + error.message
    });
  }
});

// 喜欢/取消喜欢歌曲
router.post('/song/:id/like', async (req, res) => {
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
    console.error('喜欢/取消喜欢操作失败:', error);
    res.status(500).json({ message: '操作失败' });
  }
});

// 歌手详情页
router.get('/artist/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate('popularSongs')
      .populate('albums');
    
    if (!artist) {
      return res.status(404).render('404', { title: '歌手不存在' });
    }
    
    res.render('artist-details', {
      title: artist.name,
      artist
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取歌手详情失败'
    });
  }
});

// 专辑详情页
router.get('/album/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate('artist')
      .populate('songs');
    
    if (!album) {
      return res.status(404).render('404', { title: '专辑不存在' });
    }
    
    res.render('album-details', {
      title: album.title,
      album
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取专辑详情失败'
    });
  }
});

// 分类浏览页面 - 按流派
router.get('/genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const songs = await Song.find({ genre })
      .populate('artist')
      .populate('album')
      .sort({ playCount: -1 });
    
    res.render('genre', {
      title: `${genre}音乐`,
      genre,
      songs
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      title: '服务器错误',
      message: '加载失败' 
    });
  }
});

// 分类浏览页面 - 按语种
router.get('/language/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const songs = await Song.find({ language })
      .populate('artist')
      .populate('album')
      .sort({ playCount: -1 });
    
    res.render('language', {
      title: `${language}音乐`,
      language,
      songs
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      title: '服务器错误',
      message: '加载失败' 
    });
  }
});

// 删除通用路由，避免冲突
// router.get('/:id', async (req, res) => {...});

module.exports = router;