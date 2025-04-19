const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Playlist = require('../models/Playlist');
const User = require('../models/User');

// 执行搜索
exports.search = async (req, res) => {
  try {
    const { query, type = 'song', genre, language, year, duration, bpm } = req.query;
    
    // 如果没有查询关键词且类型是歌曲，显示搜索页面
    if (!query && type === 'song') {
      return res.render('search', {
        title: '搜索',
        results: null,
        query: '',
        type,
        filters: { genre, language, year, duration, bpm }
      });
    }
    
    let songs = [], artists = [], albums = [], playlists = [], users = [];
    const searchOptions = {};
    
    // 基础搜索条件
    if (query) {
      searchOptions.basic = { $regex: query, $options: 'i' };
    }
    
    // 高级搜索筛选
    if (genre) {
      searchOptions.genre = genre;
    }
    
    if (language) {
      searchOptions.language = language;
    }
    
    if (year) {
      searchOptions.year = parseInt(year);
    }
    
    if (duration) {
      const [min, max] = duration.split('-');
      searchOptions.duration = {
        $gte: parseInt(min),
        $lte: parseInt(max)
      };
    }
    
    if (bpm) {
      const [min, max] = bpm.split('-');
      searchOptions.bpm = {
        $gte: parseInt(min),
        $lte: parseInt(max)
      };
    }
    
    // 根据查询类型执行相应搜索
    if (type === 'all' || type === 'song') {
      const searchConditions = [];
      
      // 添加标题搜索条件
      if (query) {
        searchConditions.push({ title: searchOptions.basic });
      }
      
      // 添加其他筛选条件
      if (genre) {
        searchConditions.push({ genre: searchOptions.genre });
      }
      
      if (language) {
        searchConditions.push({ language: searchOptions.language });
      }
      
      if (year) {
        searchConditions.push({ releaseYear: searchOptions.year });
      }
      
      if (duration) {
        searchConditions.push({ 
          duration: { 
            $gte: searchOptions.duration.$gte, 
            $lte: searchOptions.duration.$lte 
          } 
        });
      }
      
      if (bpm) {
        searchConditions.push({ 
          bpm: { 
            $gte: searchOptions.bpm.$gte, 
            $lte: searchOptions.bpm.$lte 
          } 
        });
      }
      
      // 构建最终查询条件
      const finalCondition = searchConditions.length > 0 
        ? { $and: searchConditions } 
        : {};
      
      // 执行查询
      songs = await Song.find(finalCondition)
        .populate('artist')
        .populate('album')
        .limit(20);
      
      // 调试日志
      console.log(`搜索类型: ${type}, 搜索关键词: ${query}, 歌曲结果数量: ${songs.length}`);
      
      // 如果只有一个结果且类型是歌曲，直接跳转到详情页
      if (type === 'song' && songs.length === 1) {
        console.log(`跳转到歌曲详情页: /song/${songs[0]._id}`);
        return res.redirect(`/song/${songs[0]._id}`);
      }
    }
    
    if (type === 'all' || type === 'artist') {
      artists = await Artist.find({
        $and: [
          query ? { 
            $or: [
              { name: searchOptions.basic },
              { genres: searchOptions.basic },
              { bio: searchOptions.basic }
            ]
          } : {},
          genre ? { genres: searchOptions.genre } : {}
        ]
      }).populate('albums').limit(10);
      
      // 如果只有一个结果且类型是歌手，直接跳转到详情页
      if (type === 'artist' && artists.length === 1) {
        return res.redirect(`/artist/${artists[0]._id}`);
      }
    }
    
    if (type === 'all' || type === 'album') {
      albums = await Album.find({
        $and: [
          query ? { 
            $or: [
              { title: searchOptions.basic },
              { genre: searchOptions.basic }
            ]
          } : {},
          genre ? { genre: searchOptions.genre } : {},
          year ? { releaseDate: { $gte: new Date(searchOptions.year, 0, 1), $lte: new Date(searchOptions.year, 11, 31) } } : {}
        ]
      }).populate('artist').limit(10);
      
      // 如果只有一个结果且类型是专辑，直接跳转到详情页
      if (type === 'album' && albums.length === 1) {
        return res.redirect(`/album/${albums[0]._id}`);
      }
    }
    
    if (type === 'all' || type === 'playlist') {
      playlists = await Playlist.find({
        $and: [
          query ? { 
            $or: [
              { name: searchOptions.basic },
              { description: searchOptions.basic },
              { tags: searchOptions.basic }
            ]
          } : {},
          { isPublic: true }
        ]
      }).populate('creator').limit(10);
      
      // 如果只有一个结果且类型是歌单，直接跳转到详情页
      if (type === 'playlist' && playlists.length === 1) {
        return res.redirect(`/playlist/${playlists[0]._id}`);
      }
    }
    
    // 保存搜索历史
    if (req.session.user && query) {
      await User.findByIdAndUpdate(req.session.user.id, {
        $push: {
          'searchHistory': {
            query,
            time: new Date()
          }
        }
      });
    }
    
    res.render('search', {
      title: query ? `搜索"${query}"的结果` : '搜索',
      results: { songs, artists, albums, playlists, users },
      query,
      type,
      filters: { genre, language, year, duration, bpm }
    });
  } catch (error) {
    console.error('搜索执行失败:', error);
    res.status(500).render('error', {
      title: '服务器错误',
      message: '搜索失败'
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
        artist: song.artist.name,
        text: `${song.title} - ${song.artist.name}`
      })),
      artists: artists.map(artist => ({
        type: 'artist',
        name: artist.name,
        text: artist.name
      })),
      albums: albums.map(album => ({
        type: 'album',
        title: album.title,
        artist: album.artist.name,
        text: `${album.title} - ${album.artist.name}`
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