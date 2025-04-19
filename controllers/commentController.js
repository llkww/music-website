const Song = require('../models/Song');
const Playlist = require('../models/Playlist');
const User = require('../models/User');

// 添加歌曲评论
exports.addSongComment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    // 改为从URL参数获取ID
    const songId = req.params.id;
    const { text } = req.body;
    
    console.log('添加歌曲评论:', { songId, text });
    
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
    console.error('添加歌曲评论出错:', error);
    res.status(500).json({ message: '添加评论失败', error: error.message });
  }
};

// 回复评论通用函数
exports.replyComment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const contentId = req.params.id;
    const commentId = req.params.commentId;
    const { text } = req.body;
    
    // 根据URL确定内容类型
    const contentType = req.originalUrl.includes('playlist') ? 'playlist' : 'song';
    
    console.log('回复评论:', { contentId, commentId, contentType, userId: req.session.user.id });
    
    let content;
    if (contentType === 'song') {
      content = await Song.findById(contentId);
      if (!content) {
        return res.status(404).json({ message: '歌曲不存在' });
      }
    } else if (contentType === 'playlist') {
      content = await Playlist.findById(contentId);
      if (!content) {
        return res.status(404).json({ message: '歌单不存在' });
      }
    } else {
      return res.status(400).json({ message: '不支持的内容类型' });
    }
    
    const commentIndex = content.comments.findIndex(comment => comment._id.toString() === commentId);
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
    
    content.comments[commentIndex].replies = content.comments[commentIndex].replies || [];
    content.comments[commentIndex].replies.unshift(newReply);
    await content.save();
    
    let populatedContent;
    if (contentType === 'song') {
      populatedContent = await Song.findById(contentId)
        .populate('comments.user', 'username avatar')
        .populate('comments.replies.user', 'username avatar');
    } else {
      populatedContent = await Playlist.findById(contentId)
        .populate('comments.user', 'username avatar')
        .populate('comments.replies.user', 'username avatar');
    }
    
    const addedReply = populatedContent.comments[commentIndex].replies[0];
    
    res.json({ success: true, reply: addedReply });
  } catch (error) {
    console.error('回复评论出错:', error);
    res.status(500).json({ message: '添加回复失败', error: error.message });
  }
};

// 点赞评论通用函数
exports.likeComment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const contentId = req.params.id;
    const commentId = req.params.commentId;
    const { type = 'comment' } = req.body; // 评论类型 comment 或 reply
    
    // 根据URL确定内容类型
    const contentType = req.originalUrl.includes('playlist') ? 'playlist' : 'song';
    
    console.log('点赞评论:', { contentId, commentId, type, contentType, userId: req.session.user.id });
    
    let content;
    if (contentType === 'song') {
      content = await Song.findById(contentId);
      if (!content) {
        return res.status(404).json({ message: '歌曲不存在' });
      }
    } else if (contentType === 'playlist') {
      content = await Playlist.findById(contentId);
      if (!content) {
        return res.status(404).json({ message: '歌单不存在' });
      }
    } else {
      return res.status(400).json({ message: '不支持的内容类型' });
    }
    
    if (type === 'reply') {
      // 处理回复点赞
      let commentFound = false;
      let replyLiked = false;
      let replyLikes = 0;
      
      for (let i = 0; i < content.comments.length; i++) {
        const replies = content.comments[i].replies || [];
        
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
        
        if (commentFound) break;
      }
      
      if (!commentFound) {
        return res.status(404).json({ message: '回复不存在' });
      }
      
      await content.save();
      res.json({ success: true, liked: replyLiked, likes: replyLikes });
      
    } else {
      // 处理评论点赞
      const commentIndex = content.comments.findIndex(comment => comment._id.toString() === commentId);
      if (commentIndex === -1) {
        return res.status(404).json({ message: '评论不存在' });
      }
      
      // 检查用户是否已经点赞
      const comment = content.comments[commentIndex];
      const commentLikes = comment.likedBy || [];
      const userIndex = commentLikes.indexOf(req.session.user.id);
      
      let isLiked = false;
      
      if (userIndex === -1) {
        // 添加点赞
        content.comments[commentIndex].likes += 1;
        content.comments[commentIndex].likedBy = [...commentLikes, req.session.user.id];
        isLiked = true;
        
        // 当点赞数超过100时，标记为热门评论
        if (content.comments[commentIndex].likes >= 100) {
          content.comments[commentIndex].isHot = true;
        }
      } else {
        // 取消点赞
        content.comments[commentIndex].likes = Math.max(0, content.comments[commentIndex].likes - 1);
        content.comments[commentIndex].likedBy = commentLikes.filter(id => id !== req.session.user.id);
        isLiked = false;
        
        // 取消热门标记（如果点赞数低于100）
        if (content.comments[commentIndex].likes < 100) {
          content.comments[commentIndex].isHot = false;
        }
      }
      
      await content.save();
      
      res.json({ 
        success: true, 
        liked: isLiked, 
        likes: content.comments[commentIndex].likes 
      });
    }
  } catch (error) {
    console.error('点赞评论出错:', error);
    res.status(500).json({ message: '点赞失败', error: error.message });
  }
};

