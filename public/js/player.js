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
  
  // 浮动歌词相关元素
  const floatingLyricsContainer = document.getElementById('floating-lyrics-container');
  const currentLyricElement = document.getElementById('current-lyric');
  const lyricsButton = document.getElementById('btn-lyrics');
  
  // 播放列表相关
  const playlistButton = document.getElementById('btn-playlist');
  const playlistPanel = document.getElementById('playlist-panel');
  const closePlaylist = document.getElementById('close-playlist');
  const playlistItems = document.getElementById('playlist-items');
  
  // 添加收藏按钮
  const favoriteButton = document.getElementById('btn-favorite');
  
  // 添加全屏歌词相关变量
  const fullscreenLyrics = document.getElementById('fullscreen-lyrics');
  const closeFullscreenLyrics = document.getElementById('close-fullscreen-lyrics');
  const fullscreenLyricsText = document.getElementById('fullscreen-lyrics-text');
  const fsSongTitle = document.getElementById('fs-song-title');
  const fsSongArtist = document.getElementById('fs-song-artist');
  const fsSongCover = document.getElementById('fs-song-cover');
  
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
  
  // 歌词相关状态
  let currentLyrics = [];
  let currentLyricFontSize = 64; // 默认字体大小 - 修改为64px
  let currentLyricColor = 'white'; // 默认颜色
  
  // 检查DOM元素是否存在
  if (!playButton) {
    console.error('播放器元素未找到，播放器初始化失败');
    return; // 终止初始化
  }
  
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
    closePlaylist.addEventListener('click', togglePlaylistPanel);
    
    // 初始化 Web Audio API
    initAudioContext();
    
    // 初始化浮动歌词功能
    initFloatingLyrics();
    
    // 获取播放列表中的歌曲
    setupPlayButtons();
    
    // 从本地存储加载播放状态
    loadPlayStateFromStorage();
    
    // 尝试从本地存储加载播放列表和设置
    loadPlaylistFromStorage();
    loadSettingsFromStorage();
    
    // 加载歌词设置
    loadLyricsSettings();
    
    // 添加页面状态事件
    initPageStateEvents();
    initVisualizers();
  }
  
  // 设置所有播放按钮
  function setupPlayButtons() {
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
      
      // 停止封面旋转
      playingCover.classList.remove('rotating');
      if (fsSongCover) fsSongCover.classList.remove('rotating');
    } else {
      audioElement.play();
      isPlaying = true;
      playButton.innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
      
      // 开始封面旋转
      playingCover.classList.add('rotating');
      if (fsSongCover && fullscreenLyrics && fullscreenLyrics.classList.contains('active')) {
        fsSongCover.classList.add('rotating');
      }
    }
    
    // 保存播放状态
    savePlayStateToStorage();
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
    
    // 在设置新音频源之前停止当前播放
    audioElement.pause();
    
    // 设置新的音频源
    audioElement.src = song.audio;
    audioElement.load();
    
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    audioElement.play()
      .then(() => {
        isPlaying = true;
        playButton.innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
        
        // 开始封面旋转
        playingCover.classList.add('rotating');
        if (fsSongCover && fullscreenLyrics && fullscreenLyrics.classList.contains('active')) {
          fsSongCover.classList.add('rotating');
        }
        
        // 保存播放状态
        savePlayStateToStorage();
      })
      .catch(error => {
        console.error('播放失败:', error);
        isPlaying = false;
        playButton.innerHTML = '<i class="bi bi-play-circle-fill"></i>';
        
        // 停止封面旋转
        playingCover.classList.remove('rotating');
        if (fsSongCover) fsSongCover.classList.remove('rotating');
      });
    
    // 更新播放器显示
    playingTitle.textContent = song.title;
    playingArtist.textContent = song.artist;
    playingCover.src = song.cover;
    
    // 更新收藏按钮状态
    updateFavoriteButton(song.id);
    
    // 加载歌词
    loadLyrics(song.id);
    
    // 更新全屏歌词（如果已打开）
    if (fullscreenLyrics && fullscreenLyrics.classList.contains('active')) {
      updateFullscreenLyrics();
    }
    
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
      
      // 停止封面旋转
      playingCover.classList.remove('rotating');
      if (fsSongCover) fsSongCover.classList.remove('rotating');
      
      // 保存状态
      savePlayStateToStorage();
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
    
    // 保存播放状态
    savePlayStateToStorage();
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
      
      // 更新音频可视化效果
      updateVisualizer();
      
      // 定期保存播放状态
      if (Math.round(currentTime) % 5 === 0) { // 每5秒保存一次
        savePlayStateToStorage();
      }
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
        // 更新收藏按钮样式
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
    if (!favoriteButton || !songId) return;
    
    fetch(`/api/song/${songId}/is-liked`)
      .then(response => response.json())
      .then(data => {
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
  }
  
  // 加载歌词
  function loadLyrics(songId) {
    fetch(`/api/lyrics/${songId}`)
      .then(response => response.json())
      .then(data => {
        if (data.lyrics) {
          // 解析LRC格式歌词
          currentLyrics = parseLyrics(data.lyrics);
          
          // 如果有歌词，显示第一句
          if (currentLyrics.length > 0) {
            updateCurrentLyric(currentLyrics[0].text);
          } else {
            updateCurrentLyric(''); // 不显示"暂无歌词"
          }
        } else {
          // 无歌词时不显示任何文本
          currentLyrics = [];
          updateCurrentLyric('');
        }
        
        // 如果全屏歌词已打开，更新全屏歌词
        if (fullscreenLyrics && fullscreenLyrics.classList.contains('active')) {
          updateFullscreenLyrics();
        }
      })
      .catch(error => {
        console.error('获取歌词失败:', error);
        currentLyrics = [];
        updateCurrentLyric('');
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

  // 更新当前歌词文本 - 改为逐字高亮显示
  function updateCurrentLyric(text) {
    if (currentLyricElement) {
      // 如果没有文本或是"暂无歌词"，则不显示
      if (!text || text === '暂无歌词') {
        currentLyricElement.innerHTML = '';
        return;
      }
      
      // 将文本分成单个字符并添加span标签
      currentLyricElement.innerHTML = '';
      for (let i = 0; i < text.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.textContent = text[i];
        charSpan.className = 'lyric-char';
        currentLyricElement.appendChild(charSpan);
      }
    }
  }

  // 更新当前活跃歌词 - 改为支持逐字高亮
  function updateActiveLyric(currentTime) {
    if (!currentLyrics || currentLyrics.length === 0) return;
    
    // 查找当前时间对应的歌词行
    let currentLyricIndex = -1;
    let nextLyricTime = Infinity;
    
    for (let i = 0; i < currentLyrics.length; i++) {
      if (i === currentLyrics.length - 1) {
        // 最后一行
        if (currentTime >= currentLyrics[i].time) {
          currentLyricIndex = i;
        }
      } else if (currentTime >= currentLyrics[i].time && currentTime < currentLyrics[i + 1].time) {
        // 当前行
        currentLyricIndex = i;
        nextLyricTime = currentLyrics[i + 1].time;
        break;
      }
    }
    
    // 如果找到了当前行，更新显示
    if (currentLyricIndex >= 0) {
      const currentLyricText = currentLyrics[currentLyricIndex].text;
      
      // 如果当前显示的不是这句歌词，更新整句歌词
      if (currentLyricElement.textContent !== currentLyricText) {
        updateCurrentLyric(currentLyricText);
      }
      
      // 计算当前行已经播放的进度比例
      const lineStartTime = currentLyrics[currentLyricIndex].time;
      let lineDuration;
      
      if (currentLyricIndex < currentLyrics.length - 1) {
        lineDuration = nextLyricTime - lineStartTime;
      } else {
        // 最后一句歌词，假设持续5秒
        lineDuration = 5;
      }
      
      const lineProgress = (currentTime - lineStartTime) / lineDuration;
      
      // 根据进度计算应该高亮到哪个字
      const charElements = currentLyricElement.querySelectorAll('.lyric-char');
      const totalChars = charElements.length;
      
      if (totalChars > 0) {
        // 计算应该高亮的字数
        const highlightCount = Math.min(Math.ceil(lineProgress * totalChars), totalChars);
        
        // 设置每个字的样式
        for (let i = 0; i < totalChars; i++) {
          if (i < highlightCount) {
            charElements[i].classList.add('lyric-char-active');
          } else {
            charElements[i].classList.remove('lyric-char-active');
          }
        }
      }
      
      // 同时更新全屏歌词视图中的高亮
      updateFullscreenActiveLyric(currentTime);
    }
  }
  
  // 切换歌词可见性
  function toggleLyricsVisibility() {
    lyricsVisible = !lyricsVisible;
    
    if (lyricsVisible) {
      floatingLyricsContainer.style.display = 'block';
      lyricsButton.innerHTML = '<i class="bi bi-chat-quote-fill"></i>';
    } else {
      floatingLyricsContainer.style.display = 'none';
      lyricsButton.innerHTML = '<i class="bi bi-chat-quote"></i>';
    }
    
    // 保存设置
    saveLyricsSettings({ visible: lyricsVisible });
  }
  
  // 初始化浮动歌词功能
  function initFloatingLyrics() {
    if (!floatingLyricsContainer || !currentLyricElement) return;
    
    // 初始化时清空文本，不显示"暂无歌词"
    currentLyricElement.innerHTML = '';
    
    let isDragging = false;
    let offsetX, offsetY;
    
    // 添加拖动事件
    floatingLyricsContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - floatingLyricsContainer.getBoundingClientRect().left;
      offsetY = e.clientY - floatingLyricsContainer.getBoundingClientRect().top;
      floatingLyricsContainer.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      
      floatingLyricsContainer.style.left = `${x}px`;
      floatingLyricsContainer.style.top = `${y}px`;
      floatingLyricsContainer.style.transform = 'none';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      floatingLyricsContainer.style.cursor = 'move';
    });
    
    // 初始化颜色控制按钮
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const color = this.dataset.color;
        
        // 更新活动按钮
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // 更新歌词颜色类
        currentLyricElement.className = 'current-lyric';
        currentLyricElement.classList.add(`lyric-color-${color}`);
        currentLyricColor = color;
        
        // 保存设置
        saveLyricsSettings({ color: color });
      });
    });
  }
  
  // 切换全屏歌词显示
  function toggleFullscreenLyrics() {
    if (fullscreenLyrics) {
      fullscreenLyrics.classList.toggle('active');
      
      if (fullscreenLyrics.classList.contains('active')) {
        updateFullscreenLyrics();
        
        // 同步封面旋转状态
        if (isPlaying) {
          fsSongCover.classList.add('rotating');
        } else {
          fsSongCover.classList.remove('rotating');
        }
      }
    }
  }
  
  // 更新全屏歌词内容
  function updateFullscreenLyrics() {
  if (!fullscreenLyrics || currentPlaylist.length === 0 || currentIndex < 0) return;
  
  const currentSong = currentPlaylist[currentIndex];
  
  // 更新歌曲信息
  fsSongTitle.textContent = currentSong.title;
  fsSongArtist.textContent = currentSong.artist;
  fsSongCover.src = currentSong.cover;
  
    // 更新歌词
    if (currentLyrics.length > 0) {
      let html = '';
      
      currentLyrics.forEach((lyric, index) => {
        html += `<div id="lyric-line-${index}" class="fullscreen-lyrics-line">${lyric.text}</div>`;
      });
      
      fullscreenLyricsText.innerHTML = html;
      
      // 高亮当前歌词
      updateFullscreenActiveLyric(audioElement.currentTime);
      
      // 动画效果：使封面旋转
      if (isPlaying) {
        fsSongCover.classList.add('rotating');
      } else {
        fsSongCover.classList.remove('rotating');
      }
      
      // 更新音频可视化效果
      updateFSVisualizer();
    } else {
      fullscreenLyricsText.innerHTML = '<div class="text-center py-4">暂无歌词</div>';
    }
  }

  // 更新全屏视图中的活动歌词
  function updateFullscreenActiveLyric(currentTime) {
    if (!fullscreenLyrics || !fullscreenLyrics.classList.contains('active') || currentLyrics.length === 0) return;
    
    let currentLyricIndex = -1;
    
    for (let i = 0; i < currentLyrics.length; i++) {
      if (i === currentLyrics.length - 1) {
        if (currentTime >= currentLyrics[i].time) {
          currentLyricIndex = i;
        }
      } else if (currentTime >= currentLyrics[i].time && currentTime < currentLyrics[i + 1].time) {
        currentLyricIndex = i;
        break;
      }
    }
    
    if (currentLyricIndex >= 0) {
      // 移除所有行的高亮
      document.querySelectorAll('.fullscreen-lyrics-line').forEach(line => {
        line.classList.remove('active');
      });
      
      // 给当前行添加高亮
      const currentLine = document.getElementById(`lyric-line-${currentLyricIndex}`);
      if (currentLine) {
        currentLine.classList.add('active');
        
        // 滚动到当前行，平滑滚动并居中
        currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // 添加全屏歌词视图的音频可视化效果
  function updateFSVisualizer() {
    // 如果不在播放状态，不更新
    if (!isPlaying) return;
    
    // 获取所有可视化条
    const bars = document.querySelectorAll('.fs-visualizer-bar');
    if (bars.length === 0) return;
    
    // 随机模拟音频频谱
    bars.forEach(bar => {
      const height = isPlaying ? Math.floor(Math.random() * 45) + 5 : 5;
      bar.style.height = `${height}px`;
    });
  }

  // 初始化可视化效果
  function initVisualizers() {
    // 每100ms更新一次可视化效果
    setInterval(updateVisualizer, 100);
    
    // 全屏歌词视图的音频可视化效果
    setInterval(updateFSVisualizer, 100);
  }
  
  // 保存播放状态到本地存储
  function savePlayStateToStorage() {
    localStorage.setItem('isPlaying', isPlaying);
    if (!isNaN(audioElement.currentTime)) {
      localStorage.setItem('currentTime', audioElement.currentTime);
    }
    // 保存当前播放的歌曲完整信息，用于跨页面恢复
    if (currentPlaylist.length > 0 && currentIndex >= 0) {
      localStorage.setItem('currentSongId', currentPlaylist[currentIndex].id);
      localStorage.setItem('currentSongData', JSON.stringify(currentPlaylist[currentIndex]));
      // 保存播放列表和当前索引
      localStorage.setItem('currentPlaylist', JSON.stringify(currentPlaylist));
      localStorage.setItem('currentIndex', currentIndex);
    }
  }

  // 从本地存储加载播放状态
  function loadPlayStateFromStorage() {
    const savedIsPlaying = localStorage.getItem('isPlaying') === 'true';
    const savedCurrentTime = parseFloat(localStorage.getItem('currentTime') || '0');
    const savedSongData = localStorage.getItem('currentSongData');
    
    // 先检查是否有保存的完整歌曲数据
    if (savedSongData) {
      try {
        const songData = JSON.parse(savedSongData);
        
        // 恢复整个播放列表
        try {
          const savedPlaylist = localStorage.getItem('currentPlaylist');
          if (savedPlaylist) {
            currentPlaylist = JSON.parse(savedPlaylist);
            currentIndex = parseInt(localStorage.getItem('currentIndex') || '0');
          } else {
            // 如果没有保存完整播放列表，则只添加当前歌曲
            currentPlaylist = [songData];
            currentIndex = 0;
          }
        } catch (e) {
          console.log('恢复播放列表失败，仅恢复当前歌曲', e);
          currentPlaylist = [songData];
          currentIndex = 0;
        }
        
        // 更新播放器界面
        updatePlayerDisplay();
        
        // 立即设置音频源并预加载
        audioElement.src = songData.audio;
        audioElement.load();
        
        // 设置播放时间
        if (!isNaN(savedCurrentTime)) {
          audioElement.currentTime = savedCurrentTime;
        }
        
        // 如果上次正在播放，立即尝试恢复播放
        if (savedIsPlaying) {
          // 优化自动播放策略
          setTimeout(() => {
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
              playPromise.then(() => {
                // 播放成功
                isPlaying = true;
                playButton.innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
                
                // 开始封面旋转
                playingCover.classList.add('rotating');
                if (fsSongCover && fullscreenLyrics && fullscreenLyrics.classList.contains('active')) {
                  fsSongCover.classList.add('rotating');
                }
              }).catch(error => {
                console.log('自动播放受限:', error);
                // 设置一个标志，等待用户交互后自动恢复播放
                window.pendingAutoplay = true;
                // 添加可见提示
                showAutoplayNotification();
              });
            }
          }, 100); // 短暂延时确保页面加载完成
        }
      } catch (error) {
        console.error('恢复播放状态失败:', error);
      }
    }
  }

  // 添加自动播放提示
  function showAutoplayNotification() {
    // 创建提示元素
    const notification = document.createElement('div');
    notification.className = 'autoplay-notification';
    notification.innerHTML = '<i class="bi bi-music-note"></i> 点击任意处继续播放';
    document.body.appendChild(notification);
    
    // 3秒后自动隐藏
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }
  
  // 加载歌词设置
  function loadLyricsSettings() {
    const savedSettings = localStorage.getItem('lyricsSettings');
    
    if (savedSettings && floatingLyricsContainer && currentLyricElement) {
      const settings = JSON.parse(savedSettings);
      
      // 统一设置为64px的字体大小
      currentLyricFontSize = 64;
      currentLyricElement.style.fontSize = '64px';
      
      // 应用颜色
      if (settings.color) {
        currentLyricColor = settings.color;
        currentLyricElement.classList.add(`lyric-color-${settings.color}`);
        
        // 激活对应的颜色按钮
        const colorBtn = document.querySelector(`.color-btn[data-color="${settings.color}"]`);
        if (colorBtn) {
          document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
          colorBtn.classList.add('active');
        }
      } else {
        // 默认为白色
        currentLyricColor = 'white';
        currentLyricElement.classList.add('lyric-color-white');
        
        const colorBtn = document.querySelector('.color-btn[data-color="white"]');
        if (colorBtn) {
          colorBtn.classList.add('active');
        }
      }
      
      // 应用可见性设置
      if (settings.visible !== undefined) {
        lyricsVisible = settings.visible;
        floatingLyricsContainer.style.display = lyricsVisible ? 'block' : 'none';
        lyricsButton.innerHTML = lyricsVisible ? 
          '<i class="bi bi-chat-quote-fill"></i>' : 
          '<i class="bi bi-chat-quote"></i>';
      } else {
        // 默认显示
        lyricsVisible = true;
        floatingLyricsContainer.style.display = 'block';
      }
    } else {
      // 默认设置
      if (floatingLyricsContainer && currentLyricElement) {
        lyricsVisible = true;
        floatingLyricsContainer.style.display = 'block';
        currentLyricFontSize = 64; // 更大的默认字体
        currentLyricElement.style.fontSize = '64px';
        currentLyricColor = 'white';
        currentLyricElement.classList.add('lyric-color-white');
        
        const colorBtn = document.querySelector('.color-btn[data-color="white"]');
        if (colorBtn) {
          colorBtn.classList.add('active');
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
  
  // 页面状态管理 - 增强版
  function initPageStateEvents() {
    // 处理自动播放限制 - 增强为全局事件
    document.addEventListener('click', function() {
      if (window.pendingAutoplay) {
        audioElement.play().then(() => {
          isPlaying = true;
          playButton.innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
          playingCover.classList.add('rotating');
          window.pendingAutoplay = false;
          
          // 隐藏提示(如果存在)
          const notification = document.querySelector('.autoplay-notification');
          if (notification) {
            notification.classList.add('fade-out');
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 500);
          }
        }).catch(e => console.log('播放失败:', e));
      }
    });
    
    // 页面可见性变化事件监听
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时保存状态
        savePlayStateToStorage();
      } else if (document.visibilityState === 'visible') {
        // 页面重新可见时，尝试恢复播放
        if (window.pendingAutoplay) {
          audioElement.play().then(() => {
            isPlaying = true;
            playButton.innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
            playingCover.classList.add('rotating');
            window.pendingAutoplay = false;
          }).catch(e => console.log('可见性恢复时播放失败:', e));
        }
      }
    });
    
    // 在页面卸载前保存状态
    window.addEventListener('beforeunload', function() {
      savePlayStateToStorage();
    });
    
    // 在用户点击链接时保存状态 - 增强版本
    document.addEventListener('click', function(e) {
      // 检查是否点击了链接
      let target = e.target;
      while (target && target !== document) {
        if (target.tagName === 'A' && target.href && !target.getAttribute('download')) {
          // 立即保存播放状态
          savePlayStateToStorage();
          break;
        }
        target = target.parentNode;
      }
    });
    
    // 监听表单提交事件也保存状态
    document.addEventListener('submit', function() {
      savePlayStateToStorage();
    });
    
    // 每30秒自动保存一次状态(作为备份)
    setInterval(savePlayStateToStorage, 30000);
  }
  
  // 更新播放器显示
  function updatePlayerDisplay() {
    if (currentPlaylist.length > 0 && currentIndex >= 0) {
      const currentSong = currentPlaylist[currentIndex];
      playingTitle.textContent = currentSong.title;
      playingArtist.textContent = currentSong.artist;
      playingCover.src = currentSong.cover;
      
      // 更新收藏按钮状态
      updateFavoriteButton(currentSong.id);
      
      // 加载歌词
      loadLyrics(currentSong.id);
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
            <img src="${song.cover}" alt="${song.title}" class="playlist-item-cover me-2" style="width: 40px; height: 40px;">
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
        
        // 停止封面旋转
        playingCover.classList.remove('rotating');
        if (fsSongCover) fsSongCover.classList.remove('rotating');
        
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
      if (currentPlaylist.length > 0 && currentIndex >= 0 && currentIndex < currentPlaylist.length) {
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
  
  // 添加音频可视化效果
  function updateVisualizer() {
    // 如果不在播放状态，不更新
    if (!isPlaying) return;
    
    // 获取所有可视化条
    const bars = document.querySelectorAll('.visualizer-bar');
    if (bars.length === 0) return;
    
    // 随机模拟音频频谱
    bars.forEach(bar => {
      const height = isPlaying ? Math.floor(Math.random() * 15) + 5 : 5;
      bar.style.height = `${height}px`;
    });
  }
  
  // 绑定全屏歌词相关事件
  if (playingCover) {
    playingCover.addEventListener('click', toggleFullscreenLyrics);
  }
  
  if (closeFullscreenLyrics) {
    closeFullscreenLyrics.addEventListener('click', toggleFullscreenLyrics);
  }
  
  // 初始化播放器
  initPlayer();
  
  // 导出需要在其他地方使用的函数
  window.musicPlayer = {
    playSong,
    togglePlay,
    playNext,
    playPrevious,
    updatePlaylistDisplay
  };
});