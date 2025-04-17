const User = require('../models/User');
const Playlist = require('../models/Playlist');
const fs = require('fs');
const path = require('path');

// 获取用户个人资料
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).render('404', { title: '用户不存在' });
    }
    
    const playlists = await Playlist.find({ creator: user._id });
    
    res.render('profile', {
      title: '个人资料',
      user,
      playlists
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取个人资料失败'
    });
  }
};

// 更新用户个人资料
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, gender, birthday } = req.body;
    
    // 查找并更新用户
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      { username, bio, gender, birthday },
      { new: true }
    );
    
    // 更新会话中的用户信息
    req.session.user.username = updatedUser.username;
    
    res.redirect('/user/profile');
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '更新个人资料失败'
    });
  }
};

// 上传头像
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    
    // 更新用户头像
    const user = await User.findByIdAndUpdate(
      req.session.user.id,
      { avatar: avatarPath },
      { new: true }
    );
    
    // 更新会话中的头像
    req.session.user.avatar = avatarPath;
    
    res.json({ success: true, avatarPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '上传头像失败' });
  }
};

// 开通VIP会员
exports.upgradeVIP = async (req, res) => {
  try {
    // 模拟支付过程 - 实际应用中会有真实支付处理
    const vipExpiry = new Date();
    vipExpiry.setMonth(vipExpiry.getMonth() + 1); // 一个月VIP
    
    // 更新用户VIP状态
    await User.findByIdAndUpdate(req.session.user.id, {
      isVIP: true,
      vipExpiry
    });
    
    // 更新会话
    req.session.user.isVIP = true;
    
    res.json({ success: true, expiry: vipExpiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '开通VIP失败' });
  }
};

// 获取收藏的歌曲
exports.getLikedSongs = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id)
      .populate({
        path: 'likedSongs',
        populate: { path: 'artist' }
      });
    
    // 如果是AJAX请求，返回HTML片段
    if (req.xhr) {
      return res.render('partials/liked-songs-content', {
        songs: user.likedSongs
      });
    }
    
    res.render('liked-songs', {
      title: '我喜欢的音乐',
      songs: user.likedSongs
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取喜欢的音乐失败'
    });
  }
};

// 获取播放历史
exports.getPlayHistory = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id)
      .populate({
        path: 'recentPlayed.song',
        populate: { path: 'artist' }
      });
    
    res.render('play-history', {
      title: '播放历史',
      history: user.recentPlayed
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '获取播放历史失败'
    });
  }
};