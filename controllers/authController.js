const User = require('../models/User');

// 注册用户
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).render('register', {
        error: '用户名或邮箱已被注册',
        title: '注册'
      });
    }
    
    // 创建新用户
    const user = await User.create({
      username,
      email,
      password
    });
    
    // 登录用户
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    };
    
    // 如果是从其他页面跳转过来注册的，注册完成后返回原页面
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    
    res.redirect(returnTo);
  } catch (error) {
    console.error(error);
    res.status(500).render('register', {
      error: '注册失败，请稍后再试',
      title: '注册'
    });
  }
};

// 登录用户
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).render('login', {
        error: '邮箱或密码不正确',
        title: '登录',
        returnTo: req.query.returnTo,
        authMessage: req.session.authMessage
      });
    }
    
    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).render('login', {
        error: '邮箱或密码不正确',
        title: '登录',
        returnTo: req.query.returnTo,
        authMessage: req.session.authMessage
      });
    }
    
    // 保存用户会话
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    };
    
    // 获取并清除认证消息
    const authMessage = req.session.authMessage;
    delete req.session.authMessage;
    
    // 检查是否有返回URL
    const returnTo = req.query.returnTo || req.session.returnTo || '/';
    delete req.session.returnTo;
    
    res.redirect(returnTo);
  } catch (error) {
    console.error(error);
    res.status(500).render('login', {
      error: '登录失败，请稍后再试',
      title: '登录',
      returnTo: req.query.returnTo
    });
  }
};

// 退出登录
exports.logout = (req, res) => {
  // 在销毁会话前先保存音乐播放状态
  const musicState = {
    isPlaying: req.session.musicState?.isPlaying,
    currentTime: req.session.musicState?.currentTime,
    currentSongId: req.session.musicState?.currentSongId
  };
  
  req.session.destroy(() => {
    // 重定向到首页，同时传递保存的音乐状态（通过URL参数）
    // 这样即使退出登录也能继续播放音乐
    if (musicState.currentSongId) {
      res.redirect(`/?resumeMusic=true&songId=${musicState.currentSongId}&currentTime=${musicState.currentTime}&isPlaying=${musicState.isPlaying}`);
    } else {
      res.redirect('/');
    }
  });
};