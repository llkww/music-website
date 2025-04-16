const mongoose = require('mongoose');
const User = require('../models/User');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Song = require('../models/Song');
const Playlist = require('../models/Playlist');
const bcrypt = require('bcryptjs');
const { mongoURI } = require('../config/db');
const fs = require('fs');
const path = require('path');

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
  // 1. 创建用户 (你准备了100个用户，这里先创建几个主要用户)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);
  
  const admin = await User.create({
    username: 'admin',
    email: 'admin@example.com',
    password: adminPassword,
    isVIP: true,
    vipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    bio: '音乐网站管理员',
    gender: 'male'
  });
  
  // 创建5个普通用户
  const users = [admin];
  for(let i = 1; i <= 5; i++) {
    const user = await User.create({
      username: `user${i}`,
      email: `user${i}@example.com`,
      password: userPassword,
      isVIP: i % 3 === 0, // 每3个用户中有1个是VIP
      vipExpiry: i % 3 === 0 ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) : null,
      bio: `我是用户${i}，喜欢听音乐`,
      gender: i % 2 === 0 ? 'male' : 'female'
    });
    users.push(user);
  }
  
  console.log('用户创建成功');
  
  // 2. 创建艺术家
  // 这里会使用您准备的真实艺术家数据
  // 示例结构（实际使用您提供的数据）:
  const artistsData = [
    {
      name: '周杰伦',
      bio: '华语流行乐坛知名歌手、音乐人、词曲创作人',
      image: '/img/artists/jay.jpg',
      genres: ['流行', '华语'],
      followers: 10000000,
      detailedIntro: '周杰伦（Jay Chou），1979年1月18日出生于台湾省新北市...'
    },
    // ... 其他艺术家数据
  ];
  
  // 创建艺术家记录
  const artists = [];
  for(const artistData of artistsData) {
    const artist = await Artist.create({
      name: artistData.name,
      bio: artistData.bio,
      image: artistData.image,
      genres: artistData.genres,
      followers: artistData.followers,
      // 存储详细介绍
      detailedIntro: artistData.detailedIntro || artistData.bio
    });
    artists.push(artist);
  }
  
  console.log('艺术家创建成功');
  
  // 3. 创建专辑
  // 这里会使用您准备的真实专辑数据
  // 示例结构（实际使用您提供的数据）:
  const albumsData = [
    {
      title: '范特西',
      artistName: '周杰伦', // 用于查找关联的艺术家ID
      coverImage: '/img/albums/fantasy.jpg',
      releaseDate: new Date('2001-09-14'),
      genre: '流行',
      description: '《范特西》是周杰伦发行的第二张专辑，融合中西方音乐元素...'
    },
    // ... 其他专辑数据
  ];
  
  // 创建专辑记录
  const albums = [];
  for(const albumData of albumsData) {
    // 查找对应的艺术家
    const artist = artists.find(a => a.name === albumData.artistName);
    if(!artist) continue;
    
    const album = await Album.create({
      title: albumData.title,
      artist: artist._id,
      coverImage: albumData.coverImage,
      releaseDate: albumData.releaseDate,
      genre: albumData.genre,
      description: albumData.description || '' // 添加专辑描述
    });
    albums.push(album);
  }
  
  console.log('专辑创建成功');
  
  // 4. 创建歌曲
  // 这里会使用您准备的真实歌曲数据
  // 示例结构（实际使用您提供的数据）:
  const songsData = [
    {
      title: '爱在西元前',
      artistName: '周杰伦', // 用于查找关联的艺术家ID
      albumTitle: '范特西', // 用于查找关联的专辑ID
      duration: 216,
      releaseYear: 2001,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '怀旧',
      scene: '安静',
      coverImage: '/img/albums/fantasy.jpg',
      audioFile: '/audio/jay/love_before.mp3',
      lyricsFile: '/lyrics/爱在西元前.lrc', // 仅为有歌词的歌曲添加
      mvFile: '/video/jay/love_before.mp4', // 仅为有MV的歌曲添加
      playCount: 1500000,
      likes: 980000,
      bpm: 76,
      isVIP: false,
      isHot: true,
      isNew: false,
      tags: ['经典', '怀旧', '青春']
    },
    // ... 其他歌曲数据
  ];
  
  // 创建歌曲记录
  const songs = [];
  for(const songData of songsData) {
    // 查找对应的艺术家
    const artist = artists.find(a => a.name === songData.artistName);
    if(!artist) continue;
    
    // 查找对应的专辑
    const album = albums.find(a => a.title === songData.albumTitle);
    
    // 检查歌词文件是否存在
    let lyrics = '';
    if(songData.lyricsFile) {
      const lyricsFilePath = path.join(__dirname, '..', 'public', songData.lyricsFile.replace(/^\//, ''));
      try {
        if(fs.existsSync(lyricsFilePath)) {
          lyrics = fs.readFileSync(lyricsFilePath, 'utf8');
        }
      } catch(err) {
        console.warn(`歌词文件不存在: ${lyricsFilePath}`);
      }
    }
    
    const song = await Song.create({
      title: songData.title,
      artist: artist._id,
      album: album ? album._id : null,
      duration: songData.duration,
      releaseYear: songData.releaseYear,
      genre: songData.genre,
      subGenre: songData.subGenre,
      language: songData.language,
      mood: songData.mood,
      scene: songData.scene,
      coverImage: songData.coverImage,
      audioFile: songData.audioFile,
      audioFileHQ: songData.audioFileHQ || songData.audioFile, // 可选的高质量音频
      lyrics: lyrics,
      mvUrl: songData.mvFile, // 添加MV路径
      playCount: songData.playCount,
      likes: songData.likes,
      bpm: songData.bpm,
      isVIP: songData.isVIP,
      isHot: songData.isHot,
      isNew: songData.isNew,
      tags: songData.tags
    });
    songs.push(song);
  }
  
  console.log('歌曲创建成功');
  
  // 5. 更新专辑中的歌曲
  for(const album of albums) {
    const albumSongs = songs.filter(s => s.album && s.album.toString() === album._id.toString())
                           .map(s => s._id);
    
    await Album.findByIdAndUpdate(album._id, {
      songs: albumSongs
    });
  }
  
  console.log('专辑歌曲关联成功');
  
  // 6. 更新艺术家中的热门歌曲和专辑
  for(const artist of artists) {
    // 获取这个艺术家的所有歌曲并按播放量排序
    const artistSongs = songs.filter(s => s.artist.toString() === artist._id.toString())
                            .sort((a, b) => b.playCount - a.playCount);
    
    // 获取前5首作为热门歌曲
    const popularSongs = artistSongs.slice(0, 5).map(s => s._id);
    
    // 获取艺术家的所有专辑
    const artistAlbums = albums.filter(a => a.artist.toString() === artist._id.toString())
                              .map(a => a._id);
    
    await Artist.findByIdAndUpdate(artist._id, {
      popularSongs: popularSongs,
      albums: artistAlbums
    });
  }
  
  console.log('艺术家热门歌曲和专辑关联成功');
  
  // 7. 创建歌单
  // 这里会使用您准备的真实歌单数据
  // 示例结构（实际使用您提供的数据）:
  const playlistsData = [
    {
      name: '流行华语精选',
      creatorUsername: 'admin', // 用于查找关联的用户ID
      description: '精选华语流行歌曲，陪伴你的每一天',
      songTitles: ['爱在西元前', '简单爱', '十年'], // 用于查找关联的歌曲ID
      isPublic: true,
      isOfficial: true,
      likes: 5000,
      tags: ['华语', '流行', '精选'],
      category: '华语',
      coverImage: '/img/playlists/chinese_pop.jpg'
    },
    // ... 其他歌单数据
  ];
  
  // 创建歌单记录
  const playlists = [];
  for(const playlistData of playlistsData) {
    // 查找创建者
    const creator = users.find(u => u.username === playlistData.creatorUsername);
    if(!creator) continue;
    
    // 查找歌曲
    const playlistSongs = [];
    for(const songTitle of playlistData.songTitles) {
      const song = songs.find(s => s.title === songTitle);
      if(song) playlistSongs.push(song._id);
    }
    
    const playlist = await Playlist.create({
      name: playlistData.name,
      creator: creator._id,
      description: playlistData.description,
      songs: playlistSongs,
      isPublic: playlistData.isPublic,
      isOfficial: playlistData.isOfficial,
      isHot: playlistData.likes > 1000, // 根据点赞数设置是否热门
      playCount: playlistData.likes * 2, // 模拟播放次数
      likes: playlistData.likes,
      tags: playlistData.tags,
      category: playlistData.category,
      coverImage: playlistData.coverImage || '/img/default-playlist.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    playlists.push(playlist);
  }
  
  console.log('歌单创建成功');
  
  // 8. 设置用户喜欢的歌曲和播放历史
  // 为主要用户添加喜欢的歌曲和最近播放
  for(let i = 0; i < users.length; i++) {
    // 随机选择5-15首歌喜欢
    const likedSongsCount = 5 + Math.floor(Math.random() * 11);
    const shuffledSongs = [...songs].sort(() => 0.5 - Math.random());
    const likedSongs = shuffledSongs.slice(0, likedSongsCount).map(s => s._id);
    
    // 随机选择10-20首歌作为播放历史
    const recentPlayedCount = 10 + Math.floor(Math.random() * 11);
    const recentPlayedSongs = [...songs].sort(() => 0.5 - Math.random()).slice(0, recentPlayedCount);
    
    const recentPlayed = recentPlayedSongs.map(song => {
      // 随机生成最近30天内的播放时间
      const daysAgo = Math.floor(Math.random() * 30);
      const playedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      return {
        song: song._id,
        playedAt
      };
    }).sort((a, b) => b.playedAt - a.playedAt); // 按时间倒序排列
    
    // 随机喜欢1-3个歌单
    const likedPlaylistsCount = 1 + Math.floor(Math.random() * 3);
    const shuffledPlaylists = [...playlists].sort(() => 0.5 - Math.random());
    const likedPlaylists = shuffledPlaylists.slice(0, likedPlaylistsCount).map(p => p._id);
    
    await User.findByIdAndUpdate(users[i]._id, {
      likedSongs,
      recentPlayed,
      likedPlaylists
    });
  }
  
  console.log('用户喜欢的歌曲和播放历史设置成功');
  
  // 9. 添加评论和互动
  // 为热门歌曲添加评论
  for(const song of songs.filter(s => s.isHot)) {
    // 添加3-7条评论
    const commentCount = 3 + Math.floor(Math.random() * 5);
    const comments = [];
    
    for(let i = 0; i < commentCount; i++) {
      const commentUser = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 60); // 最近2个月内的评论
      const commentDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const likes = Math.floor(Math.random() * 200);
      const isHot = likes > 100;
      
      const commentTexts = [
        "这首歌真好听，百听不厌！",
        "每次听都有不同的感受，经典！",
        "这首歌陪伴我度过很多时光",
        "旋律太抓耳了，循环播放中",
        "这首歌的歌词写得太好了",
        "这是我今年听过最好的歌之一",
        "每当心情低落，就会听这首歌",
        "推荐给所有喜欢这种风格的朋友",
        "歌手的声音太有辨识度了",
        "这首歌的编曲太棒了"
      ];
      
      const comment = {
        user: commentUser._id,
        text: commentTexts[Math.floor(Math.random() * commentTexts.length)],
        createdAt: commentDate,
        likes,
        isHot,
        replies: []
      };
      
      // 有30%的机会添加回复
      if(Math.random() < 0.3) {
        const replyCount = 1 + Math.floor(Math.random() * 3); // 1-3条回复
        
        for(let j = 0; j < replyCount; j++) {
          const replyUser = users[Math.floor(Math.random() * users.length)];
          const replyDaysAgo = Math.floor(Math.random() * daysAgo); // 比评论更近的日期
          const replyDate = new Date(Date.now() - replyDaysAgo * 24 * 60 * 60 * 1000);
          const replyLikes = Math.floor(Math.random() * 50);
          
          const replyTexts = [
            "完全同意你的观点！",
            "是的，这首歌确实很棒",
            "我也是这首歌的忠实粉丝",
            "感谢推荐，我也很喜欢",
            "这首歌的歌词写得太走心了",
            "我也循环播放了很多次"
          ];
          
          comment.replies.push({
            user: replyUser._id,
            text: replyTexts[Math.floor(Math.random() * replyTexts.length)],
            createdAt: replyDate,
            likes: replyLikes
          });
        }
      }
      
      comments.push(comment);
    }
    
    await Song.findByIdAndUpdate(song._id, { comments });
  }
  
  // 为歌单添加评论
  for(const playlist of playlists) {
    // 添加2-5条评论
    const commentCount = 2 + Math.floor(Math.random() * 4);
    const comments = [];
    
    for(let i = 0; i < commentCount; i++) {
      const commentUser = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const commentDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const likes = Math.floor(Math.random() * 50);
      
      const commentTexts = [
        "歌单整理得很用心，谢谢分享！",
        "这个歌单的歌曲选择太棒了",
        "收藏了，每首歌都很符合我的口味",
        "听完整个歌单，心情都变好了",
        "推荐大家都来听这个歌单",
        "这个歌单太适合工作时听了"
      ];
      
      comments.push({
        user: commentUser._id,
        text: commentTexts[Math.floor(Math.random() * commentTexts.length)],
        createdAt: commentDate,
        likes
      });
    }
    
    await Playlist.findByIdAndUpdate(playlist._id, { comments });
  }
  
  console.log('评论和互动添加成功');
  
  // 10. 建立关注关系
  // 用户之间相互关注
  for(const user of users) {
    // 随机关注1-4个其他用户
    const followCount = 1 + Math.floor(Math.random() * 4);
    const otherUsers = users.filter(u => u._id.toString() !== user._id.toString());
    const shuffledUsers = [...otherUsers].sort(() => 0.5 - Math.random());
    const followingUsers = shuffledUsers.slice(0, followCount).map(u => u._id);
    
    // 随机关注1-3个艺术家
    const followArtistCount = 1 + Math.floor(Math.random() * 3);
    const shuffledArtists = [...artists].sort(() => 0.5 - Math.random());
    const followingArtists = shuffledArtists.slice(0, followArtistCount).map(a => a._id);
    
    await User.findByIdAndUpdate(user._id, {
      following: followingUsers,
      followingArtists
    });
    
    // 更新被关注用户的粉丝列表
    for(const followingId of followingUsers) {
      await User.findByIdAndUpdate(followingId, {
        $push: { followers: user._id }
      });
    }
    
    // 更新被关注艺术家的粉丝数
    for(const artistId of followingArtists) {
      await Artist.findByIdAndUpdate(artistId, {
        $inc: { followers: 1 }
      });
    }
  }
  
  console.log('关注关系建立成功');
  
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