const Playlist = require('../models/Playlist');
const User = require('../models/User');

// 创建歌单
exports.createPlaylist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const { name, description, isPublic } = req.body;
    
    const playlist = await Playlist.create({
      name,
      description,
      creator: req.session.user.id,
      isPublic: isPublic === 'true'
    });
    
    res.redirect(`/playlist/${playlist._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '创建歌单失败'
    });
  }
};

// 获取歌单详情
exports.getPlaylistDetails = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('creator')
      .populate({
        path: 'songs',
        populate: { path: 'artist' }
      });
    
    if (!playlist) {
      return res.status(404).render('404', { title: '歌单不存在' });
    }
    
    // 检查私密歌单的访问权限
    if (!playlist.isPublic && (!req.session.user || req.session.user.id !== playlist.creator._id.toString())) {
      return res.status(403).render('error', {
        title: '访问被拒绝',
        message: '您没有权限访问此私密歌单'
      });
    }
    
    res.render('playlist-details', {
      title: playlist.name,
      playlist
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取歌单详情失败'
    });
  }
};

// 添加歌曲到歌单
exports.addSongToPlaylist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const { playlistId, songId } = req.body;
    
    // 检查是否是歌单创建者
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: '歌单不存在' });
    }
    
    if (playlist.creator.toString() !== req.session.user.id) {
      return res.status(403).json({ message: '您没有权限修改此歌单' });
    }
    
    // 检查歌曲是否已在歌单中
    if (playlist.songs.includes(songId)) {
      return res.json({ success: true, message: '歌曲已在歌单中' });
    }
    
    // 添加歌曲到歌单
    await Playlist.findByIdAndUpdate(playlistId, {
      $push: { songs: songId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '添加歌曲失败' });
  }
};

// 从歌单移除歌曲
exports.removeSongFromPlaylist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const { playlistId, songId } = req.params;
    
    // 检查是否是歌单创建者
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: '歌单不存在' });
    }
    
    if (playlist.creator.toString() !== req.session.user.id) {
      return res.status(403).json({ message: '您没有权限修改此歌单' });
    }
    
    // 从歌单中移除歌曲
    await Playlist.findByIdAndUpdate(playlistId, {
      $pull: { songs: songId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '移除歌曲失败' });
  }
};

// 喜欢/取消喜欢歌单
exports.toggleLikePlaylist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const playlistId = req.params.id;
    const userId = req.session.user.id;
    
    // 检查歌单是否存在
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: '歌单不存在' });
    }
    
    // 检查用户是否已喜欢此歌单
    const isLiked = playlist.likedBy.includes(userId);
    
    if (isLiked) {
      // 取消喜欢
      await Playlist.findByIdAndUpdate(playlistId, {
        $pull: { likedBy: userId },
        $inc: { likes: -1 }
      });
    } else {
      // 添加喜欢
      await Playlist.findByIdAndUpdate(playlistId, {
        $push: { likedBy: userId },
        $inc: { likes: 1 }
      });
    }
    
    res.json({ success: true, liked: !isLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '操作失败' });
  }
};