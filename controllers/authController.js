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
      avatar: user.avatar,
      isVIP: user.isVIP
    };
    
    res.redirect('/');
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
        title: '登录'
      });
    }
    
    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).render('login', {
        error: '邮箱或密码不正确',
        title: '登录'
      });
    }
    
    // 保存用户会话
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isVIP: user.isVIP
    };
    
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).render('login', {
      error: '登录失败，请稍后再试',
      title: '登录'
    });
  }
};

// 退出登录
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};