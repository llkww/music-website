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
const iconv = require('iconv-lite');

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
// 1. 创建用户
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
  
  // 创建50个普通用户
  const users = [admin];
  const chineseNames = [
    '张伟', '王芳', '李娜', '刘洋', '陈明', '赵静', '杨帆', '周红', '吴强', '朱丽',
    '郑方', '马超', '孙艳', '胡军', '郭敏', '何涛', '高峰', '林萍', '徐杰', '梁鑫',
    '康乐', '唐磊', '许丽', '韩雪', '冯刚', '董娟', '萧亮', '曹颖', '彭勇', '蒋怡',
    '谢辉', '潘婷', '姚明', '宋波', '熊莉', '孟强', '秦雪', '江涛', '尹红', '魏鹏',
    '程静', '邓丽', '白强', '崔艳', '田野', '石磊', '侯娟', '黎明', '江小白'
  ];
  
  for(let i = 1; i <= 49; i++) {
    const isVIP = i % 5 === 0; // 每5个用户中有1个是VIP
    const gender = i % 2 === 0 ? 'male' : 'female';
    const userName = chineseNames[i-1] || `user${i}`;
    
    const user = await User.create({
      username: userName,
      email: `user${i}@example.com`,
      password: userPassword,
      isVIP: isVIP,
      vipExpiry: isVIP ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) : null,
      bio: `喜欢${['流行音乐', '摇滚音乐', '古典音乐', '爵士音乐', '电子音乐'][i % 5]}的${gender === 'male' ? '小伙子' : '姑娘'}`,
      gender: gender,
      // 随机生成生日，18-40岁
      birthday: new Date(Date.now() - (18 + Math.floor(Math.random() * 22)) * 365 * 24 * 60 * 60 * 1000)
    });
    users.push(user);
  }
  
  console.log('用户创建成功');
  
  // 2. 创建艺术家
  const artistsData = [
    {
      name: '陈奕迅',
      bio: '华语乐坛现象级歌手，以独特唱腔和情感表达著称，擅长将生活感悟融入音乐。',
      image: '/img/artists/陈奕迅.jpg',
      genres: ['流行', '摇滚', '粤语'],
      followers: 10000000,
      detailedIntro: '陈奕迅（Eason Chan），1974年7月27日出生于中国香港，祖籍广东东莞。1995年以新秀歌唱大赛冠军身份出道，凭借《十年》《浮夸》《富士山下》等代表作奠定华语乐坛地位。其音乐风格多元，涵盖流行、摇滚、电子等，曾获台湾金曲奖最佳国语男歌手（2003、2009、2015、2018）、香港叱咤乐坛男歌手金奖（2006-2014）等多项荣誉。2021年单曲《孤勇者》全球破圈，成为现象级作品。'
    },
    {
      name: '周杰伦',
      bio: '华语流行乐教父级人物，开创"中国风"潮流，影响一代听众。',
      image: '/img/artists/周杰伦.jpg',
      genres: ['流行', '嘻哈', '中国风'],
      followers: 12000000,
      detailedIntro: '周杰伦（Jay Chou），1979年1月18日出生于中国台湾。2000年以首张专辑《Jay》出道，代表作《双截棍》《青花瓷》《七里香》等融合中西方音乐元素，开创华语乐坛新纪元。其音乐风格独特，擅长将古典乐器与现代节奏结合，曾获台湾金曲奖最佳专辑（2002、2008）、最佳作曲人（2002、2007）等多项大奖，2003年入选美国《时代》周刊"全球百位最具影响力人物"。'
    },
    {
      name: '陶喆',
      bio: '华语R&B教父，将美式灵魂乐与东方美学完美融合。',
      image: '/img/artists/陶喆.jpg',
      genres: ['R&B', '摇滚', '放克'],
      followers: 8000000,
      detailedIntro: '陶喆（David Tao），1969年7月11日出生于中国香港。1997年以首张专辑《David Tao》出道，代表作《普通朋友》《Melody》《黑色柳丁》等奠定其在华语R&B领域的地位。其音乐风格融合R&B、摇滚、放克等元素，曾获台湾金曲奖最佳国语男歌手（2003）、最佳专辑制作人（2003）等多项荣誉，2002年专辑《黑色柳丁》被《Time》评为"亚洲年度十大唱片"。'
    },
    {
      name: '王力宏',
      bio: '全能音乐人，跨界音乐、影视、公益，倡导多元文化融合。',
      image: '/img/artists/王力宏.jpg',
      genres: ['流行', '摇滚', '电子'],
      followers: 7500000,
      detailedIntro: '王力宏（Leehom Wang），1976年5月17日出生于美国纽约。1995年以首张专辑《情敌贝多芬》出道，代表作《唯一》《龙的传人》《盖世英雄》等融合中西方音乐元素。其音乐风格多元，擅长将古典乐器与现代节奏结合，曾获台湾金曲奖最佳唱片制作人（2000）、最佳国语男演唱人（2000）等多项荣誉，2008年担任北京奥运会火炬手。'
    },
    {
      name: '林俊杰',
      bio: '新加坡国宝级歌手，以超高音域和创作才华闻名。',
      image: '/img/artists/林俊杰.jpg',
      genres: ['流行', '电子', '摇滚'],
      followers: 9000000,
      detailedIntro: '林俊杰（JJ Lin），1981年3月27日出生于新加坡。2003年以首张专辑《乐行者》出道，代表作《江南》《曹操》《不为谁而作的歌》等以细腻旋律和情感表达著称。其音乐风格融合流行、电子、摇滚等元素，曾获台湾金曲奖最佳国语男歌手（2014、2018）、最佳专辑制作人（2015）等多项荣誉，2016年入选《福布斯》亚洲"30岁以下俊杰"。'
    },
    {
      name: '孙燕姿',
      bio: '华语乐坛"天后"，以清新嗓音和独立气质影响一代人。',
      image: '/img/artists/孙燕姿.jpg',
      genres: ['流行', '民谣', '电子'],
      followers: 8500000,
      detailedIntro: '孙燕姿（Stefanie Sun），1978年7月23日出生于新加坡。2000年以首张专辑《孙燕姿》出道，代表作《天黑黑》《遇见》《逆光》等以清新嗓音和独立气质著称。其音乐风格融合流行、民谣、电子等元素，曾获台湾金曲奖最佳女演唱人（2005）、最佳专辑制作人（2011）等多项荣誉，2014年专辑《克卜勒》全球销量破百万。'
    },
    {
      name: '方大同',
      bio: '跨界音乐人，融合Soul、R&B与中国风，被誉为"香港陶喆"。',
      image: '/img/artists/方大同.jpg',
      genres: ['Soul', 'R&B', '中国风'],
      followers: 6500000,
      detailedIntro: '方大同（Khalil Fong），1983年7月14日出生于美国夏威夷。2005年以首张专辑《Soul Boy》出道，代表作《爱爱爱》《三人游》《特别的人》等融合Soul、R&B与中国风元素。其音乐风格独特，擅长将传统乐器与现代节奏结合，曾获台湾金曲奖最佳国语男歌手（2017）、最佳单曲制作人（2021）等多项荣誉，2016年成立个人音乐品牌"赋音乐"。'
    },
    {
      name: '卢广仲',
      bio: '台湾独立音乐人，以清新民谣和校园风格深受年轻听众喜爱。',
      image: '/img/artists/卢广仲.jpg',
      genres: ['民谣', '摇滚', '电子'],
      followers: 5000000,
      detailedIntro: '卢广仲（Crowd Lu），1985年7月15日出生于中国台湾。2007年以首张专辑《100种生活》出道，代表作《我爱你》《早安晨之美》《鱼仔》等以清新民谣和校园风格著称。其音乐风格融合民谣、摇滚、电子等元素，曾获台湾金曲奖最佳新人（2008）、最佳作曲人（2018）等多项荣誉，2017年主演电视剧《花甲男孩转大人》并演唱主题曲。'
    }
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
      detailedIntro: artistData.detailedIntro
    });
    artists.push(artist);
  }
  
  console.log('艺术家创建成功');
  
  // 3. 创建专辑
  const albumsData = [
    {
      title: 'U87',
      artistName: '陈奕迅',
      coverImage: '/img/albums/U87.jpg',
      releaseDate: new Date('2005-06-07'),
      genre: '流行',
      description: '陈奕迅加盟新艺宝唱片后的首张专辑，以"U87"命名象征录音室编号，收录《浮夸》《葡萄成熟时》《夕阳无限好》等经典作品。专辑融合摇滚、民谣、电子等元素，探讨人生哲理与情感纠葛，获2005年度香港唱片销量大奖十大最高销量广东唱片奖，被《Time》评为"亚洲年度十大唱片"。'
    },
    {
      title: '范特西',
      artistName: '周杰伦',
      coverImage: '/img/albums/范特西.jpg',
      releaseDate: new Date('2001-09-14'),
      genre: '流行',
      description: '周杰伦第二张专辑，以"幻想"为主题融合R&B、Hip Hop、摇滚等元素，收录《双截棍》《简单爱》《开不了口》等经典作品。专辑获第13届台湾金曲奖最佳流行音乐专辑奖、最佳专辑制作人奖，奠定周杰伦在华语乐坛的地位，全球销量突破170万张。'
    },
    {
      title: '七里香',
      artistName: '周杰伦',
      coverImage: '/img/albums/七里香.jpg',
      releaseDate: new Date('2004-08-03'),
      genre: '流行',
      description: '周杰伦第五张专辑，以同名主打歌《七里香》命名，融合流行、摇滚、中国风等元素，收录《我的地盘》《借口》《止战之殇》等作品。专辑获第27届香港十大中文金曲奖、第5届全球华语歌曲排行榜年度25大金曲奖，全球销量突破300万张。'
    },
    {
      title: '黑色柳丁',
      artistName: '陶喆',
      coverImage: '/img/albums/黑色柳丁.jpg',
      releaseDate: new Date('2002-08-09'),
      genre: 'R&B',
      description: '陶喆第三张专辑，以911事件为背景探讨爱与希望，收录《普通朋友》《Melody》《月亮代表谁的心》等经典作品。专辑融合R&B、摇滚、放克等元素，获第14届台湾金曲奖最佳国语男演唱人奖、第3届音乐风云榜港台最佳专辑奖，被《Time》评为"亚洲年度十大唱片"。'
    },
    {
      title: '米·闪',
      artistName: '陈奕迅',
      coverImage: '/img/albums/米·闪.jpg',
      releaseDate: new Date('2013-06-21'),
      genre: '流行',
      description: '陈奕迅2013年发行的国语专辑，收录《稳稳的幸福》等作品。'
    },
    {
      title: '黑白灰',
      artistName: '陈奕迅',
      coverImage: '/img/albums/黑白灰.jpg',
      releaseDate: new Date('2003-11-11'),
      genre: '流行',
      description: '陈奕迅2003年发行的国语专辑，收录《十年》等经典作品。'
    },
    {
      title: '认了吧',
      artistName: '陈奕迅',
      coverImage: '/img/albums/认了吧.jpg',
      releaseDate: new Date('2007-06-28'),
      genre: '流行',
      description: '陈奕迅2007年发行的国语专辑，收录《淘汰》《爱情转移》《红玫瑰》《好久不见》等经典作品。'
    },
    {
      title: "What's Going On...?",
      artistName: '陈奕迅',
      coverImage: '/img/albums/Whats_Going_On.jpg',
      releaseDate: new Date('2006-06-30'),
      genre: '流行',
      description: '陈奕迅2006年发行的粤语专辑，收录《富士山下》《不如不见》等经典作品。'
    },
    {
      title: 'Life Continues',
      artistName: '陈奕迅',
      coverImage: '/img/albums/Life_Continues.jpg',
      releaseDate: new Date('2006-12-29'),
      genre: '流行',
      description: '陈奕迅2006年发行的粤语专辑，收录《最佳损友》等作品。'
    },
    {
      title: 'Special Thanks To...',
      artistName: '陈奕迅',
      coverImage: '/img/albums/Special_Thanks_To.jpg',
      releaseDate: new Date('2002-01-01'),
      genre: '流行',
      description: '陈奕迅2002年发行的国语专辑，收录《你的背包》等作品。'
    },
    {
      title: 'Shall We Dance? Shall We Talk!',
      artistName: '陈奕迅',
      coverImage: '/img/albums/Shall_We_Dance_Shall_We_Talk.jpg',
      releaseDate: new Date('2001-07-17'),
      genre: '流行',
      description: '陈奕迅2001年发行的粤语专辑，收录《单车》等作品。'
    },
    {
      title: '叶惠美',
      artistName: '周杰伦',
      coverImage: '/img/albums/叶惠美.jpg',
      releaseDate: new Date('2003-07-31'),
      genre: '流行',
      description: '周杰伦2003年发行的专辑，收录《晴天》《以父之名》等经典作品。'
    },
    {
      title: '十一月的萧邦',
      artistName: '周杰伦',
      coverImage: '/img/albums/十一月的萧邦.jpg',
      releaseDate: new Date('2005-11-01'),
      genre: '流行',
      description: '周杰伦2005年发行的专辑，收录《夜曲》等经典作品。'
    },
    {
      title: '依然范特西',
      artistName: '周杰伦',
      coverImage: '/img/albums/依然范特西.jpg',
      releaseDate: new Date('2006-09-05'),
      genre: '流行',
      description: '周杰伦2006年发行的专辑，收录《退后》等作品。'
    },
    {
      title: '我很忙',
      artistName: '周杰伦',
      coverImage: '/img/albums/我很忙.jpg',
      releaseDate: new Date('2007-11-02'),
      genre: '流行',
      description: '周杰伦2007年发行的专辑，收录《青花瓷》等经典作品。'
    },
    {
      title: '太平盛世',
      artistName: '陶喆',
      coverImage: '/img/albums/太平盛世.jpg',
      releaseDate: new Date('2005-07-07'),
      genre: 'R&B',
      description: '陶喆2005年发行的专辑，收录《Susan说》《爱我还是他》《就是爱你》等作品。'
    },
    {
      title: "I'm OK",
      artistName: '陶喆',
      coverImage: '/img/albums/Im_OK.jpg',
      releaseDate: new Date('1999-10-01'),
      genre: 'R&B',
      description: '陶喆1999年发行的专辑，收录《普通朋友》《小镇姑娘》等作品。'
    },
    {
      title: '陶喆',
      artistName: '陶喆',
      coverImage: '/img/albums/david_tao.jpg',
      releaseDate: new Date('1997-09-05'),
      genre: 'R&B',
      description: '陶喆1997年发行的首张专辑，收录《飞机场的10:30》等作品。'
    },
    {
      title: '唯一',
      artistName: '王力宏',
      coverImage: '/img/albums/唯一.jpg',
      releaseDate: new Date('2001-06-11'),
      genre: 'R&B',
      description: '王力宏2001年发行的专辑，收录《唯一》等经典作品。'
    },
    {
      title: '第二天堂',
      artistName: '林俊杰',
      coverImage: '/img/albums/第二天堂.jpg',
      releaseDate: new Date('2004-06-04'),
      genre: '流行',
      description: '林俊杰2004年发行的专辑，收录《江南》等经典作品。'
    },
    {
      title: 'The Moment',
      artistName: '孙燕姿',
      coverImage: '/img/albums/The_Moment.jpg',
      releaseDate: new Date('2003-10-07'),
      genre: '流行',
      description: '孙燕姿2003年发行的专辑，收录《遇见》等经典作品。'
    },
    {
      title: '危险世界',
      artistName: '方大同',
      coverImage: '/img/albums/危险世界.jpg',
      releaseDate: new Date('2014-03-14'),
      genre: 'R&B',
      description: '方大同2014年发行的专辑，收录《特别的人》等作品。'
    },
    {
      title: '几分之几',
      artistName: '卢广仲',
      coverImage: '/img/albums/几分之几.jpg',
      releaseDate: new Date('2018-08-01'),
      genre: '民谣',
      description: '卢广仲2018年发行的专辑，收录《几分之几》等作品。'
    }
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
      description: albumData.description
    });
    albums.push(album);
  }
  
  console.log('专辑创建成功');
  
  // 4. 创建歌曲
  // 先创建有MV的歌曲
  const songsWithMVData = [
    {
      title: '稳稳的幸福',
      artistName: '陈奕迅',
      albumTitle: '米·闪',
      duration: 223,
      releaseYear: 2013,
      genre: '情歌',
      subGenre: '',
      language: '华语',
      mood: '温暖',
      scene: '安静',
      coverImage: '/img/songs/稳稳的幸福.jpg',
      audioFile: '/audio/陈奕迅/稳稳的幸福.mp3',
      lyricsFile: '/lyrics/稳稳的幸福.lrc',
      mvFile: '/video/陈奕迅/稳稳的幸福.mp4',
      playCount: 123456789,
      likes: 987654321,
      bpm: 76,
      isHot: true,
      isNew: false,
      tags: ['励志', '温暖', '治愈']
    },
    {
      title: '葡萄成熟时',
      artistName: '陈奕迅',
      albumTitle: 'U87',
      duration: 258,
      releaseYear: 2005,
      genre: '流行',
      subGenre: '',
      language: '粤语',
      mood: '励志',
      scene: '安静',
      coverImage: '/img/albums/U87.jpg',
      audioFile: '/audio/陈奕迅/葡萄成熟时.mp3',
      lyricsFile: '/lyrics/葡萄成熟时.lrc',
      mvFile: '/video/陈奕迅/葡萄成熟时.mp4',
      playCount: 987654321,
      likes: 9999999999,
      bpm: 80,
      isHot: true,
      isNew: false,
      tags: ['励志', '成长', '粤语']
    },
    {
      title: '退后',
      artistName: '周杰伦',
      albumTitle: '依然范特西',
      duration: 236,
      releaseYear: 2006,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/依然范特西.jpg',
      audioFile: '/audio/周杰伦/退后.mp3',
      lyricsFile: '/lyrics/退后.lrc',
      mvFile: '/video/周杰伦/退后.mp4',
      playCount: 88888888,
      likes: 77777777,
      bpm: 75,
      isHot: true,
      isNew: true,
      tags: ['悲伤', '失恋', '华语']
    },
    {
      title: '富士山下',
      artistName: '陈奕迅',
      albumTitle: "What's Going On...?",
      duration: 252,
      releaseYear: 2006,
      genre: '流行',
      subGenre: '',
      language: '粤语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/Whats_Going_On.jpg',
      audioFile: '/audio/陈奕迅/富士山下.mp3',
      lyricsFile: '/lyrics/富士山下.lrc',
      mvFile: '/video/陈奕迅/富士山下.mp4',
      playCount: 66666666,
      likes: 55555555,
      bpm: 70,
      isHot: true,
      isNew: false,
      tags: ['悲伤', '失恋', '粤语']
    },
    {
      title: '普通朋友',
      artistName: '陶喆',
      albumTitle: "I'm OK",
      duration: 255,
      releaseYear: 1999,
      genre: 'R&B',
      subGenre: '',
      language: '华语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/Im_OK.jpg',
      audioFile: '/audio/陶喆/普通朋友.mp3',
      lyricsFile: '/lyrics/普通朋友.lrc',
      mvFile: '/video/陶喆/普通朋友.mp4',
      playCount: 44444444,
      likes: 33333333,
      bpm: 85,
      isHot: true,
      isNew: true,
      tags: ['悲伤', '失恋', 'R&B']
    }
  ];

  // 无MV的歌曲
  const songsWithoutMVData = [
    {
      title: '十年',
      artistName: '陈奕迅',
      albumTitle: '黑白灰',
      duration: 280,
      releaseYear: 2003,
      genre: '怀旧',
      subGenre: '',
      language: '华语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/黑白灰.jpg',
      audioFile: '/audio/陈奕迅/十年.mp3',
      lyricsFile: '/lyrics/十年.lrc',
      playCount: 100000000,
      likes: 50000000,
      bpm: 75,
      isHot: true,
      isNew: false,
      tags: ['悲伤', '怀旧', '华语']
    },
    {
      title: '浮夸',
      artistName: '陈奕迅',
      albumTitle: 'U87',
      duration: 240,
      releaseYear: 2005,
      genre: '摇滚',
      subGenre: '',
      language: '粤语',
      mood: '励志',
      scene: '动感',
      coverImage: '/img/albums/U87.jpg',
      audioFile: '/audio/陈奕迅/浮夸.mp3',
      lyricsFile: '/lyrics/浮夸.lrc',
      playCount: 80000000,
      likes: 40000000,
      bpm: 90,
      isHot: true,
      isNew: false,
      tags: ['励志', '摇滚', '粤语']
    },
    {
      title: 'K歌之王',
      artistName: '陈奕迅',
      albumTitle: '打得火热',
      duration: 250,
      releaseYear: 2000,
      genre: '流行',
      subGenre: '',
      language: '粤语',
      mood: '励志',
      scene: '动感',
      coverImage: '/img/songs/打得火热.jpg',
      audioFile: '/audio/陈奕迅/K歌之王.mp3',
      lyricsFile: '/lyrics/K歌之王.lrc',
      playCount: 70000000,
      likes: 35000000,
      bpm: 95,
      isHot: true,
      isNew: false,
      tags: ['励志', 'KTV', '粤语']
    },
    {
      title: '淘汰',
      artistName: '陈奕迅',
      albumTitle: '认了吧',
      duration: 235,
      releaseYear: 2007,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/认了吧.jpg',
      audioFile: '/audio/陈奕迅/淘汰.mp3',
      lyricsFile: '/lyrics/淘汰.lrc',
      playCount: 90000000,
      likes: 45000000,
      bpm: 72,
      isHot: true,
      isNew: false,
      tags: ['悲伤', '失恋', '华语']
    },
    {
      title: '爱情转移',
      artistName: '陈奕迅',
      albumTitle: '认了吧',
      duration: 252,
      releaseYear: 2007,
      genre: '情歌',
      subGenre: '',
      language: '华语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/认了吧.jpg',
      audioFile: '/audio/陈奕迅/爱情转移.mp3',
      lyricsFile: '/lyrics/爱情转移.lrc',
      playCount: 120000000,
      likes: 60000000,
      bpm: 78,
      isHot: true,
      isNew: false,
      tags: ['悲伤', '成长', '华语']
    },
    {
      title: '红玫瑰',
      artistName: '陈奕迅',
      albumTitle: '认了吧',
      duration: 245,
      releaseYear: 2007,
      genre: '情歌',
      subGenre: '',
      language: '华语',
      mood: '浪漫',
      scene: '都市',
      coverImage: '/img/albums/认了吧.jpg',
      audioFile: '/audio/陈奕迅/红玫瑰.mp3',
      lyricsFile: '/lyrics/红玫瑰.lrc',
      playCount: 110000000,
      likes: 55000000,
      bpm: 85,
      isHot: true,
      isNew: true,
      tags: ['浪漫', '都市', '华语']
    },
    {
      title: '好久不见',
      artistName: '陈奕迅',
      albumTitle: '认了吧',
      duration: 230,
      releaseYear: 2007,
      genre: '怀旧',
      subGenre: '',
      language: '华语',
      mood: '怀旧',
      scene: '安静',
      coverImage: '/img/albums/认了吧.jpg',
      audioFile: '/audio/陈奕迅/好久不见.mp3',
      lyricsFile: '/lyrics/好久不见.lrc',
      playCount: 95000000,
      likes: 47500000,
      bpm: 76,
      isHot: true,
      isNew: false,
      tags: ['怀旧', '重逢', '华语']
    },
    {
      title: '不如不见',
      artistName: '陈奕迅',
      albumTitle: "What's Going On...?",
      duration: 248,
      releaseYear: 2006,
      genre: '流行',
      subGenre: '',
      language: '粤语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/Whats_Going_On.jpg',
      audioFile: '/audio/陈奕迅/不如不见.mp3',
      lyricsFile: '/lyrics/不如不见.lrc',
      playCount: 85000000,
      likes: 42500000,
      bpm: 70,
      isHot: true,
      isNew: true,
      tags: ['悲伤', '遗憾', '粤语']
    },
    {
      title: '最佳损友',
      artistName: '陈奕迅',
      albumTitle: 'Life Continues',
      duration: 237,
      releaseYear: 2006,
      genre: '怀旧',
      subGenre: '',
      language: '粤语',
      mood: '友情',
      scene: '动感',
      coverImage: '/img/albums/Life_Continues.jpg',
      audioFile: '/audio/陈奕迅/最佳损友.mp3',
      lyricsFile: '/lyrics/最佳损友.lrc',
      playCount: 88000000,
      likes: 44000000,
      bpm: 90,
      isHot: true,
      isNew: true,
      tags: ['友情', '成长', '粤语']
    },
    {
      title: '阴天快乐',
      artistName: '陈奕迅',
      albumTitle: '米·闪',
      duration: 242,
      releaseYear: 2014,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '治愈',
      scene: '安静',
      coverImage: '/img/albums/米·闪.jpg',
      audioFile: '/audio/陈奕迅/阴天快乐.mp3',
      lyricsFile: '/lyrics/阴天快乐.lrc',
      playCount: 75000000,
      likes: 37500000,
      bpm: 74,
      isHot: true,
      isNew: false,
      tags: ['治愈', '温暖', '华语']
    },
    {
      title: '你的背包',
      artistName: '陈奕迅',
      albumTitle: 'Special Thanks To...',
      duration: 234,
      releaseYear: 2002,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '怀旧',
      scene: '安静',
      coverImage: '/img/albums/Special_Thanks_To.jpg',
      audioFile: '/audio/陈奕迅/你的背包.mp3',
      lyricsFile: '/lyrics/你的背包.lrc',
      playCount: 72000000,
      likes: 36000000,
      bpm: 75,
      isHot: true,
      isNew: false,
      tags: ['怀旧', '成长', '华语']
    },
    {
      title: '单车',
      artistName: '陈奕迅',
      albumTitle: 'Shall We Dance? Shall We Talk!',
      duration: 228,
      releaseYear: 2001,
      genre: '怀旧',
      subGenre: '',
      language: '粤语',
      mood: '亲情',
      scene: '安静',
      coverImage: '/img/albums/Shall_We_Dance_Shall_We_Talk.jpg',
      audioFile: '/audio/陈奕迅/单车.mp3',
      lyricsFile: '/lyrics/单车.lrc',
      playCount: 70000000,
      likes: 35000000,
      bpm: 75,
      isHot: true,
      isNew: false,
      tags: ['亲情', '成长', '粤语']
    },
    {
      title: '七里香',
      artistName: '周杰伦',
      albumTitle: '七里香',
      duration: 230,
      releaseYear: 2004,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '浪漫',
      scene: '安静',
      coverImage: '/img/albums/七里香.jpg',
      audioFile: '/audio/周杰伦/七里香.mp3',
      lyricsFile: '/lyrics/七里香.lrc',
      playCount: 150000000,
      likes: 75000000,
      bpm: 76,
      isHot: true,
      isNew: false,
      tags: ['浪漫', '夏日', '华语']
    },
    {
      title: '双截棍',
      artistName: '周杰伦',
      albumTitle: '范特西',
      duration: 215,
      releaseYear: 2001,
      genre: '摇滚',
      subGenre: '',
      language: '华语',
      mood: '励志',
      scene: '动感',
      coverImage: '/img/albums/范特西.jpg',
      audioFile: '/audio/周杰伦/双截棍.mp3',
      lyricsFile: '/lyrics/双截棍.lrc',
      playCount: 140000000,
      likes: 70000000,
      bpm: 100,
      isHot: true,
      isNew: false,
      tags: ['励志', '动感', '华语']
    },
    {
      title: '青花瓷',
      artistName: '周杰伦',
      albumTitle: '我很忙',
      duration: 265,
      releaseYear: 2007,
      genre: '中国风',
      subGenre: '',
      language: '华语',
      mood: '浪漫',
      scene: '安静',
      coverImage: '/img/albums/我很忙.jpg',
      audioFile: '/audio/周杰伦/青花瓷.mp3',
      lyricsFile: '/lyrics/青花瓷.lrc',
      playCount: 160000000,
      likes: 80000000,
      bpm: 72,
      isHot: true,
      isNew: false,
      tags: ['中国风', '古典', '浪漫']
    },
    {
      title: '晴天',
      artistName: '周杰伦',
      albumTitle: '叶惠美',
      duration: 240,
      releaseYear: 2003,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '青春',
      scene: '安静',
      coverImage: '/img/albums/叶惠美.jpg',
      audioFile: '/audio/周杰伦/晴天.mp3',
      lyricsFile: '/lyrics/晴天.lrc',
      playCount: 170000000,
      likes: 85000000,
      bpm: 76,
      isHot: true,
      isNew: false,
      tags: ['青春', '怀旧', '华语']
    },
    {
      title: '以父之名',
      artistName: '周杰伦',
      albumTitle: '叶惠美',
      duration: 290,
      releaseYear: 2003,
      genre: '摇滚',
      subGenre: '',
      language: '华语',
      mood: '叙事',
      scene: '安静',
      coverImage: '/img/albums/叶惠美.jpg',
      audioFile: '/audio/周杰伦/以父之名.mp3',
      lyricsFile: '/lyrics/以父之名.lrc',
      playCount: 130000000,
      likes: 65000000,
      bpm: 85,
      isHot: true,
      isNew: false,
      tags: ['叙事', '嘻哈', '华语']
    },
    {
      title: '夜曲',
      artistName: '周杰伦',
      albumTitle: '十一月的萧邦',
      duration: 250,
      releaseYear: 2005,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/十一月的萧邦.jpg',
      audioFile: '/audio/周杰伦/夜曲.mp3',
      lyricsFile: '/lyrics/夜曲.lrc',
      playCount: 120000000,
      likes: 60000000,
      bpm: 70,
      isHot: true,
      isNew: false,
      tags: ['悲伤', '浪漫', '华语']
    },
    {
      title: 'Melody',
      artistName: '陶喆',
      albumTitle: '黑色柳丁',
      duration: 270,
      releaseYear: 2002,
      genre: 'R&B',
      subGenre: '',
      language: '华语',
      mood: '悲伤',
      scene: '安静',
      coverImage: '/img/albums/黑色柳丁.jpg',
      audioFile: '/audio/陶喆/Melody.mp3',
      lyricsFile: '/lyrics/Melody.lrc',
      playCount: 60000000,
      likes: 30000000,
      bpm: 75,
      isHot: true,
      isNew: false,
      tags: ['悲伤', 'R&B', '华语']
    },
    {
      title: '黑色柳丁',
      artistName: '陶喆',
      albumTitle: '黑色柳丁',
      duration: 245,
      releaseYear: 2002,
      genre: '摇滚',
      subGenre: '',
      language: '华语',
      mood: '社会',
      scene: '动感',
      coverImage: '/img/albums/黑色柳丁.jpg',
      audioFile: '/audio/陶喆/黑色柳丁.mp3',
      lyricsFile: '/lyrics/黑色柳丁.lrc',
      playCount: 55000000,
      likes: 27500000,
      bpm: 95,
      isHot: true,
      isNew: false,
      tags: ['摇滚', '社会', '华语']
    },
    {
      title: 'Susan说',
      artistName: '陶喆',
      albumTitle: '太平盛世',
      duration: 260,
      releaseYear: 2005,
      genre: 'R&B',
      subGenre: '',
      language: '华语',
      mood: '叙事',
      scene: '安静',
      coverImage: '/img/albums/太平盛世.jpg',
      audioFile: '/audio/陶喆/Susan说.mp3',
      lyricsFile: '/lyrics/Susan说.lrc',
      playCount: 50000000,
      likes: 25000000,
      bpm: 80,
      isHot: true,
      isNew: false,
      tags: ['叙事', 'R&B', '华语']
    },
    {
      title: '爱我还是他',
      artistName: '陶喆',
      albumTitle: '太平盛世',
      duration: 240,
      releaseYear: 2005,
      genre: 'R&B',
      subGenre: '',
      language: '华语',
      mood: '情感',
      scene: '安静',
      coverImage: '/img/albums/太平盛世.jpg',
      audioFile: '/audio/陶喆/爱我还是他.mp3',
      lyricsFile: '/lyrics/爱我还是他.lrc',
      playCount: 58000000,
      likes: 29000000,
      bpm: 82,
      isHot: true,
      isNew: true,
      tags: ['情感', 'R&B', '华语']
    },
    {
      title: '就是爱你',
      artistName: '陶喆',
      albumTitle: '太平盛世',
      duration: 245,
      releaseYear: 2005,
      genre: '情歌',
      subGenre: '',
      language: '华语',
      mood: '浪漫',
      scene: '安静',
      coverImage: '/img/albums/太平盛世.jpg',
      audioFile: '/audio/陶喆/就是爱你.mp3',
      lyricsFile: '/lyrics/就是爱你.lrc',
      playCount: 65000000,
      likes: 32500000,
      bpm: 85,
      isHot: true,
      isNew: false,
      tags: ['浪漫', '告白', '华语']
    },
    {
      title: '小镇姑娘',
      artistName: '陶喆',
      albumTitle: "I'm OK",
      duration: 250,
      releaseYear: 1999,
      genre: '情歌',
      subGenre: '',
      language: '华语',
      mood: '叙事',
      scene: '动感',
      coverImage: '/img/albums/Im_OK.jpg',
      audioFile: '/audio/陶喆/小镇姑娘.mp3',
      lyricsFile: '/lyrics/小镇姑娘.lrc',
      playCount: 48000000,
      likes: 24000000,
      bpm: 90,
      isHot: true,
      isNew: false,
      tags: ['叙事', '摇滚', '华语']
    },
    {
      title: '飞机场的10：30',
      artistName: '陶喆',
      albumTitle: '陶喆',
      duration: 280,
      releaseYear: 1997,
      genre: 'R&B',
      subGenre: '',
      language: '华语',
      mood: '情感',
      scene: '安静',
      coverImage: '/img/albums/david_tao.jpg',
      audioFile: '/audio/陶喆/:飞机场的1030.mp3',
      lyricsFile: '/lyrics/:飞机场的1030.lrc',
      playCount: 45000000,
      likes: 22500000,
      bpm: 78,
      isHot: true,
      isNew: false,
      tags: ['情感', 'R&B', '华语']
    },
    {
      title: '唯一',
      artistName: '王力宏',
      albumTitle: '唯一',
      duration: 255,
      releaseYear: 2001,
      genre: '情歌',
      subGenre: '',
      language: '华语',
      mood: '浪漫',
      scene: '安静',
      coverImage: '/img/albums/唯一.jpg',
      audioFile: '/audio/王力宏/唯一.mp3',
      lyricsFile: '/lyrics/唯一.lrc',
      playCount: 40000000,
      likes: 20000000,
      bpm: 80,
      isHot: true,
      isNew: false,
      tags: ['浪漫', 'R&B', '华语']
    },
    {
      title: '江南',
      artistName: '林俊杰',
      albumTitle: '第二天堂',
      duration: 240,
      releaseYear: 2004,
      genre: '流行',
      subGenre: '',
      language: '华语',
      mood: '浪漫',
      scene: '安静',
      coverImage: '/img/albums/第二天堂.jpg',
      audioFile: '/audio/林俊杰/江南.mp3',
      lyricsFile: '/lyrics/江南.lrc',
      playCount: 50000000,
      likes: 25000000,
      bpm: 75,
      isHot: true,
      isNew: false,
      tags: ['中国风', '浪漫', '华语']
    },
    {
      title: '遇见',
      artistName: '孙燕姿',
      albumTitle: 'The Moment',
      duration: 230,
      releaseYear: 2003,
      genre: '怀旧',
      subGenre: '',
      language: '华语',
      mood: '清新',
      scene: '安静',
      coverImage: '/img/albums/The_Moment.jpg',
      audioFile: '/audio/孙燕姿/遇见.mp3',
      lyricsFile: '/lyrics/遇见.lrc',
      playCount: 42000000,
      likes: 21000000,
      bpm: 76,
      isHot: true,
      isNew: false,
      tags: ['清新', '治愈', '华语']
    },
    {
      title: '特别的人',
      artistName: '方大同',
      albumTitle: '危险世界',
      duration: 259,
      releaseYear: 2014,
      genre: 'R&B',
      subGenre: '',
      language: '华语',
      mood: '浪漫',
      scene: '安静',
      coverImage: '/img/albums/危险世界.jpg',
      audioFile: '/audio/方大同/特别的人.mp3',
      lyricsFile: '/lyrics/特别的人.lrc',
      playCount: 38000000,
      likes: 19000000,
      bpm: 80,
      isHot: true,
      isNew: true,
      tags: ['浪漫', 'R&B', '华语']
    },
    {
      title: '几分之几',
      artistName: '卢广仲',
      albumTitle: '几分之几',
      duration: 228,
      releaseYear: 2018,
      genre: 'R&B',
      subGenre: '流行',
      language: '华语',
      mood: '情感',
      scene: '安静',
      coverImage: '/img/albums/几分之几.jpg',
      audioFile: '/audio/卢广仲/几分之几.mp3',
      lyricsFile: '/lyrics/几分之几.lrc',
      playCount: 35000000,
      likes: 17500000,
      bpm: 74,
      isHot: true,
      isNew: true,
      tags: ['情感', '成长', '民谣']
    }
  ];

  // 合并有MV和无MV的歌曲数据
  const songsData = [...songsWithMVData, ...songsWithoutMVData];
  
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
          // 不使用utf8直接读取，改用二进制读取然后转换
          const buffer = fs.readFileSync(lyricsFilePath);
          // 尝试用GBK解码
          lyrics = iconv.decode(buffer, 'gbk');
        }
      } catch(err) {
        console.warn(`歌词文件不存在或无法读取: ${lyricsFilePath}, 错误: ${err.message}`);
      }
    }
    
    const song = await Song.create({
      title: songData.title,
      artist: artist._id,
      album: album ? album._id : null,
      duration: songData.duration,
      releaseYear: songData.releaseYear,
      genre: songData.genre,
      subGenre: songData.subGenre || '',
      language: songData.language,
      mood: songData.mood || '',
      scene: songData.scene || '',
      coverImage: songData.coverImage,
      audioFile: songData.audioFile,
      audioFileHQ: songData.audioFileHQ || songData.audioFile,
      lyrics: lyrics,
      mvUrl: songData.mvFile || null,
      playCount: songData.playCount,
      likes: songData.likes,
      bpm: songData.bpm || 75,
      isVIP: songData.isVIP || false,
      isHot: songData.isHot || false,
      isNew: songData.isNew || false,
      tags: songData.tags || []
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
  const playlistsData = [
    {
      name: '华语经典情歌',
      creatorUsername: '张伟',
      description: '收录周杰伦、孙燕姿、王力宏等歌手的经典情歌，带你重温华语乐坛黄金时代。',
      songTitles: ['十年', '晴天', '唯一', '特别的人', '遇见'],
      isPublic: true,
      isOfficial: false,
      isHot: true,
      playCount: 1000000,
      likes: 500000,
      tags: ['浪漫', '怀旧', '华语'],
      category: '心情',
      coverImage: '/img/playlists/classic_love_songs.jpg'
    },
    {
      name: '通勤必备轻松音乐',
      creatorUsername: '王芳',
      description: '精选舒缓轻松音乐，助你在通勤路上放松身心。',
      songTitles: ['你的背包', '夜曲', '江南', '几分之几', '稳稳的幸福'],
      isPublic: true,
      isOfficial: false,
      isHot: true,
      playCount: 800000,
      likes: 400000,
      tags: ['舒缓', '放松', '通勤'],
      category: '场景',
      coverImage: '/img/playlists/commute_light_music.jpg'
    },
    {
      name: '派对热歌精选',
      creatorUsername: '李娜',
      description: '收录周杰伦、林俊杰、陶喆等歌手的动感热歌，点燃派对气氛。',
      songTitles: ['双截棍', '浮夸', 'K歌之王', '黑色柳丁', '小镇姑娘'],
      isPublic: true,
      isOfficial: false,
      isHot: true,
      playCount: 600000,
      likes: 300000,
      tags: ['动感', '节奏', '派对'],
      category: '场景',
      coverImage: '/img/playlists/party_hits.jpg'
    }
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
      isHot: playlistData.isHot,
      playCount: playlistData.playCount,
      likes: playlistData.likes,
      tags: playlistData.tags,
      category: playlistData.category,
      coverImage: playlistData.coverImage,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    playlists.push(playlist);
  }
  
  console.log('歌单创建成功');
  
  // 8. 设置用户喜欢的歌曲和播放历史
  // 为用户添加喜欢的歌曲和最近播放
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