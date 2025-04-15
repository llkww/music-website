const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');

// 获取热门歌曲
router.get('/hot-songs', musicController.getHotSongs);

// 获取新歌榜
router.get('/new-songs', musicController.getNewSongs);

// 歌曲详情页
router.get('/song/:id', musicController.getSongDetails);

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
    const songs = await require('../models/Song').find({ genre })
      .populate('artist')
      .sort({ playCount: -1 });
    
    res.render('genre', {
      title: `${genre}音乐`,
      genre,
      songs
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: '加载失败' });
  }
});

// 分类浏览页面 - 按语种
router.get('/language/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const songs = await require('../models/Song').find({ language })
      .populate('artist')
      .sort({ playCount: -1 });
    
    res.render('language', {
      title: `${language}音乐`,
      language,
      songs
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: '加载失败' });
  }
});

module.exports = router;