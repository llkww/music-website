const app = require('./app');
const mongoose = require('mongoose');
const { mongoURI } = require('./config/db');

// 连接到MongoDB数据库
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.log('MongoDB连接失败:', err));

// 设置端口并启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});