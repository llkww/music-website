const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');

// 身份验证中间件
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// 关注用户
router.post('/user/:id/follow', isAuthenticated, socialController.followUser);

// 关注艺术家
router.post('/artist/:id/follow', isAuthenticated, socialController.followArtist);

// 获取用户关注的人
router.get('/following/:id?', isAuthenticated, socialController.getFollowing);

// 获取用户的粉丝
router.get('/followers/:id?', isAuthenticated, socialController.getFollowers);

// 用户个人主页
router.get('/profile/:id', socialController.getUserProfile);

module.exports = router;