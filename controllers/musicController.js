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

// 获取歌曲详情
exports.getSongDetails = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate('artist')
      .populate('album');
    
    if (!song) {
      return res.status(404).render('404', { title: '歌曲不存在' });
    }
    
    // 更新播放次数
    song.playCount += 1;
    await song.save();
    
    // 检查用户是否已收藏该歌曲
    let isLiked = false;
    if (req.session.user) {
      const user = await User.findById(req.session.user.id);
      isLiked = user.likedSongs.includes(song._id);
    }
    
    res.render('song-details', {
      title: song.title,
      song,
      isLiked
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取歌曲详情失败'
    });
  }
};

// 喜欢/取消喜欢歌曲
exports.toggleLikeSong = async (req, res) => {
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
    console.error(error);
    res.status(500).json({ message: '操作失败' });
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