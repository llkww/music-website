const User = require('../models/User');
const Artist = require('../models/Artist');
const Notification = require('../models/Notification');

// 关注用户
exports.followUser = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const userId = req.session.user.id;
    const targetUserId = req.params.id;
    
    // 不能关注自己
    if (userId === targetUserId) {
      return res.status(400).json({ message: '不能关注自己' });
    }
    
    // 查找目标用户
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 检查是否已经关注
    const currentUser = await User.findById(userId);
    const isFollowing = currentUser.following.includes(targetUserId);
    
    if (isFollowing) {
      // 取消关注
      await User.findByIdAndUpdate(userId, {
        $pull: { following: targetUserId }
      });
      
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: userId }
      });
      
      // 创建通知（取消关注不需要通知）
      
      res.json({ success: true, following: false });
    } else {
      // 添加关注
      await User.findByIdAndUpdate(userId, {
        $addToSet: { following: targetUserId }
      });
      
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: userId }
      });
      
      // 创建通知
      await Notification.create({
        recipient: targetUserId,
        sender: userId,
        type: 'follow',
        message: `${currentUser.username} 关注了你`
      });
      
      res.json({ success: true, following: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '操作失败' });
  }
};

// 关注艺术家
exports.followArtist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const userId = req.session.user.id;
    const artistId = req.params.id;
    
    // 查找艺术家
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ message: '艺术家不存在' });
    }
    
    // 检查是否已经关注
    const user = await User.findById(userId);
    const isFollowing = user.followingArtists.includes(artistId);
    
    if (isFollowing) {
      // 取消关注
      await User.findByIdAndUpdate(userId, {
        $pull: { followingArtists: artistId }
      });
      
      // 减少艺术家粉丝数
      await Artist.findByIdAndUpdate(artistId, {
        $inc: { followers: -1 }
      });
      
      res.json({ success: true, following: false });
    } else {
      // 添加关注
      await User.findByIdAndUpdate(userId, {
        $addToSet: { followingArtists: artistId }
      });
      
      // 增加艺术家粉丝数
      await Artist.findByIdAndUpdate(artistId, {
        $inc: { followers: 1 }
      });
      
      res.json({ success: true, following: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '操作失败' });
  }
};

// 获取用户关注的人
exports.getFollowing = async (req, res) => {
  try {
    const userId = req.params.id || req.session.user.id;
    
    const user = await User.findById(userId)
      .populate('following', 'username avatar bio')
      .populate('followingArtists', 'name image bio');
    
    if (!user) {
      return res.status(404).render('404', { title: '用户不存在' });
    }
    
    res.render('following', {
      title: '关注的人',
      user,
      following: user.following,
      followingArtists: user.followingArtists
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取关注列表失败'
    });
  }
};

// 获取用户的粉丝
exports.getFollowers = async (req, res) => {
  try {
    const userId = req.params.id || req.session.user.id;
    
    const user = await User.findById(userId)
      .populate('followers', 'username avatar bio');
    
    if (!user) {
      return res.status(404).render('404', { title: '用户不存在' });
    }
    
    res.render('followers', {
      title: '粉丝',
      user,
      followers: user.followers
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取粉丝列表失败'
    });
  }
};

// 获取用户个人主页
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId)
      .populate('likedSongs', 'title artist coverImage')
      .populate({
        path: 'likedSongs',
        populate: { path: 'artist', select: 'name' }
      });
    
    if (!user) {
      return res.status(404).render('404', { title: '用户不存在' });
    }
    
    // 获取用户创建的歌单
    const playlists = await require('../models/Playlist').find({
      creator: userId,
      isPublic: true
    }).sort({ createdAt: -1 });
    
    // 检查当前用户是否已关注此用户
    let isFollowing = false;
    if (req.session.user) {
      const currentUser = await User.findById(req.session.user.id);
      isFollowing = currentUser.following.includes(userId);
    }
    
    res.render('user-profile', {
      title: user.username,
      profileUser: user,
      playlists,
      isFollowing
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取用户信息失败'
    });
  }
};