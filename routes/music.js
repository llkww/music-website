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

// // 添加一个通用的路由处理器
// router.get('/:id', async (req, res) => {
//   try {
//     const song = await Song.findById(req.params.id)
//       .populate('artist')
//       .populate('album');
    
//     if (!song) {
//       return res.status(404).render('404', { title: '歌曲不存在' });
//     }
    
//     // 更新播放次数
//     song.playCount += 1;
//     await song.save();
    
//     res.render('song-details', {
//       title: song.title,
//       song,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).render('error', {
//       title: '服务器错误',
//       message: '获取歌曲详情失败'
//     });
//   }
// });

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