const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const Album = require('../models/Album');

// 获取所有歌手
router.get('/', async (req, res) => {
  try {
    const artists = await Artist.find()
      .sort({ followers: -1 });
    
    res.render('artists', {
      title: '全部歌手',
      artists
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '加载歌手失败'
    });
  }
});

// 获取歌手详情
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).render('404', { title: '歌手不存在' });
    }
    
    // 获取歌手的所有歌曲
    const songs = await Song.find({ artist: artist._id });
    
    // 获取歌手的所有专辑
    const albums = await Album.find({ artist: artist._id });
    
    res.render('artist-details', {
      title: artist.name,
      artist,
      songs,
      albums
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取歌手详情失败'
    });
  }
});

module.exports = router;