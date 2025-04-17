document.addEventListener('DOMContentLoaded', function() {
  // 音频元素
  const audioElement = new Audio();
  
  // 播放器元素
  const playButton = document.getElementById('btn-play');
  const prevButton = document.getElementById('btn-prev');
  const nextButton = document.getElementById('btn-next');
  const shuffleButton = document.getElementById('btn-shuffle');
  const repeatButton = document.getElementById('btn-repeat');
  const volumeButton = document.getElementById('btn-volume');
  const progressBar = document.getElementById('progress-bar');
  const volumeBar = document.getElementById('volume-bar');
  const currentTimeDisplay = document.getElementById('current-time');
  const totalTimeDisplay = document.getElementById('total-time');
  const playingTitle = document.getElementById('playing-title');
  const playingArtist = document.getElementById('playing-artist');
  const playingCover = document.getElementById('playing-cover');
  
  // 歌词和播放列表面板
  const lyricsButton = document.getElementById('btn-lyrics');
  const playlistButton = document.getElementById('btn-playlist');
  const lyricsPanel = document.getElementById('lyrics-panel');
  const playlistPanel = document.getElementById('playlist-panel');
  const closeLyrics = document.getElementById('close-lyrics');
  const closePlaylist = document.getElementById('close-playlist');
  
  // 新的主歌词区域
  const mainLyricsContainer = document.getElementById('main-lyrics-container');
  const mainLyricsContent = document.getElementById('main-lyrics-content');
  
  // 歌词设置按钮
  const fontSizeButtons = document.querySelectorAll('.lyrics-font-size');
  const lyricsActiveColorButtons = document.querySelectorAll('.lyrics-active-color');
  const lyricsBgOpacity = document.getElementById('lyrics-bg-opacity');
  
  // 添加收藏按钮
  const favoriteButton = document.getElementById('btn-favorite');
  
  // 播放器状态
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = 'none'; // none, one, all
  let currentVolume = 1;
  let currentPlaylist = [];
  let currentIndex = 0;
  let lyricsVisible = true; // 歌词默认显示
  let audioContext = null;
  let sourceNode = null;
  let gainNode = null;
  let analyserNode = null;
  
  // 初始化播放器
  function initPlayer() {
    // 设置音量
    audioElement.volume = currentVolume;
    
    // 音频事件监听
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', handleSongEnd);
    audioElement.addEventListener('loadedmetadata', updateTotalTime);
    
    // 播放按钮点击事件
    playButton.addEventListener('click', togglePlay);
    
    // 上一首/下一首按钮
    prevButton.addEventListener('click', playPrevious);
    nextButton.addEventListener('click', playNext);
    
    // 随机播放按钮
    shuffleButton.addEventListener('click', toggleShuffle);
    
    // 循环模式按钮
    repeatButton.addEventListener('click', toggleRepeat);
    
    // 音量按钮
    volumeButton.addEventListener('click', toggleMute);
    
    // 收藏按钮
    if (favoriteButton) {
      favoriteButton.addEventListener('click', toggleFavorite);
    }
    
    // 进度条和音量条点击
    document.querySelector('.progress').addEventListener('click', setProgress);
    document.querySelector('.volume-progress').addEventListener('click', setVolume);
    
    // 歌词和播放列表面板
    lyricsButton.addEventListener('click', toggleLyricsVisibility);
    playlistButton.addEventListener('click', togglePlaylistPanel);
    closeLyrics.addEventListener('click', toggleLyricsPanel);
    closePlaylist.addEventListener('click', togglePlaylistPanel);
    
    // 歌词设置事件监听
    fontSizeButtons.forEach(button => {
      button.addEventListener('click', function() {
        setLyricsFontSize(this.dataset.size);
      });
    });
    
    lyricsActiveColorButtons.forEach(button => {
      button.addEventListener('click', function() {
        setLyricsActiveColor(this.dataset.color);
      });
    });
    
    if (lyricsBgOpacity) {
      lyricsBgOpacity.addEventListener('input', function() {
        setLyricsBgOpacity(this.value);
      });
    }
    
    // 初始化 Web Audio API
    initAudioContext();
    
    // 获取播放列表中的歌曲
    document.querySelectorAll('.btn-play').forEach(button => {
      button.addEventListener('click', function() {
        const songId = this.dataset.id;
        const songTitle = this.dataset.title;
        const songArtist = this.dataset.artist;
        const songCover = this.dataset.cover;
        const songAudio = this.dataset.audio;
        
        playSong({
          id: songId,
          title: songTitle,
          artist: songArtist,
          cover: songCover,
          audio: songAudio
        });
      });
    });
    
    // 尝试从本地存储加载播放列表和设置
    loadPlaylistFromStorage();
    loadSettingsFromStorage();
    
    // 加载歌词设置
    loadLyricsSettings();
  }
  
  // 加载歌词设置
  function loadLyricsSettings() {
    const savedSettings = localStorage.getItem('lyricsSettings');
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      // 应用字体大小
      if (settings.fontSize) {
        setLyricsFontSize(settings.fontSize, false);
      }
      
      // 应用高亮颜色
      if (settings.activeColor) {
        setLyricsActiveColor(settings.activeColor, false);
      }
      
      // 应用背景透明度
      if (settings.bgOpacity) {
        setLyricsBgOpacity(settings.bgOpacity, false);
      }
      
      // 应用歌词可见性
      if (settings.visible !== undefined) {
        lyricsVisible = settings.visible;
        if (!lyricsVisible) {
          mainLyricsContainer.classList.add('hidden');
          lyricsButton.innerHTML = '<i class="bi bi-chat-quote"></i>';
        } else {
          mainLyricsContainer.classList.remove('hidden');
          lyricsButton.innerHTML = '<i class="bi bi-chat-quote-fill"></i>';
        }
      }
    }
  }
  
  // 保存歌词设置
  function saveLyricsSettings(settings) {
    const savedSettings = localStorage.getItem('lyricsSettings');
    let lyricsSettings = savedSettings ? JSON.parse(savedSettings) : {};
    
    // 合并新设置
    lyricsSettings = { ...lyricsSettings, ...settings };
    
    localStorage.setItem('lyricsSettings', JSON.stringify(lyricsSettings));
  }
  
  // 设置歌词字体大小
  function setLyricsFontSize(size, save = true) {
    // 移除所有字体大小类
    mainLyricsContainer.classList.remove('lyrics-font-small', 'lyrics-font-medium', 'lyrics-font-large');
    
    // 添加新的字体大小类
    mainLyricsContainer.classList.add(`lyrics-font-${size}`);
    
    // 更新按钮状态
    fontSizeButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.size === size);
    });
    
    // 保存设置
    if (save) {
      saveLyricsSettings({ fontSize: size });
    }
  }
  
  // 设置当前歌词高亮颜色
  function setLyricsActiveColor(color, save = true) {
    // 更新按钮状态
    lyricsActiveColorButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.color === color);
    });
    
    // 移除所有颜色类
    const activeLines = document.querySelectorAll('.main-lyrics-line.active');
    activeLines.forEach(line => {
      line.classList.remove('text-primary', 'text-danger', 'text-warning', 'text-info');
      line.classList.add(`text-${color}`);
    });
    
    // 保存设置
    if (save) {
      saveLyricsSettings({ activeColor: color });
    }
  }
  
  // 设置歌词背景透明度
  function setLyricsBgOpacity(opacity, save = true) {
    // 设置背景透明度
    const opacityValue = opacity / 100;
    mainLyricsContainer.style.backgroundColor = `rgba(0, 0, 0, ${opacityValue})`;
    
    // 保存设置
    if (save) {
      saveLyricsSettings({ bgOpacity: opacity });
    }
  }
  
  // 切换歌词可见性
  function toggleLyricsVisibility() {
    lyricsVisible = !lyricsVisible;
    
    if (lyricsVisible) {
      mainLyricsContainer.classList.remove('hidden');
      lyricsButton.innerHTML = '<i class="bi bi-chat-quote-fill"></i>';
    } else {
      mainLyricsContainer.classList.add('hidden');
      lyricsButton.innerHTML = '<i class="bi bi-chat-quote"></i>';
    }
    
    // 保存设置
    saveLyricsSettings({ visible: lyricsVisible });
  }
  
  // 切换歌词设置面板
  function toggleLyricsPanel() {
    const isVisible = lyricsPanel.style.display === 'flex';
    lyricsPanel.style.display = isVisible ? 'none' : 'flex';
    
    // 关闭其他面板
    if (!isVisible) {
      playlistPanel.style.display = 'none';
    }
  }
  
  // 初始化 Web Audio API
  function initAudioContext() {
    try {
      // 创建音频上下文
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 创建源节点
      sourceNode = audioContext.createMediaElementSource(audioElement);
      
      // 创建分析器节点
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      
      // 创建音量控制节点
      gainNode = audioContext.createGain();
      
      // 连接节点
      sourceNode.connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
      
    } catch (e) {
      console.error('Web Audio API 初始化失败:', e);
    }
  }
  
  // 播放/暂停切换
  function togglePlay() {
    if (currentPlaylist.length === 0) return;
    
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    if (isPlaying) {
      audioElement.pause();
      isPlaying = false;
      playButton.innerHTML = '<i class="bi bi-play-circle-fill"></i>';
    } else {
      audioElement.play();
      isPlaying = true;
      playButton.innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
    }
  }
  
  // 播放歌曲
  function playSong(song) {
    // 检查是否已在播放列表中
    const existingIndex = currentPlaylist.findIndex(item => item.id === song.id);
    
    if (existingIndex === -1) {
      // 添加到播放列表
      currentPlaylist.push(song);
      currentIndex = currentPlaylist.length - 1;
    } else {
      // 播放已存在的歌曲
      currentIndex = existingIndex;
    }
    
    // 更新播放列表显示
    updatePlaylistDisplay();
    
    // 保存播放列表到本地存储
    savePlaylistToStorage();
    
    // 设置音频源并播放
    audioElement.src = song.audio;
    audioElement.load();
    
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    audioElement.play()
      .then(() => {
        isPlaying = true;
        playButton.innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
      })
      .catch(error => {
        console.error('播放失败:', error);
        isPlaying = false;
        playButton.innerHTML = '<i class="bi bi-play-circle-fill"></i>';
      });
    
    // 更新播放器显示
    playingTitle.textContent = song.title;
    playingArtist.textContent = song.artist;
    playingCover.src = song.cover;
    
    // 更新收藏按钮状态
    updateFavoriteButton(song.id);
    
    // 加载歌词
    loadLyrics(song.id);
    
    // 记录播放记录
    recordPlayHistory(song.id);
  }
  
  // 播放上一首
  function playPrevious() {
    if (currentPlaylist.length === 0) return;
    
    // 如果当前播放进度超过3秒，则重新播放当前歌曲
    if (audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }
    
    currentIndex--;
    if (currentIndex < 0) {
      currentIndex = currentPlaylist.length - 1;
    }
    
    playSong(currentPlaylist[currentIndex]);
  }
  
  // 播放下一首
  function playNext() {
    if (currentPlaylist.length === 0) return;
    
    if (isShuffle) {
      // 随机播放
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * currentPlaylist.length);
      } while (randomIndex === currentIndex && currentPlaylist.length > 1);
      
      currentIndex = randomIndex;
    } else {
      // 顺序播放
      currentIndex++;
      if (currentIndex >= currentPlaylist.length) {
        currentIndex = 0;
      }
    }
    
    playSong(currentPlaylist[currentIndex]);
  }
  
  // 歌曲结束处理
  function handleSongEnd() {
    if (repeatMode === 'one') {
      // 单曲循环
      audioElement.currentTime = 0;
      audioElement.play();
    } else if (repeatMode === 'all' || currentIndex < currentPlaylist.length - 1 || isShuffle) {
      // 全部循环或播放下一首
      playNext();
    } else {
      // 播放结束，重置
      isPlaying = false;
      playButton.innerHTML = '<i class="bi bi-play-circle-fill"></i>';
    }
  }
  
  // 切换随机播放
  function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleButton.classList.toggle('text-primary');
    
    // 保存设置
    saveSettingsToStorage({ shuffle: isShuffle });
  }
  
  // 切换循环模式
  function toggleRepeat() {
    if (repeatMode === 'none') {
      repeatMode = 'all';
      repeatButton.innerHTML = '<i class="bi bi-arrow-repeat text-primary"></i>';
    } else if (repeatMode === 'all') {
      repeatMode = 'one';
      repeatButton.innerHTML = '<i class="bi bi-1-circle text-primary"></i>';
    } else {
      repeatMode = 'none';
      repeatButton.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
    }
    
    // 保存设置
    saveSettingsToStorage({ repeat: repeatMode });
  }
  
  // 切换静音
  function toggleMute() {
    if (audioElement.volume > 0) {
      audioElement.volume = 0;
      volumeBar.style.width = '0%';
      volumeButton.innerHTML = '<i class="bi bi-volume-mute"></i>';
    } else {
      audioElement.volume = currentVolume;
      volumeBar.style.width = currentVolume * 100 + '%';
      updateVolumeIcon();
    }
  }
  
  // 更新音量图标
  function updateVolumeIcon() {
    if (audioElement.volume > 0.5) {
      volumeButton.innerHTML = '<i class="bi bi-volume-up"></i>';
    } else if (audioElement.volume > 0) {
      volumeButton.innerHTML = '<i class="bi bi-volume-down"></i>';
    } else {
      volumeButton.innerHTML = '<i class="bi bi-volume-mute"></i>';
    }
  }
  
  // 设置进度
  function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioElement.duration;
    audioElement.currentTime = (clickX / width) * duration;
  }
  
  // 设置音量
  function setVolume(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    currentVolume = clickX / width;
    
    audioElement.volume = currentVolume;
    volumeBar.style.width = currentVolume * 100 + '%';
    updateVolumeIcon();
    
    // 保存设置
    saveSettingsToStorage({ volume: currentVolume });
  }
  
  // 更新进度条
  function updateProgress() {
    const duration = audioElement.duration;
    const currentTime = audioElement.currentTime;
    
    if (duration) {
      // 更新进度条
      const progressPercent = (currentTime / duration) * 100;
      progressBar.style.width = progressPercent + '%';
      
      // 更新时间显示
      currentTimeDisplay.textContent = formatTime(currentTime);
      
      // 更新当前歌词
      updateActiveLyric(currentTime);
    }
  }
  
  // 获取总时间
  function updateTotalTime() {
    totalTimeDisplay.textContent = formatTime(audioElement.duration);
  }
  
  // 格式化时间
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  // 切换收藏状态
  function toggleFavorite() {
    if (!currentPlaylist.length || currentIndex < 0) return;
    
    const songId = currentPlaylist[currentIndex].id;
    
    fetch(`/music/song/${songId}/like`, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        favoriteButton.classList.toggle('active', data.liked);
        favoriteButton.innerHTML = data.liked ? 
          '<i class="bi bi-heart-fill text-danger"></i>' : 
          '<i class="bi bi-heart"></i>';
      }
    })
    .catch(error => {
      console.error('切换收藏状态失败:', error);
    });
  }
  
  // 更新收藏按钮状态
  function updateFavoriteButton(songId) {
    if (!favoriteButton) return;
    
    fetch(`/api/song/${songId}/is-liked`)
      .then(response => response.json())
      .then(data => {
        favoriteButton.classList.toggle('active', data.isLiked);
        favoriteButton.innerHTML = data.isLiked ? 
          '<i class="bi bi-heart-fill text-danger"></i>' : 
          '<i class="bi bi-heart"></i>';
      })
      .catch(error => {
        console.error('获取收藏状态失败:', error);
      });
  }
  
  // 切换播放列表面板
  function togglePlaylistPanel() {
    const isVisible = playlistPanel.style.display === 'flex';
    playlistPanel.style.display = isVisible ? 'none' : 'flex';
    
    // 关闭其他面板
    if (!isVisible) {
      lyricsPanel.style.display = 'none';
    }
  }
  
  // 加载歌词
  function loadLyrics(songId) {
    fetch(`/api/lyrics/${songId}`)
      .then(response => response.json())
      .then(data => {
        if (data.lyrics) {
          // 解析LRC格式歌词
          const lines = parseLyrics(data.lyrics);
          displayLyrics(lines);
        } else {
          mainLyricsContent.innerHTML = '<p class="main-lyrics-line">暂无歌词</p>';
        }
      })
      .catch(error => {
        console.error('获取歌词失败:', error);
        mainLyricsContent.innerHTML = '<p class="main-lyrics-line">暂无歌词</p>';
      });
  }
  
  // 解析LRC格式歌词
  function parseLyrics(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const timeRegExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
        const timeMatches = line.match(timeRegExp);
        
        if (timeMatches) {
          const text = line.replace(timeRegExp, '').trim();
          
          if (text) {
            // 一行可能有多个时间标记
            timeMatches.forEach(timeMatch => {
              const timeRegExpSingle = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
              const match = timeMatch.match(timeRegExpSingle);
              
              if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3]);
                const time = minutes * 60 + seconds + milliseconds / 1000;
                
                result.push({ time, text });
              }
            });
          }
        }
      }
    }
    
    return result.sort((a, b) => a.time - b.time);
  }
  
  // 显示歌词
  function displayLyrics(lines) {
    if (lines.length === 0) {
      mainLyricsContent.innerHTML = '<p class="main-lyrics-line">暂无歌词</p>';
      return;
    }
    
    let html = '';
    for (let i = 0; i < lines.length; i++) {
      html += `<p class="main-lyrics-line" data-time="${lines[i].time}">${lines[i].text}</p>`;
    }
    
    mainLyricsContent.innerHTML = html;
    window.currentLyricLines = lines;
  }
  
  // 更新当前歌词
  function updateActiveLyric(currentTime) {
    if (!window.currentLyricLines || !window.currentLyricLines.length) return;
    
    const lines = window.currentLyricLines;
    const lyricsLines = mainLyricsContent.querySelectorAll('.main-lyrics-line');
    
    // 清除之前的激活状态
    lyricsLines.forEach(p => p.classList.remove('active', 'text-primary', 'text-danger', 'text-warning', 'text-info'));
    
    // 查找当前歌词行
    let activeIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (i === lines.length - 1 || (currentTime >= lines[i].time && currentTime < lines[i + 1].time)) {
        activeIndex = i;
        break;
      }
    }
    
    // 激活当前行
    if (activeIndex >= 0 && activeIndex < lyricsLines.length) {
      lyricsLines[activeIndex].classList.add('active');
      
      // 应用当前选中的高亮颜色
      const activeColorButton = document.querySelector('.lyrics-active-color.active');
      if (activeColorButton) {
        const color = activeColorButton.dataset.color;
        lyricsLines[activeIndex].classList.add(`text-${color}`);
      } else {
        lyricsLines[activeIndex].classList.add('text-primary');
      }
      
      // 滚动到当前歌词
      const activeTop = lyricsLines[activeIndex].offsetTop;
      const containerHeight = mainLyricsContainer.clientHeight;
      mainLyricsContainer.scrollTop = activeTop - containerHeight / 2;
    }
  }
  
  // 更新播放列表显示
  function updatePlaylistDisplay() {
    if (currentPlaylist.length === 0) {
      playlistItems.innerHTML = '<li class="list-group-item text-center">播放列表为空</li>';
      return;
    }
    
    let html = '';
    currentPlaylist.forEach((song, index) => {
      const isActive = index === currentIndex;
      html += `
        <li class="list-group-item playlist-item ${isActive ? 'active' : ''}" data-index="${index}">
          <div class="d-flex align-items-center w-100">
            <img src="${song.cover}" alt="${song.title}" class="playlist-item-cover">
            <div class="playlist-item-info">
              <div class="playlist-item-title">${song.title}</div>
              <div class="playlist-item-artist">${song.artist}</div>
            </div>
            <div class="playlist-item-controls ms-auto">
              <button class="btn btn-sm btn-remove" data-index="${index}">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        </li>
      `;
    });
    
    playlistItems.innerHTML = html;
    
    // 添加播放点击事件
    playlistItems.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', function(e) {
        if (e.target.closest('.btn-remove')) return;
        
        const index = parseInt(this.dataset.index);
        if (index !== currentIndex) {
          currentIndex = index;
          playSong(currentPlaylist[currentIndex]);
        }
      });
    });
    
    // 添加移除按钮点击事件
    playlistItems.querySelectorAll('.btn-remove').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const index = parseInt(this.dataset.index);
        removeFromPlaylist(index);
      });
    });
  }
  
  // 从播放列表中移除歌曲
  function removeFromPlaylist(index) {
    // 如果移除的是当前播放的歌曲
    if (index === currentIndex) {
      if (currentPlaylist.length > 1) {
        // 如果不是最后一首，播放下一首
        if (index < currentPlaylist.length - 1) {
          // 先移除，保持currentIndex指向下一首
          currentPlaylist.splice(index, 1);
          playSong(currentPlaylist[currentIndex]);
        } else {
          // 如果是最后一首，播放前一首
          currentPlaylist.splice(index, 1);
          currentIndex = currentPlaylist.length - 1;
          playSong(currentPlaylist[currentIndex]);
        }
      } else {
        // 如果只有一首歌，停止播放并清空播放列表
        audioElement.pause();
        currentPlaylist = [];
        currentIndex = -1;
        playingTitle.textContent = '暂无播放';
        playingArtist.textContent = '-';
        playingCover.src = '/img/default-cover.jpg';
        isPlaying = false;
        playButton.innerHTML = '<i class="bi bi-play-circle-fill"></i>';
        updatePlaylistDisplay();
      }
    } else {
      // 如果移除的不是当前播放的歌曲
      if (index < currentIndex) {
        // 如果移除的歌曲在当前歌曲之前，需要调整currentIndex
        currentIndex--;
      }
      currentPlaylist.splice(index, 1);
      updatePlaylistDisplay();
    }
    
    // 保存播放列表到本地存储
    savePlaylistToStorage();
  }
  
  // 清空播放列表
  function clearPlaylist() {
    audioElement.pause();
    currentPlaylist = [];
    currentIndex = -1;
    playingTitle.textContent = '暂无播放';
    playingArtist.textContent = '-';
    playingCover.src = '/img/default-cover.jpg';
    isPlaying = false;
    playButton.innerHTML = '<i class="bi bi-play-circle-fill"></i>';
    updatePlaylistDisplay();
    
    // 清除本地存储
    localStorage.removeItem('currentPlaylist');
    localStorage.removeItem('currentIndex');
  }
  
  // 记录播放历史
  function recordPlayHistory(songId) {
    if (!songId) return;
    
    fetch('/api/play-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ songId })
    })
    .catch(error => {
      console.error('记录播放历史失败:', error);
    });
  }
  
  // 保存播放列表到本地存储
  function savePlaylistToStorage() {
    localStorage.setItem('currentPlaylist', JSON.stringify(currentPlaylist));
    localStorage.setItem('currentIndex', currentIndex);
  }
  
  // 从本地存储加载播放列表
  function loadPlaylistFromStorage() {
    const savedPlaylist = localStorage.getItem('currentPlaylist');
    const savedIndex = localStorage.getItem('currentIndex');
    
    if (savedPlaylist) {
      currentPlaylist = JSON.parse(savedPlaylist);
      currentIndex = parseInt(savedIndex || 0);
      
      // 更新播放列表显示
      updatePlaylistDisplay();
      
      // 如果有歌曲，则更新播放器显示
      if (currentPlaylist.length > 0 && currentIndex >= 0) {
        const currentSong = currentPlaylist[currentIndex];
        playingTitle.textContent = currentSong.title;
        playingArtist.textContent = currentSong.artist;
        playingCover.src = currentSong.cover;
        
        // 设置音频源（但不自动播放）
        audioElement.src = currentSong.audio;
        audioElement.load();
        
        // 更新收藏按钮状态
        updateFavoriteButton(currentSong.id);
        
        // 加载歌词
        loadLyrics(currentSong.id);
      }
    }
  }
  
  // 保存设置到本地存储
  function saveSettingsToStorage(settings) {
    const savedSettings = localStorage.getItem('playerSettings');
    let playerSettings = savedSettings ? JSON.parse(savedSettings) : {};
    
    // 合并新设置
    playerSettings = { ...playerSettings, ...settings };
    
    localStorage.setItem('playerSettings', JSON.stringify(playerSettings));
  }
  
  // 从本地存储加载设置
  function loadSettingsFromStorage() {
    const savedSettings = localStorage.getItem('playerSettings');
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      // 应用音量设置
      if (settings.volume !== undefined) {
        currentVolume = settings.volume;
        audioElement.volume = currentVolume;
        volumeBar.style.width = currentVolume * 100 + '%';
        updateVolumeIcon();
      }
      
      // 应用随机播放设置
      if (settings.shuffle !== undefined) {
        isShuffle = settings.shuffle;
        shuffleButton.classList.toggle('text-primary', isShuffle);
      }
      
      // 应用循环模式设置
      if (settings.repeat !== undefined) {
        repeatMode = settings.repeat;
        if (repeatMode === 'all') {
          repeatButton.innerHTML = '<i class="bi bi-arrow-repeat text-primary"></i>';
        } else if (repeatMode === 'one') {
          repeatButton.innerHTML = '<i class="bi bi-1-circle text-primary"></i>';
        } else {
          repeatButton.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
        }
      }
    }
  }
  
  // 初始化播放器
  initPlayer();

  // 导出需要在其他地方使用的函数
  window.musicPlayer = {
    playSong,
    togglePlay,
    playNext,
    playPrevious,
    clearPlaylist,
    updatePlaylistDisplay
  };
});