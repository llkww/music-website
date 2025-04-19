const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Playlist = require('../models/Playlist');
const User = require('../models/User');

// 执行搜索
exports.search = async (req, res) => {
  try {
    const { query } = req.query;
    
    // 如果没有查询关键词，显示搜索页面
    if (!query) {
      return res.render('search', {
        title: '搜索',
        results: null,
        query: ''
      });
    }
    
    // 执行综合搜索
    let songs = [], artists = [], albums = [], playlists = [];
    
    // 查找匹配的歌曲
    songs = await Song.find({
      title: { $regex: query, $options: 'i' }
    })
      .populate('artist')
      .populate('album')
      .limit(20);
    
    // 查找匹配的艺术家
    artists = await Artist.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { genres: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('albums')
      .limit(10);
    
    // 查找匹配的专辑
    albums = await Album.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { genre: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('artist')
      .limit(10);
    
    // 查找匹配的歌单
    playlists = await Playlist.find({
      isPublic: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('creator')
      .limit(10);
    
    // 如果没有找到任何结果，显示"未找到"页面
    if (songs.length === 0 && artists.length === 0 && albums.length === 0 && playlists.length === 0) {
      return res.render('search-not-found', {
        title: `搜索"${query}" - 未找到结果`,
        query
      });
    }
    
    // 保存搜索历史
    if (req.session.user) {
      try {
        await User.findByIdAndUpdate(req.session.user.id, {
          $push: {
            'searchHistory': {
              query,
              time: new Date()
            }
          }
        });
      } catch (historyError) {
        console.error('保存搜索历史失败:', historyError);
        // 不阻止主流程继续
      }
    }
    
    // 渲染搜索结果页面
    return res.render('search', {
      title: `搜索"${query}"的结果`,
      results: { songs, artists, albums, playlists },
      query
    });
  } catch (error) {
    console.error('搜索执行失败:', error);
    return res.status(500).render('error', {
      title: '服务器错误',
      message: '搜索失败，请稍后再试'
    });
  }
};

// 获取搜索建议
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    // 查找匹配的歌曲
    const songs = await Song.find({
      title: { $regex: query, $options: 'i' }
    }).limit(3).select('title artist').populate('artist', 'name');
    
    // 查找匹配的艺术家
    const artists = await Artist.find({
      name: { $regex: query, $options: 'i' }
    }).limit(3).select('name');
    
    // 查找匹配的专辑
    const albums = await Album.find({
      title: { $regex: query, $options: 'i' }
    }).limit(3).select('title artist').populate('artist', 'name');
    
    // 获取热门搜索
    const hotSearches = [
      '周杰伦', '热门歌单', '夏日清凉', '经典老歌', '新歌榜'
    ].filter(term => term.includes(query)).slice(0, 3);
    
    // 构建搜索建议
    const suggestions = {
      songs: songs.map(song => ({
        type: 'song',
        title: song.title,
        artist: song.artist ? song.artist.name : '未知艺术家',
        text: `${song.title} - ${song.artist ? song.artist.name : '未知艺术家'}`
      })),
      artists: artists.map(artist => ({
        type: 'artist',
        name: artist.name,
        text: artist.name
      })),
      albums: albums.map(album => ({
        type: 'album',
        title: album.title,
        artist: album.artist ? album.artist.name : '未知艺术家',
        text: `${album.title} - ${album.artist ? album.artist.name : '未知艺术家'}`
      })),
      hot: hotSearches.map(term => ({
        type: 'hot',
        text: term
      }))
    };
    
    res.json({ suggestions });
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    res.status(500).json({ message: '获取搜索建议失败' });
  }
};

// 获取高级搜索选项
exports.getSearchFilters = async (req, res) => {
  try {
    // 获取所有流派
    const genres = await Song.distinct('genre');
    
    // 获取所有语言
    const languages = await Song.distinct('language');
    
    // 获取发行年份范围（最早和最晚）
    const oldestSong = await Song.findOne().sort({ releaseYear: 1 });
    const newestSong = await Song.findOne().sort({ releaseYear: -1 });
    
    const years = [];
    if (oldestSong && newestSong) {
      const startYear = oldestSong.releaseYear;
      const endYear = newestSong.releaseYear;
      
      for (let year = startYear; year <= endYear; year++) {
        years.push(year);
      }
    }
    
    // 歌曲时长范围
    const durations = [
      { label: '0-2分钟', value: '0-120' },
      { label: '2-4分钟', value: '120-240' },
      { label: '4-6分钟', value: '240-360' },
      { label: '6分钟以上', value: '360-999' }
    ];
    
    // BPM范围
    const bpmRanges = [
      { label: '慢速 (0-80)', value: '0-80' },
      { label: '中速 (80-120)', value: '80-120' },
      { label: '快速 (120-160)', value: '120-160' },
      { label: '超快 (160+)', value: '160-300' }
    ];
    
    res.json({
      success: true,
      filters: {
        genres,
        languages,
        years,
        durations,
        bpmRanges
      }
    });
  } catch (error) {
    console.error('获取筛选选项失败:', error);
    res.status(500).json({ message: '获取筛选选项失败' });
  }
};