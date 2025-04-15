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
  const lyricsContent = document.getElementById('lyrics-content');
  const playlistItems = document.getElementById('playlist-items');
  
  // 音效控制
  const equalizerButton = document.getElementById('btn-equalizer');
  const equalizerPanel = document.getElementById('equalizer-panel');
  const closeEqualizer = document.getElementById('close-equalizer');
  const presetButtons = document.querySelectorAll('.preset-button');
  const eqSliders = document.querySelectorAll('.eq-slider');
  
  // 添加收藏按钮
  const favoriteButton = document.getElementById('btn-favorite');
  
  // 播放器状态
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = 'none'; // none, one, all
  let currentVolume = 1;
  let currentPlaylist = [];
  let currentIndex = 0;
  let audioContext = null;
  let sourceNode = null;
  let gainNode = null;
  let analyserNode = null;
  let equalizerNodes = [];
  let equalizerBands = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 16000];
  
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
    lyricsButton.addEventListener('click', toggleLyricsPanel);
    playlistButton.addEventListener('click', togglePlaylistPanel);
    closeLyrics.addEventListener('click', toggleLyricsPanel);
    closePlaylist.addEventListener('click', togglePlaylistPanel);
    
    // 均衡器面板
    if (equalizerButton) {
      equalizerButton.addEventListener('click', toggleEqualizerPanel);
      closeEqualizer.addEventListener('click', toggleEqualizerPanel);
      
      // 预设按钮
      presetButtons.forEach(button => {
        button.addEventListener('click', function() {
          applyEqualizerPreset(this.dataset.preset);
        });
      });
      
      // 均衡器滑块
      eqSliders.forEach(slider => {
        slider.addEventListener('input', updateEqualizer);
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
      
      // 创建均衡器节点
      equalizerNodes = equalizerBands.map(frequency => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });
      
      // 连接节点
      sourceNode.connect(equalizerNodes[0]);
      
      for (let i = 0; i < equalizerNodes.length - 1; i++) {
        equalizerNodes[i].connect(equalizerNodes[i + 1]);
      }
      
      equalizerNodes[equalizerNodes.length - 1].connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
      
    } catch (e) {
      console.error('Web Audio API 初始化失败:', e);
    }
  }
  
  // 应用均衡器预设
  function applyEqualizerPreset(preset) {
    let gains = [];
    
    switch (preset) {
      case 'flat':
        gains = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        break;
      case 'pop':
        gains = [-1, 3, 5, 3, 1, 0, 2, 3, 1];
        break;
      case 'rock':
        gains = [4, 3, -1, -2, -1, 2, 5, 6, 6];
        break;
      case 'jazz':
        gains = [3, 2, 1, 2, -1, -1, 0, 1, 3];
        break;
      case 'classical':
        gains = [4, 3, 2, 1, -1, -1, 0, 2, 3];
        break;
      case 'dance':
        gains = [6, 5, 2, 0, 0, -2, 0, 4, 5];
        break;
      default:
        gains = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    
    // 更新均衡器滑块并应用设置
    eqSliders.forEach((slider, index) => {
      slider.value = gains[index];
      if (equalizerNodes[index]) {
        equalizerNodes[index].gain.value = gains[index];
      }
    });
    
    // 保存均衡器设置
    saveSettingsToStorage({ equalizerPreset: preset, equalizerGains: gains });
    
    // 高亮当前预设按钮
    presetButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === preset);
    });
  }
  
  // 更新均衡器
  function updateEqualizer() {
    const index = parseInt(this.dataset.band);
    const gain = parseFloat(this.value);
    
    if (equalizerNodes[index]) {
      equalizerNodes[index].gain.value = gain;
    }
    
    // 获取当前所有均衡器增益值
    const gains = Array.from(eqSliders).map(slider => parseFloat(slider.value));
    
    // 保存均衡器设置
    saveSettingsToStorage({ equalizerGains: gains, equalizerPreset: 'custom' });
    
    // 取消所有预设按钮的高亮
    presetButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    // 高亮自定义预设按钮
    const customButton = document.querySelector('[data-preset="custom"]');
    if (customButton) {
      customButton.classList.add('active');
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
    
    // 加载歌词（如果有）
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
  
  // 切换歌词面板
  function toggleLyricsPanel() {
    const isVisible = lyricsPanel.style.display === 'flex';
    lyricsPanel.style.display = isVisible ? 'none' : 'flex';
    
    // 关闭其他面板
    if (!isVisible) {
      playlistPanel.style.display = 'none';
      if (equalizerPanel) equalizerPanel.style.display = 'none';
    }
  }
  
  // 切换播放列表面板
  function togglePlaylistPanel() {
    const isVisible = playlistPanel.style.display === 'flex';
    playlistPanel.style.display = isVisible ? 'none' : 'flex';
    
    // 关闭其他面板
    if (!isVisible) {
      lyricsPanel.style.display = 'none';
      if (equalizerPanel) equalizerPanel.style.display = 'none';
    }
  }
  
  // 切换均衡器面板
  function toggleEqualizerPanel() {
    const isVisible = equalizerPanel.style.display === 'flex';
    equalizerPanel.style.display = isVisible ? 'none' : 'flex';
    
    // 关闭其他面板
    if (!isVisible) {
      lyricsPanel.style.display = 'none';
      playlistPanel.style.display = 'none';
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
          lyricsContent.innerHTML = '<p class="text-center">暂无歌词</p>';
        }
      })
      .catch(error => {
        console.error('获取歌词失败:', error);
        lyricsContent.innerHTML = '<p class="text-center">暂无歌词</p>';
      });
  }
  
  // 解析LRC格式歌词
  function parseLyrics(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const timeRegExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
        const match = line.match(timeRegExp);
        
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const milliseconds = parseInt(match[3]);
          const time = minutes * 60 + seconds + milliseconds / 1000;
          const text = line.replace(timeRegExp, '').trim();
          
          if (text) {
            result.push({ time, text });
          }
        }
      }
    }
    
    return result.sort((a, b) => a.time - b.time);
  }
  
  // 显示歌词
  function displayLyrics(lines) {
    if (lines.length === 0) {
      lyricsContent.innerHTML = '<p class="text-center">暂无歌词</p>';
      return;
    }
    
    let html = '';
    for (let i = 0; i < lines.length; i++) {
      html += `<p data-time="${lines[i].time}">${lines[i].text}</p>`;
    }
    
    lyricsContent.innerHTML = html;
    window.currentLyricLines = lines;
  }
  
  // 更新当前歌词
  function updateActiveLyric(currentTime) {
    if (!window.currentLyricLines || !window.currentLyricLines.length) return;
    
    const lines = window.currentLyricLines;
    const paragraphs = lyricsContent.querySelectorAll('p');
    
    // 清除之前的激活状态
    paragraphs.forEach(p => p.classList.remove('active'));
    
    // 查找当前歌词行
    let activeIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (i === lines.length - 1 || (currentTime >= lines[i].time && currentTime < lines[i + 1].time)) {
        activeIndex = i;
        break;
      }
    }
    
    // 激活当前行
    if (activeIndex >= 0 && activeIndex < paragraphs.length) {
      paragraphs[activeIndex].classList.add('active');
      
      // 滚动到当前歌词
      const activeTop = paragraphs[activeIndex].offsetTop;
      const containerHeight = lyricsContent.clientHeight;
      lyricsContent.scrollTop = activeTop - containerHeight / 2;
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
      
      // 应用均衡器设置
      if (settings.equalizerPreset && equalizerButton) {
        // 高亮预设按钮
        presetButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.preset === settings.equalizerPreset);
        });
      }
      
      if (settings.equalizerGains && equalizerNodes.length) {
        // 设置均衡器滑块和节点增益
        settings.equalizerGains.forEach((gain, index) => {
          if (index < eqSliders.length) {
            eqSliders[index].value = gain;
          }
          if (index < equalizerNodes.length) {
            equalizerNodes[index].gain.value = gain;
          }
        });
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