const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const searchController = require('../controllers/searchController');
const Song = require('../models/Song');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Artist = require('../models/Artist');

// 中间件：处理未授权的请求并返回统一格式的错误响应
const handleUnauthorized = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      success: false, 
      code: 401, 
      message: '请先登录',
      redirectTo: '/auth/login?returnTo=' + encodeURIComponent(req.originalUrl)
    });
  }
  next();
};

// 统一错误处理函数
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      code: 500, 
      message: '服务器错误，请稍后再试' 
    });
  });
};

// 歌曲评论相关接口
router.post('/song/:id/comment', commentController.addSongComment);
router.post('/song/:id/comment/:commentId/reply', commentController.replySongComment);
router.post('/song/:id/comment/:commentId/like', commentController.likeSongComment);
router.get('/song/:id/comments', commentController.getSongComments);

// 歌单评论相关接口也需要保持一致
router.post('/playlist/:id/comment', commentController.addPlaylistComment);
router.post('/playlist/:id/comment/:commentId/reply', commentController.replySongComment); 
router.post('/playlist/:id/comment/:commentId/like', commentController.likeSongComment); 
router.get('/playlist/:id/comments', commentController.getPlaylistComments);

// 歌词API - 增强错误处理和缓存控制
router.get('/lyrics/:id', asyncHandler(async (req, res) => {
  const songId = req.params.id;
  if (!songId || songId === 'undefined') {
    return res.status(400).json({ success: false, message: '无效的歌曲ID' });
  }
  
  const song = await Song.findById(songId).select('lyrics title');
  
  if (!song) {
    return res.status(404).json({ success: false, message: '歌曲不存在' });
  }
  
  // 设置适当的缓存控制头
  res.set('Cache-Control', 'public, max-age=3600'); // 缓存1小时
  
  res.json({ 
    success: true, 
    songTitle: song.title,
    lyrics: song.lyrics || '' 
  });
}));

// 搜索建议API
router.get('/search-suggestions', searchController.getSearchSuggestions);

// 搜索筛选选项API
router.get('/search-filters', searchController.getSearchFilters);

// 播放计数API - 只更新播放计数，不再记录播放历史
router.post('/play-history', asyncHandler(async (req, res) => {
  const { songId } = req.body;
  
  if (!songId) {
    return res.status(400).json({ success: false, message: '参数错误' });
  }
  
  // 更新歌曲播放计数
  await Song.findByIdAndUpdate(songId, { $inc: { playCount: 1 } });
  
  res.json({ 
    success: true, 
    message: '播放计数已更新' 
  });
}));

// 检查歌曲是否被收藏 - 增强错误处理
router.get('/song/:id/is-liked', asyncHandler(async (req, res) => {
  const songId = req.params.id;
  if (!songId || songId === 'undefined') {
    return res.status(400).json({ success: false, isLiked: false });
  }
  
  // 如果用户已登录，检查是否收藏
  if (req.session.user) {
    const user = await User.findById(req.session.user.id);
    const isLiked = user.likedSongs.includes(songId);
    
    res.json({ success: true, isLiked });
  } else {
    res.json({ 
      success: true, 
      isLiked: false, 
      message: '未登录用户' 
    });
  }
}));

// 获取当前播放状态 - 新增API
router.get('/playing-state', (req, res) => {
  const playingState = req.session.playingState || {
    currentSongId: null,
    currentTime: 0,
    isPlaying: false,
    volume: 1,
    playlist: [],
    currentIndex: -1
  };
  
  res.json({ success: true, playingState });
});

// 保存当前播放状态 - 新增API
router.post('/playing-state', asyncHandler(async (req, res) => {
  const { currentSongId, currentTime, isPlaying, volume, playlist, currentIndex } = req.body;
  
  req.session.playingState = {
    currentSongId,
    currentTime,
    isPlaying,
    volume,
    playlist,
    currentIndex
  };
  
  res.json({ success: true, message: '播放状态已保存' });
}));

// 获取用户创建的歌单
router.get('/user-playlists', handleUnauthorized, asyncHandler(async (req, res) => {
  const playlists = await Playlist.find({
    creator: req.session.user.id
  }).select('name coverImage songs createdAt');
  
  res.json({ 
    success: true, 
    playlists,
    count: playlists.length 
  });
}));

