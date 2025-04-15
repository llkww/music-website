const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 登录页面
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { title: '登录' });
});

// 处理登录
router.post('/login', authController.login);

// 注册页面
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('register', { title: '注册' });
});

// 处理注册
router.post('/register', authController.register);

// 退出登录
router.get('/logout', authController.logout);

module.exports = router;