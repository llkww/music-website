const Song = require('../models/Song');
const Playlist = require('../models/Playlist');
const User = require('../models/User');

// 添加歌曲评论
exports.addSongComment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const { songId, text } = req.body;
    
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: '歌曲不存在' });
    }
    
    const newComment = {
      user: req.session.user.id,
      text,
      createdAt: new Date(),
      likes: 0,
      isHot: false,
      replies: []
    };
    
    song.comments.unshift(newComment);
    await song.save();
    
    const populatedSong = await Song.findById(songId).populate('comments.user', 'username avatar');
    const addedComment = populatedSong.comments[0];
    
    res.json({ success: true, comment: addedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '添加评论失败' });
  }
};

// 回复歌曲评论
exports.replySongComment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const { songId, commentId, text } = req.body;
    
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: '歌曲不存在' });
    }
    
    const commentIndex = song.comments.findIndex(comment => comment._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    const newReply = {
      user: req.session.user.id,
      text,
      createdAt: new Date(),
      likes: 0
    };
    
    song.comments[commentIndex].replies.unshift(newReply);
    await song.save();
    
    const populatedSong = await Song.findById(songId).populate('comments.user', 'username avatar').populate('comments.replies.user', 'username avatar');
    const addedReply = populatedSong.comments[commentIndex].replies[0];
    
    res.json({ success: true, reply: addedReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '添加回复失败' });
  }
};

// 点赞歌曲评论
exports.likeSongComment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const { songId, commentId } = req.body;
    
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: '歌曲不存在' });
    }
    
    const commentIndex = song.comments.findIndex(comment => comment._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    song.comments[commentIndex].likes += 1;
    
    // 当点赞数超过100时，标记为热门评论
    if (song.comments[commentIndex].likes >= 100) {
      song.comments[commentIndex].isHot = true;
    }
    
    await song.save();
    
    res.json({ success: true, likes: song.comments[commentIndex].likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '点赞失败' });
  }
};

// 添加歌单评论
exports.addPlaylistComment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const { playlistId, text } = req.body;
    
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: '歌单不存在' });
    }
    
    const newComment = {
      user: req.session.user.id,
      text,
      createdAt: new Date(),
      likes: 0
    };
    
    playlist.comments.unshift(newComment);
    await playlist.save();
    
    const populatedPlaylist = await Playlist.findById(playlistId).populate('comments.user', 'username avatar');
    const addedComment = populatedPlaylist.comments[0];
    
    res.json({ success: true, comment: addedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '添加评论失败' });
  }
};

// 获取歌曲评论
exports.getSongComments = async (req, res) => {
  try {
    const { songId } = req.params;
    
    const song = await Song.findById(songId)
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar');
    
    if (!song) {
      return res.status(404).json({ message: '歌曲不存在' });
    }
    
    // 排序评论（热门评论在前，然后按时间倒序）
    const sortedComments = song.comments.sort((a, b) => {
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    res.json({ success: true, comments: sortedComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取评论失败' });
  }
};

// 获取歌单评论
exports.getPlaylistComments = async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    const playlist = await Playlist.findById(playlistId)
      .populate('comments.user', 'username avatar');
    
    if (!playlist) {
      return res.status(404).json({ message: '歌单不存在' });
    }
    
    // 按时间倒序排序评论
    const sortedComments = playlist.comments.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    res.json({ success: true, comments: sortedComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取评论失败' });
  }
};