// 获取推荐歌单 - 新增API
router.get('/recommended-playlists', asyncHandler(async (req, res) => {
  // 基于用户登录状态提供个性化推荐
  let playlists;
  
  if (req.session.user) {
    // 已登录用户：基于用户收藏歌曲的风格推荐
    const user = await User.findById(req.session.user.id)
      .populate('likedSongs', 'genre');
    
    // 获取用户喜欢的风格
    const genres = user.likedSongs
      .map(song => song.genre)
      .filter(Boolean);
    
    if (genres.length > 0) {
      // 基于用户喜欢的风格推荐
      playlists = await Playlist.find({
        isPublic: true,
        $or: [
          { category: { $in: genres } },
          { tags: { $in: genres } }
        ]
      })
      .sort({ likes: -1 })
      .limit(6)
      .populate('creator', 'username avatar');
    } else {
      // 用户没有明显偏好，推荐热门歌单
      playlists = await Playlist.find({ 
        isPublic: true,
        isHot: true 
      })
      .sort({ likes: -1 })
      .limit(6)
      .populate('creator', 'username avatar');
    }
  } else {
    // 未登录用户：推荐热门歌单
    playlists = await Playlist.find({ 
      isPublic: true,
      isHot: true 
    })
    .sort({ likes: -1 })
    .limit(6)
    .populate('creator', 'username avatar');
  }
  
  res.json({ 
    success: true, 
    playlists,
    personalized: !!req.session.user
  });
}));

// 获取热门歌曲 - 新增API，支持个性化推荐
router.get('/hot-songs', asyncHandler(async (req, res) => {
  let songs;
  
  if (req.session.user) {
    // 已登录用户：混合热门和个性化推荐
    const user = await User.findById(req.session.user.id)
      .populate('likedSongs', 'genre artist');
    
    // 获取用户喜欢的歌手和风格
    const artistIds = [...new Set(user.likedSongs
      .map(song => song.artist?._id || song.artist)
      .filter(Boolean))];
      
    const genres = [...new Set(user.likedSongs
      .map(song => song.genre)
      .filter(Boolean))];
    
    // 推荐歌曲策略: 70%基于用户喜好，30%热门歌曲
    const personalizedSongs = await Song.find({
      $or: [
        { artist: { $in: artistIds } },
        { genre: { $in: genres } }
      ],
      _id: { $nin: user.likedSongs } // 排除已收藏的歌曲
    })
    .sort({ playCount: -1 })
    .limit(9)
    .populate('artist');
    
    const popularSongs = await Song.find({
      _id: { $nin: [...personalizedSongs.map(s => s._id), ...user.likedSongs] }
    })
    .sort({ playCount: -1 })
    .limit(4)
    .populate('artist');
    
    songs = [...personalizedSongs, ...popularSongs];
  } else {
    // 未登录用户：纯热门歌曲
    songs = await Song.find()
      .sort({ playCount: -1 })
      .limit(13) 
      .populate('artist');
  }
  
  res.json({ 
    success: true, 
    songs,
    personalized: !!req.session.user
  });
}));

// 获取歌手详情 - 新增API
router.get('/artist/:id', asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id)
    .populate('albums')
    .populate('popularSongs');
  
  if (!artist) {
    return res.status(404).json({ success: false, message: '歌手不存在' });
  }
  
  // 检查用户是否关注了此歌手
  let isFollowing = false;
  if (req.session.user) {
    const user = await User.findById(req.session.user.id);
    isFollowing = user.followingArtists.includes(artist._id);
  }
  
  // 获取歌手所有歌曲
  const songs = await Song.find({ artist: artist._id })
    .sort({ playCount: -1 })
    .populate('album');
  
  res.json({
    success: true,
    artist,
    songs,
    isFollowing
  });
}));

// 关注/取消关注歌手 - 新增API
router.post('/artist/:id/follow', handleUnauthorized, asyncHandler(async (req, res) => {
  const artistId = req.params.id;
  
  // 检查歌手是否存在
  const artist = await Artist.findById(artistId);
  if (!artist) {
    return res.status(404).json({ success: false, message: '歌手不存在' });
  }
  
  // 检查是否已关注
  const user = await User.findById(req.session.user.id);
  const isFollowing = user.followingArtists.includes(artistId);
  
  if (isFollowing) {
    // 取消关注
    await User.findByIdAndUpdate(req.session.user.id, {
      $pull: { followingArtists: artistId }
    });
    
    await Artist.findByIdAndUpdate(artistId, {
      $inc: { followers: -1 }
    });
    
    res.json({ success: true, following: false });
  } else {
    // 添加关注
    await User.findByIdAndUpdate(req.session.user.id, {
      $addToSet: { followingArtists: artistId }
    });
    
    await Artist.findByIdAndUpdate(artistId, {
      $inc: { followers: 1 }
    });
    
    res.json({ success: true, following: true });
  }
}));

