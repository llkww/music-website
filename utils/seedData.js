const mongoose = require('mongoose');
const User = require('../models/User');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Song = require('../models/Song');
const Playlist = require('../models/Playlist');
const bcrypt = require('bcryptjs');
const { mongoURI } = require('../config/db');

// 连接数据库
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.log('MongoDB连接失败:', err));

// 清空所有集合
const clearCollections = async () => {
  await User.deleteMany({});
  await Artist.deleteMany({});
  await Album.deleteMany({});
  await Song.deleteMany({});
  await Playlist.deleteMany({});
  console.log('所有集合已清空');
};

// 创建示例数据
const createSampleData = async () => {
  // 创建用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);
  
  const admin = await User.create({
    username: 'admin',
    email: 'admin@example.com',
    password: adminPassword,
    isVIP: true,
    vipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  
  const user = await User.create({
    username: 'user',
    email: 'user@example.com',
    password: userPassword
  });
  
  console.log('用户创建成功');
  
  // 创建歌手
  const artists = await Artist.create([
    {
      name: '周杰伦',
      bio: '华语流行乐坛知名歌手、音乐人、词曲创作人',
      image: '/img/artists/jay.jpg',
      genres: ['流行', '华语'],
      followers: 10000000
    },
    {
      name: 'Taylor Swift',
      bio: '美国知名流行音乐歌手、词曲创作人',
      image: '/img/artists/taylor.jpg',
      genres: ['流行', '欧美'],
      followers: 8000000
    },
    {
      name: 'Ed Sheeran',
      bio: '英国著名创作歌手',
      image: '/img/artists/ed.jpg',
      genres: ['流行', '欧美'],
      followers: 7500000
    },
    {
      name: '陈奕迅',
      bio: '香港著名歌手、演员',
      image: '/img/artists/eason.jpg',
      genres: ['流行', '华语'],
      followers: 9000000
    }
  ]);
  
  console.log('歌手创建成功');
  
  // 创建专辑
  const albums = await Album.create([
    {
      title: '范特西',
      artist: artists[0]._id,
      coverImage: '/img/albums/fantasy.jpg',
      releaseDate: new Date('2001-09-14'),
      genre: '流行'
    },
    {
      title: '1989',
      artist: artists[1]._id,
      coverImage: '/img/albums/1989.jpg',
      releaseDate: new Date('2014-10-27'),
      genre: '流行'
    },
    {
      title: '÷ (Divide)',
      artist: artists[2]._id,
      coverImage: '/img/albums/divide.jpg',
      releaseDate: new Date('2017-03-03'),
      genre: '流行'
    },
    {
      title: 'U87',
      artist: artists[3]._id,
      coverImage: '/img/albums/u87.jpg',
      releaseDate: new Date('2005-11-07'),
      genre: '流行'
    }
  ]);
  
  console.log('专辑创建成功');
  
  // 创建歌曲
  const songs = await Song.create([
    {
      title: '爱在西元前',
      artist: artists[0]._id,
      album: albums[0]._id,
      duration: 216,
      releaseYear: 2001,
      genre: '流行',
      language: '华语',
      coverImage: '/img/albums/fantasy.jpg',
      audioFile: '/audio/jay/love_before.mp3',
      lyrics: '[00:00.00]爱在西元前 - 周杰伦\n[00:05.00]作词：方文山\n[00:10.00]作曲：周杰伦\n[00:15.00]编曲：周杰伦\n[00:28.14]古巴比伦王颁布了汉摩拉比法典\n[00:32.95]刻在黑色的玄武岩 距今已经三千七百多年\n[00:41.68]你在橱窗前 凝视碑文的字眼\n[00:46.19]我却在旁静静欣赏你那张我深爱的脸\n[00:52.94]祭司 神殿 征战 弓箭 是谁的从前\n[01:03.94]喜欢在人潮中你只属于我的那画面\n[01:09.95]经过苏美女神身边 我以女神之名许愿\n[01:16.95]我们的爱 统治 宇宙 身边 最远的石板\n[01:25.20]你是我 唯一 的神话\n[01:32.20]我已经 无法分辨 最近是否 我爱上了你\n[01:40.71]古老的索米尔人 把牛羊刻在洞穴的墙上\n[01:49.72]我却用漫天的星子 讲述我对你的爱恋\n[01:58.21]我给你的爱写在西元前\n[02:02.97]深埋在美索不达米亚平原\n[02:10.70]几十个世纪后出土发现\n[02:15.23]泥板上的字迹依然清晰可见\n[02:21.73]我给你的爱写在西元前\n[02:26.48]深埋在美索不达米亚平原\n[02:34.23]用楔形文字刻下了永远\n[02:39.73]那已风化千年的誓言 一切又重演\n[03:06.01]祭司 神殿 征战 弓箭 是谁的从前\n[03:17.03]喜欢在人潮中你只属于我的那画面\n[03:22.76]经过苏美女神身边 我以女神之名许愿\n[03:29.77]我们的爱 统治 宇宙 身边 最远的石板\n[03:38.76]你是我 唯一 的神话\n[03:45.26]我已经 无法分辨 最近是否 我爱上了你\n[03:53.99]古老的索米尔人 把牛羊刻在洞穴的墙上\n[04:02.76]我却用漫天的星子 讲述我对你的爱恋\n[04:11.01]我给你的爱写在西元前\n[04:15.75]深埋在美索不达米亚平原\n[04:23.55]几十个世纪后出土发现\n[04:28.05]泥板上的字迹依然清晰可见\n[04:34.56]我给你的爱写在西元前\n[04:39.52]深埋在美索不达米亚平原\n[04:47.06]用楔形文字刻下了永远\n[04:52.56]那已风化千年的誓言 一切又重演',
      playCount: 1500000,
      likes: 980000
    },
    {
      title: '简单爱',
      artist: artists[0]._id,
      album: albums[0]._id,
      duration: 258,
      releaseYear: 2001,
      genre: '流行',
      language: '华语',
      coverImage: '/img/albums/fantasy.jpg',
      audioFile: '/audio/jay/simple_love.mp3',
      lyrics: '[00:00.00]简单爱 - 周杰伦\n[00:05.00]作词：徐若瑄\n[00:10.00]作曲：周杰伦\n[00:15.00]编曲：周杰伦\n[00:20.00]制作人：周杰伦\n[00:27.11]说不上为什么 我变得很少说话\n[00:33.90]我待你如初恋 竟然不像话\n[00:40.23]爱上你很难 讨厌你更难\n[00:43.79]躲闪的眼光 笨拙的欺骗\n[00:47.33]你的心事不用说 我都知道\n[00:53.78]我想你为我好 我也为你好\n[01:00.55]没有什么 是不值得\n[01:04.06]没有什么 是太难的\n[01:07.79]只要你愿意 只要我愿意\n[01:14.35]想要为你做的事太多\n[01:18.09]让你喝的酒不要太多\n[01:21.71]肩膀如果痛 就不要带太多\n[01:28.03]在你的心中 我能不能占据一点点\n[01:34.24]你的眼中 我能不能偶尔停留一会\n[01:40.83]减少你给的压力 不要让步调变得急急急\n[01:47.58]彼此的关系单纯一点点\n[01:51.23]只要你继续爱着我\n[01:54.78]阳光依旧灿烂着\n[01:58.38]有你的将来 我不怕磨练\n[02:05.01]不要轻言放弃 就算你说了会后悔\n[02:11.10]不要轻言放弃 就算你会哭泣\n[02:17.79]相信我 没有什么事情是不能说\n[02:24.27]对你的爱永远都不变',
      playCount: 1200000,
      likes: 870000
    },
    {
      title: 'Shake It Off',
      artist: artists[1]._id,
      album: albums[1]._id,
      duration: 219,
      releaseYear: 2014,
      genre: '流行',
      language: '欧美',
      coverImage: '/img/albums/1989.jpg',
      audioFile: '/audio/taylor/shake_it_off.mp3',
      lyrics: '[00:00.00]Shake It Off - Taylor Swift\n[00:05.00]Lyrics by: Taylor Swift, Max Martin, Shellback\n[00:10.00]Composed by: Taylor Swift, Max Martin, Shellback\n[00:15.00]I stay out too late, got nothing in my brain\n[00:19.00]That\'s what people say, mmm hmm, that\'s what people say, mmm hmm\n[00:23.00]I go on too many dates, but I can\'t make them stay\n[00:27.00]At least that\'s what people say mmm mmm, that\'s what people say mmm mmm\n[00:30.00]But I keep cruising, can\'t stop, won\'t stop moving\n[00:34.00]It\'s like I got this music in my mind, saying it\'s gonna be alright\n[00:39.00]Cause the players gonna play, play, play, play, play\n[00:43.00]And the haters gonna hate, hate, hate, hate, hate\n[00:47.00]Baby, I\'m just gonna shake, shake, shake, shake, shake\n[00:51.00]I shake it off, I shake it off\n[00:55.00]Heartbreakers gonna break, break, break, break, break\n[00:59.00]And the fakers gonna fake, fake, fake, fake, fake\n[01:03.00]Baby, I\'m just gonna shake, shake, shake, shake, shake\n[01:07.00]I shake it off, I shake it off',
      playCount: 2500000,
      likes: 1800000
    },
    {
      title: 'Shape of You',
      artist: artists[2]._id,
      album: albums[2]._id,
      duration: 233,
      releaseYear: 2017,
      genre: '流行',
      language: '欧美',
      coverImage: '/img/albums/divide.jpg',
      audioFile: '/audio/ed/shape_of_you.mp3',
      lyrics: '[00:00.00]Shape of You - Ed Sheeran\n[00:05.00]Lyrics by: Ed Sheeran, Steve Mac, Johnny McDaid\n[00:10.00]Composed by: Ed Sheeran, Steve Mac, Johnny McDaid\n[00:15.00]The club isn\'t the best place to find a lover\n[00:19.00]So the bar is where I go\n[00:23.00]Me and my friends at the table doing shots\n[00:27.00]Drinking fast and then we talk slow\n[00:31.00]Come over and start up a conversation with just me\n[00:35.00]And trust me I\'ll give it a chance now\n[00:39.00]Take my hand, stop, put Van the Man on the jukebox\n[00:43.00]And then we start to dance, and now I\'m singing like\n[00:47.00]Girl, you know I want your love\n[00:51.00]Your love was handmade for somebody like me\n[00:55.00]Come on now, follow my lead\n[00:59.00]I may be crazy, don\'t mind me\n[01:03.00]Say, boy, let\'s not talk too much\n[01:07.00]Grab on my waist and put that body on me\n[01:11.00]Come on now, follow my lead\n[01:15.00]Come, come on now, follow my lead',
      playCount: 3000000,
      likes: 2200000
    },
    {
      title: '十年',
      artist: artists[3]._id,
      album: albums[3]._id,
      duration: 204,
      releaseYear: 2003,
      genre: '流行',
      language: '华语',
      coverImage: '/img/albums/u87.jpg',
      audioFile: '/audio/eason/ten_years.mp3',
      lyrics: '[00:00.00]十年 - 陈奕迅\n[00:05.00]作词：林夕\n[00:10.00]作曲：陈小霞\n[00:15.00]编曲：杜自持\n[00:20.00]如果那两个字没有颤抖\n[00:25.00]我不会发现我难受\n[00:30.00]怎么说出口 也不过是分手\n[00:35.00]如果对于明天没有要求\n[00:40.00]牵牵手就像旅游\n[00:45.00]成千上万个门口\n[00:50.00]总有一个人要先走\n[00:55.00]怀抱既然不能逗留\n[01:00.00]何不在离开的时候\n[01:05.00]一边享受 一边泪流\n[01:10.00]十年之前 我不认识你 你不属于我\n[01:15.00]我们还是一样陪在一个陌生人左右\n[01:20.00]十年之后 我们是朋友 还可以问候\n[01:25.00]只是那种温柔 再也找不到拥抱的理由\n[01:30.00]情人最后难免沦为朋友',
      playCount: 1800000,
      likes: 1200000
    }
  ]);
  
  console.log('歌曲创建成功');
  
  // 更新专辑中的歌曲
  await Album.findByIdAndUpdate(albums[0]._id, {
    songs: [songs[0]._id, songs[1]._id]
  });
  
  await Album.findByIdAndUpdate(albums[1]._id, {
    songs: [songs[2]._id]
  });
  
  await Album.findByIdAndUpdate(albums[2]._id, {
    songs: [songs[3]._id]
  });
  
  await Album.findByIdAndUpdate(albums[3]._id, {
    songs: [songs[4]._id]
  });
  
  console.log('专辑歌曲关联成功');
  
  // 更新歌手中的热门歌曲和专辑
  await Artist.findByIdAndUpdate(artists[0]._id, {
    popularSongs: [songs[0]._id, songs[1]._id],
    albums: [albums[0]._id]
  });
  
  await Artist.findByIdAndUpdate(artists[1]._id, {
    popularSongs: [songs[2]._id],
    albums: [albums[1]._id]
  });
  
  await Artist.findByIdAndUpdate(artists[2]._id, {
    popularSongs: [songs[3]._id],
    albums: [albums[2]._id]
  });
  
  await Artist.findByIdAndUpdate(artists[3]._id, {
    popularSongs: [songs[4]._id],
    albums: [albums[3]._id]
  });
  
  console.log('歌手热门歌曲和专辑关联成功');
  
  // 创建歌单
  const playlists = await Playlist.create([
    {
      name: '流行华语精选',
      creator: admin._id,
      description: '精选华语流行歌曲，陪伴你的每一天',
      songs: [songs[0]._id, songs[1]._id, songs[4]._id],
      likes: 5000,
      tags: ['华语', '流行', '精选']
    },
    {
      name: '欧美热门',
      creator: admin._id,
      description: '最热门的欧美流行歌曲',
      songs: [songs[2]._id, songs[3]._id],
      likes: 3800,
      tags: ['欧美', '流行', '热门']
    },
    {
      name: '我的收藏',
      creator: user._id,
      description: '我最喜欢的歌曲集合',
      songs: [songs[0]._id, songs[2]._id, songs[4]._id],
      likes: 10,
      isPublic: false,
      tags: ['收藏', '个人']
    }
  ]);
  
  console.log('歌单创建成功');
  
  // 设置用户喜欢的歌曲
  await User.findByIdAndUpdate(admin._id, {
    likedSongs: [songs[0]._id, songs[2]._id, songs[3]._id],
    recentPlayed: [
      { song: songs[2]._id, playedAt: new Date() },
      { song: songs[0]._id, playedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    ]
  });
  
  await User.findByIdAndUpdate(user._id, {
    likedSongs: [songs[0]._id, songs[4]._id],
    recentPlayed: [
      { song: songs[4]._id, playedAt: new Date() },
      { song: songs[1]._id, playedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    ]
  });
  
  console.log('用户喜欢的歌曲和播放历史设置成功');
  
  console.log('示例数据创建完成！');
};

// 执行数据填充
const seedDB = async () => {
  try {
    await clearCollections();
    await createSampleData();
    console.log('数据库填充成功');
    process.exit(0);
  } catch (error) {
    console.error('数据库填充失败:', error);
    process.exit(1);
  }
};

seedDB();