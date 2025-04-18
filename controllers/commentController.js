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
      likedBy: [],
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
      likes: 0,
      likedBy: []
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
    const { type = 'comment' } = req.body; // 新增：评论类型 comment 或 reply
    
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: '歌曲不存在' });
    }
    
    if (type === 'reply') {
      // 处理回复点赞
      let commentFound = false;
      let replyLiked = false;
      let replyLikes = 0;
      
      for (let i = 0; i < song.comments.length; i++) {
        const replies = song.comments[i].replies;
        
        if (replies) {
          for (let j = 0; j < replies.length; j++) {
            if (replies[j]._id.toString() === commentId) {
              // 查找用户是否已点赞
              const replyLikesArray = replies[j].likedBy || [];
              const userIndex = replyLikesArray.indexOf(req.session.user.id);
              
              if (userIndex === -1) {
                // 添加点赞
                replies[j].likes = (replies[j].likes || 0) + 1;
                replies[j].likedBy = [...replyLikesArray, req.session.user.id];
                replyLiked = true;
              } else {
                // 取消点赞
                replies[j].likes = Math.max(0, (replies[j].likes || 0) - 1);
                replies[j].likedBy = replyLikesArray.filter(id => id !== req.session.user.id);
                replyLiked = false;
              }
              
              replyLikes = replies[j].likes;
              commentFound = true;
              break;
            }
          }
        }
        
        if (commentFound) break;
      }
      
      if (!commentFound) {
        return res.status(404).json({ message: '回复不存在' });
      }
      
      await song.save();
      res.json({ success: true, liked: replyLiked, likes: replyLikes });
      
    } else {
      // 处理评论点赞
      const commentIndex = song.comments.findIndex(comment => comment._id.toString() === commentId);
      if (commentIndex === -1) {
        return res.status(404).json({ message: '评论不存在' });
      }
      
      // 检查用户是否已经点赞
      const comment = song.comments[commentIndex];
      const commentLikes = comment.likedBy || [];
      const userIndex = commentLikes.indexOf(req.session.user.id);
      
      let isLiked = false;
      
      if (userIndex === -1) {
        // 添加点赞
        song.comments[commentIndex].likes += 1;
        song.comments[commentIndex].likedBy = [...commentLikes, req.session.user.id];
        isLiked = true;
        
        // 当点赞数超过100时，标记为热门评论
        if (song.comments[commentIndex].likes >= 100) {
          song.comments[commentIndex].isHot = true;
        }
      } else {
        // 取消点赞
        song.comments[commentIndex].likes = Math.max(0, song.comments[commentIndex].likes - 1);
        song.comments[commentIndex].likedBy = commentLikes.filter(id => id !== req.session.user.id);
        isLiked = false;
      }
      
      await song.save();
      
      res.json({ 
        success: true, 
        liked: isLiked, 
        likes: song.comments[commentIndex].likes 
      });
    }
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
      likes: 0,
      likedBy: []
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
    const { id: songId } = req.params; // 使用id参数而不是songId
    
    const song = await Song.findById(songId)
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar');
    
    if (!song) {
      return res.status(404).json({ success: false, message: '歌曲不存在' });
    }
    
    // 处理评论的已点赞状态
    const comments = JSON.parse(JSON.stringify(song.comments));
    
    if (req.session.user) {
      const userId = req.session.user.id;
      
      comments.forEach(comment => {
        comment.liked = comment.likedBy && comment.likedBy.includes(userId);
        
        if (comment.replies) {
          comment.replies.forEach(reply => {
            reply.liked = reply.likedBy && reply.likedBy.includes(userId);
          });
        }
      });
    }
    
    // 排序评论（热门评论在前，然后按时间倒序）
    const sortedComments = comments.sort((a, b) => {
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    res.json({ success: true, comments: sortedComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '获取评论失败' });
  }
};

// 获取歌单评论
exports.getPlaylistComments = async (req, res) => {
  try {
    const { id: playlistId } = req.params; // 使用id参数而不是playlistId
    
    const playlist = await Playlist.findById(playlistId)
      .populate('comments.user', 'username avatar');
    
    if (!playlist) {
      return res.status(404).json({ success: false, message: '歌单不存在' });
    }
    
    // 处理评论的已点赞状态
    const comments = JSON.parse(JSON.stringify(playlist.comments));
    
    if (req.session.user) {
      const userId = req.session.user.id;
      
      comments.forEach(comment => {
        comment.liked = comment.likedBy && comment.likedBy.includes(userId);
      });
    }
    
    // 按时间倒序排序评论
    const sortedComments = comments.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    res.json({ success: true, comments: sortedComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '获取评论失败' });
  }
};