// 获取专辑详情 - 新增API
router.get('/album/:id', asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id)
    .populate('artist')
    .populate('songs');
  
  if (!album) {
    return res.status(404).json({ success: false, message: '专辑不存在' });
  }
  
  res.json({
    success: true,
    album
  });
}));

// 获取歌单详情 - 新增API
router.get('/playlist/:id', asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
    .populate('creator', 'username avatar')
    .populate({
      path: 'songs',
      populate: { path: 'artist' }
    });
  
  if (!playlist) {
    return res.status(404).json({ success: false, message: '歌单不存在' });
  }
  
  // 非公开歌单需要验证权限
  if (!playlist.isPublic && (!req.session.user || req.session.user.id !== playlist.creator._id.toString())) {
    return res.status(403).json({ 
      success: false, 
      message: '您没有权限访问此私密歌单' 
    });
  }
  
  // 检查用户是否收藏了此歌单
  let isLiked = false;
  if (req.session.user) {
    isLiked = playlist.likedBy.includes(req.session.user.id);
  }
  
  res.json({
    success: true,
    playlist,
    isLiked
  });
}));

// 设备同步接口 - 新增API
router.post('/sync-device', asyncHandler(async (req, res) => {
  const { deviceId, playingState } = req.body;
  
  if (!deviceId) {
    return res.status(400).json({ success: false, message: '设备ID不能为空' });
  }
  
  // 保存设备状态
  req.session.devices = req.session.devices || {};
  req.session.devices[deviceId] = {
    lastSync: new Date(),
    playingState
  };
  
  // 返回最新的同步状态
  let syncState = req.session.playingState;
  
  // 如果没有会话状态但有请求状态，则用请求状态更新会话
  if (!syncState && playingState) {
    req.session.playingState = playingState;
    syncState = playingState;
  }
  
  res.json({
    success: true,
    deviceId,
    lastSync: new Date(),
    syncState
  });
}));

// 获取类似歌曲推荐 - 新增API
router.get('/song/:id/similar', asyncHandler(async (req, res) => {
  const songId = req.params.id;
  
  // 获取歌曲详情
  const song = await Song.findById(songId);
  if (!song) {
    return res.status(404).json({ success: false, message: '歌曲不存在' });
  }
  
  // 基于相同歌手、风格或标签推荐类似歌曲
  const similarSongs = await Song.find({
    _id: { $ne: songId },
    $or: [
      { artist: song.artist },
      { genre: song.genre },
      { tags: { $in: song.tags } }
    ]
  })
  .sort({ playCount: -1 })
  .limit(6)
  .populate('artist');
  
  res.json({
    success: true,
    originalSong: {
      id: song._id,
      title: song.title
    },
    similarSongs
  });
}));

// 获取相似歌曲推荐 - 新增API
router.get('/song/:id/similar', asyncHandler(async (req, res) => {
  const songId = req.params.id;
  
  // 获取歌曲详情
  const song = await Song.findById(songId);
  if (!song) {
    return res.status(404).json({ success: false, message: '歌曲不存在' });
  }
  
  // 基于相同歌手、风格或标签推荐类似歌曲
  const similarSongs = await Song.find({
    _id: { $ne: songId },
    $or: [
      { artist: song.artist },
      { genre: song.genre },
      { tags: { $in: song.tags || [] } }
    ]
  })
  .sort({ playCount: -1 })
  .limit(6)
  .populate('artist');
  
  res.json({
    success: true,
    originalSong: {
      id: song._id,
      title: song.title
    },
    similarSongs
  });
}));

// 获取随机推荐歌曲
router.get('/recommended-songs', asyncHandler(async (req, res) => {
  try {
    // 获取12首随机歌曲
    const songs = await Song.aggregate([
      { $sample: { size: 12 } },
      { $lookup: { from: 'artists', localField: 'artist', foreignField: '_id', as: 'artistData' } },
      { $unwind: '$artistData' }
    ]);
    
    // 格式化结果以匹配前端期望的格式
    const formattedSongs = songs.map(song => ({
      _id: song._id,
      title: song.title,
      coverImage: song.coverImage,
      audioFile: song.audioFile,
      artist: {
        _id: song.artistData._id,
        name: song.artistData.name
      }
    }));
    
    res.json(formattedSongs);
  } catch (error) {
    console.error('获取推荐歌曲失败:', error);
    res.status(500).json({ message: '获取推荐歌曲失败' });
  }
}));

module.exports = router;