const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const Song = require('../models/Song');

// 获取所有专辑
router.get('/', async (req, res) => {
  try {
    const albums = await Album.find()
      .sort({ releaseDate: -1 })
      .populate('artist');
    
    res.render('albums', {
      title: '全部专辑',
      albums
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '加载专辑失败'
    });
  }
});

// 获取专辑详情
router.get('/:id', async (req, res) => {
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

module.exports = router;