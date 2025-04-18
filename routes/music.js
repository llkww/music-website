const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const User = require('../models/User');

// 获取热门歌曲
router.get('/hot-songs', musicController.getHotSongs);

// 获取新歌榜
router.get('/new-songs', musicController.getNewSongs);

// 歌曲详情页
router.get('/song/:id', musicController.getSongDetails);

router.get('/song/:id', async (req, res) => {
  try {
    console.log('进入歌曲详情路由，ID:', req.params.id);
    
    // 确保ID格式正确
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('无效的歌曲ID格式:', req.params.id);
      return res.status(400).render('error', { 
        title: '请求错误', 
        message: '无效的歌曲ID格式' 
      });
    }
    
    // 使用lean()获取纯JavaScript对象，避免mongoose文档对象可能的问题
    const song = await Song.findById(req.params.id)
      .populate('artist')
      .populate('album')
      .lean();
    
    if (!song) {
      console.log('歌曲未找到:', req.params.id);
      return res.status(404).render('404', { title: '歌曲不存在' });
    }
    
    console.log('找到歌曲:', song.title);
    
    // 确保所有必要字段都有默认值
    song.playCount = (song.playCount || 0) + 1;
    song.likes = song.likes || 0;
    song.comments = song.comments || [];
    song.lyrics = song.lyrics || '';
    song.tags = song.tags || [];
    
    // 更新播放次数 - 使用单独的操作，不影响渲染
    Song.findByIdAndUpdate(req.params.id, { $inc: { playCount: 1 } })
      .catch(err => console.error('更新播放次数失败:', err));
    
    // 渲染模板，传递处理后的安全数据
    res.render('song-details', {
      title: song.title || '歌曲详情',
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
router.post('/song/:id/like', musicController.toggleLikeSong);

// 歌手详情页
router.get('/artist/:id', musicController.getArtistDetails);

// 专辑详情页
router.get('/album/:id', musicController.getAlbumDetails);

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

module.exports = router;