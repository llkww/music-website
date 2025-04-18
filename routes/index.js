const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Playlist = require('../models/Playlist');

// 首页
router.get('/', async (req, res) => {
  try {
    // 获取热门歌曲
    const hotSongs = await Song.find()
      .sort({ playCount: -1 })
      .limit(10)
      .populate('artist');
    
    // 获取最新专辑
    const newAlbums = await Album.find()
      .sort({ _id: -1 })
      .limit(6)
      .populate('artist');
    
    // 获取流行歌手
    const popularArtists = await Artist.find()
      .sort({ followers: -1 })
      .limit(6);
    
    // 获取推荐歌单
    const recommendedPlaylists = await Playlist.find({ isPublic: true })
      .sort({ likes: -1 })
      .limit(6)
      .populate('creator');
    
    // 新增: 获取热歌TOP10
    const hotSongsTop10 = await Song.find()
      .sort({ playCount: -1 })
      .limit(10)
      .populate('artist')
      .populate('album');
    
    // 新增: 获取最喜爱TOP10
    const mostLikedSongs = await Song.find()
      .sort({ likes: -1 })
      .limit(10)
      .populate('artist')
      .populate('album');
    
    // 新增: 获取新歌TOP10
    const newSongsTop10 = await Song.find()
      .sort({ releaseYear: -1 })
      .limit(10)
      .populate('artist')
      .populate('album');
    
    res.render('index', {
      title: '首页',
      isHomePage: true, // 添加标志，用于显示搜索框
      hotSongs,
      newAlbums,
      popularArtists,
      recommendedPlaylists,
      hotSongsTop10, // 新增
      mostLikedSongs, // 新增
      newSongsTop10   // 新增
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '加载首页失败'
    });
  }
});

// 搜索页面 - 使用修改后的搜索控制器
router.get('/search', require('../controllers/searchController').search);

module.exports = router;