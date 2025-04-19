const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const User = require('../models/User');

// 获取热门歌曲
exports.getHotSongs = async (req, res) => {
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
};

// 获取新歌榜
exports.getNewSongs = async (req, res) => {
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
};

// 获取歌手详情
exports.getArtistDetails = async (req, res) => {
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
};

// 获取专辑详情
exports.getAlbumDetails = async (req, res) => {
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
};