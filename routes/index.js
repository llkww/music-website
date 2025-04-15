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
    
    res.render('index', {
      title: '音乐网站 - 首页',
      hotSongs,
      newAlbums,
      popularArtists,
      recommendedPlaylists
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '加载首页失败'
    });
  }
});

// 搜索页面
router.get('/search', async (req, res) => {
  try {
    const { query, type = 'all' } = req.query;
    
    if (!query) {
      return res.render('search', {
        title: '搜索',
        results: null,
        query: '',
        type
      });
    }
    
    let songs = [], artists = [], albums = [], playlists = [];
    
    // 根据查询类型执行相应搜索
    if (type === 'all' || type === 'song') {
      songs = await Song.find({
        title: { $regex: query, $options: 'i' }
      }).populate('artist').limit(10);
    }
    
    if (type === 'all' || type === 'artist') {
      artists = await Artist.find({
        name: { $regex: query, $options: 'i' }
      }).limit(10);
    }
    
    if (type === 'all' || type === 'album') {
      albums = await Album.find({
        title: { $regex: query, $options: 'i' }
      }).populate('artist').limit(10);
    }
    
    if (type === 'all' || type === 'playlist') {
      playlists = await Playlist.find({
        name: { $regex: query, $options: 'i' },
        isPublic: true
      }).populate('creator').limit(10);
    }
    
    res.render('search', {
      title: `搜索"${query}"的结果`,
      results: { songs, artists, albums, playlists },
      query,
      type
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '搜索失败'
    });
  }
});

module.exports = router;