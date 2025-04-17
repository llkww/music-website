const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const { mongoURI } = require('./config/db');

// 路由导入
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const musicRoutes = require('./routes/music');
const playlistRoutes = require('./routes/playlist');
const apiRoutes = require('./routes/api');
const socialRoutes = require('./routes/social');
const albumRoutes = require('./routes/album');
const artistRoutes = require('./routes/artist');

const app = express();

// 视图引擎设置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 会话设置
app.use(session({
  secret: 'music_website_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: mongoURI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1天
}));

// 设置全局变量
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// 路由
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/music', musicRoutes);
app.use('/playlist', playlistRoutes);
app.use('/api', apiRoutes);
app.use('/social', socialRoutes);
app.use('/album', albumRoutes);
app.use('/artist', artistRoutes);

// 错误处理
app.use((req, res) => {
  res.status(404).render('404', { title: '页面未找到' });
});

module.exports = app;