// 添加歌单评论
exports.addPlaylistComment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    // 改为从URL参数获取ID
    const playlistId = req.params.id;
    const { text } = req.body;
    
    console.log('添加歌单评论:', { playlistId, text });
    
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: '歌单不存在' });
    }
    
    const newComment = {
      user: req.session.user.id,
      text,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
      replies: [] // 确保有replies字段
    };
    
    playlist.comments.unshift(newComment);
    await playlist.save();
    
    const populatedPlaylist = await Playlist.findById(playlistId).populate('comments.user', 'username avatar');
    const addedComment = populatedPlaylist.comments[0];
    
    res.json({ success: true, comment: addedComment });
  } catch (error) {
    console.error('添加歌单评论出错:', error);
    res.status(500).json({ message: '添加评论失败', error: error.message });
  }
};

// 为了保持向后兼容
exports.replySongComment = exports.replyComment;
exports.likeSongComment = exports.likeComment;

// 获取歌曲评论
exports.getSongComments = async (req, res) => {
  try {
    const { id: songId } = req.params;
    const { sortBy = 'time' } = req.query; // 增加排序参数：time 或 likes
    
    console.log('获取歌曲评论:', songId, '排序方式:', sortBy);
    
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
    
    // 根据排序参数排序评论
    const sortedComments = comments.sort((a, b) => {
      if (sortBy === 'likes') {
        // 按热度排序（点赞数）：先考虑热门评论标记，然后按点赞数排序
        if (a.isHot && !b.isHot) return -1;
        if (!a.isHot && b.isHot) return 1;
        return b.likes - a.likes;
      } else {
        // 按时间排序（默认）：先考虑热门评论标记，然后按时间倒序
        if (a.isHot && !b.isHot) return -1;
        if (!a.isHot && b.isHot) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    res.json({ success: true, comments: sortedComments });
  } catch (error) {
    console.error('获取歌曲评论失败:', error);
    res.status(500).json({ success: false, message: '获取评论失败', error: error.message });
  }
};

// 获取歌单评论
exports.getPlaylistComments = async (req, res) => {
  try {
    const { id: playlistId } = req.params;
    const { sortBy = 'time' } = req.query; // 增加排序参数：time 或 likes
    
    console.log('获取歌单评论:', playlistId, '排序方式:', sortBy);
    
    const playlist = await Playlist.findById(playlistId)
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar');
    
    if (!playlist) {
      return res.status(404).json({ success: false, message: '歌单不存在' });
    }
    
    if (!playlist.comments) {
      console.log('歌单没有评论字段，初始化为空数组');
      return res.json({ success: true, comments: [] });
    }
    
    // 处理评论的已点赞状态
    const comments = JSON.parse(JSON.stringify(playlist.comments));
    
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
    
    // 根据排序参数排序评论
    const sortedComments = comments.sort((a, b) => {
      if (sortBy === 'likes') {
        // 按热度排序（点赞数）：先考虑热门评论标记，然后按点赞数排序
        if (a.isHot && !b.isHot) return -1;
        if (!a.isHot && b.isHot) return 1;
        return b.likes - a.likes;
      } else {
        // 按时间排序（默认）：先考虑热门评论标记，然后按时间倒序
        if (a.isHot && !b.isHot) return -1;
        if (!a.isHot && b.isHot) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    console.log(`找到歌单评论 ${sortedComments.length} 条`);
    res.json({ success: true, comments: sortedComments });
  } catch (error) {
    console.error('获取歌单评论失败:', error);
    res.status(500).json({ success: false, message: '获取评论失败', error: error.message });
  }
};