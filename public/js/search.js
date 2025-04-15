document.addEventListener('DOMContentLoaded', function() {
  // 搜索相关元素
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchTypeSelect = document.getElementById('search-type');
  const searchSuggestionsContainer = document.getElementById('search-suggestions');
  const clearSearchButton = document.getElementById('clear-search');
  const advancedSearchToggle = document.getElementById('advanced-search-toggle');
  const advancedSearchPanel = document.getElementById('advanced-search-panel');
  
  // 高级搜索筛选器
  const genreFilter = document.getElementById('genre-filter');
  const languageFilter = document.getElementById('language-filter');
  const yearFilter = document.getElementById('year-filter');
  const durationFilter = document.getElementById('duration-filter');
  const bpmFilter = document.getElementById('bpm-filter');
  
  // 搜索历史
  const searchHistoryContainer = document.getElementById('search-history');
  const clearHistoryButton = document.getElementById('clear-history');
  
  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  // 获取搜索建议
  const fetchSuggestions = debounce(function(query) {
    if (!query || query.length < 2) {
      searchSuggestionsContainer.innerHTML = '';
      searchSuggestionsContainer.style.display = 'none';
      return;
    }
    
    fetch(`/api/search-suggestions?query=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (data.suggestions && (
          data.suggestions.songs.length > 0 || 
          data.suggestions.artists.length > 0 || 
          data.suggestions.albums.length > 0 || 
          data.suggestions.hot.length > 0
        )) {
          displaySuggestions(data.suggestions);
        } else {
          searchSuggestionsContainer.innerHTML = '';
          searchSuggestionsContainer.style.display = 'none';
        }
      })
      .catch(error => {
        console.error('获取搜索建议失败:', error);
        searchSuggestionsContainer.innerHTML = '';
        searchSuggestionsContainer.style.display = 'none';
      });
  }, 300);
  
  // 显示搜索建议
  function displaySuggestions(suggestions) {
    let html = '';
    
    // 显示热门搜索
    if (suggestions.hot && suggestions.hot.length > 0) {
      html += '<div class="suggestion-category"><span>热门搜索</span></div>';
      suggestions.hot.forEach(item => {
        html += `
          <div class="suggestion-item" data-type="hot" data-text="${item.text}">
            <i class="bi bi-fire text-danger"></i>
            <span>${item.text}</span>
          </div>
        `;
      });
    }
    
    // 显示歌曲建议
    if (suggestions.songs && suggestions.songs.length > 0) {
      html += '<div class="suggestion-category"><span>歌曲</span></div>';
      suggestions.songs.forEach(song => {
        html += `
          <div class="suggestion-item" data-type="song" data-text="${song.text}">
            <i class="bi bi-music-note"></i>
            <span>${song.title} - <small class="text-muted">${song.artist}</small></span>
          </div>
        `;
      });
    }
    
    // 显示艺术家建议
    if (suggestions.artists && suggestions.artists.length > 0) {
      html += '<div class="suggestion-category"><span>艺术家</span></div>';
      suggestions.artists.forEach(artist => {
        html += `
          <div class="suggestion-item" data-type="artist" data-text="${artist.text}">
            <i class="bi bi-person"></i>
            <span>${artist.name}</span>
          </div>
        `;
      });
    }
    
    // 显示专辑建议
    if (suggestions.albums && suggestions.albums.length > 0) {
      html += '<div class="suggestion-category"><span>专辑</span></div>';
      suggestions.albums.forEach(album => {
        html += `
          <div class="suggestion-item" data-type="album" data-text="${album.text}">
            <i class="bi bi-disc"></i>
            <span>${album.title} - <small class="text-muted">${album.artist}</small></span>
          </div>
        `;
      });
    }
    
    if (html) {
      searchSuggestionsContainer.innerHTML = html;
      searchSuggestionsContainer.style.display = 'block';
      
      // 添加点击事件
      searchSuggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function() {
          const searchText = this.dataset.text;
          const searchType = this.dataset.type === 'hot' ? 'all' : this.dataset.type;
          
          searchInput.value = searchText;
          if (searchTypeSelect) {
            searchTypeSelect.value = searchType;
          }
          
          searchForm.submit();
        });
      });
    } else {
      searchSuggestionsContainer.innerHTML = '';
      searchSuggestionsContainer.style.display = 'none';
    }
  }
  
  // 加载高级搜索筛选器选项
  function loadSearchFilters() {
    fetch('/api/search-filters')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const filters = data.filters;
          
          // 设置流派选项
          if (genreFilter && filters.genres) {
            genreFilter.innerHTML = '<option value="">所有流派</option>';
            filters.genres.forEach(genre => {
              genreFilter.innerHTML += `<option value="${genre}">${genre}</option>`;
            });
          }
          
          // 设置语言选项
          if (languageFilter && filters.languages) {
            languageFilter.innerHTML = '<option value="">所有语言</option>';
            filters.languages.forEach(language => {
              languageFilter.innerHTML += `<option value="${language}">${language}</option>`;
            });
          }
          
          // 设置年份选项
          if (yearFilter && filters.years) {
            yearFilter.innerHTML = '<option value="">所有年份</option>';
            filters.years.forEach(year => {
              yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
            });
          }
          
          // 设置时长选项
          if (durationFilter && filters.durations) {
            durationFilter.innerHTML = '<option value="">所有时长</option>';
            filters.durations.forEach(duration => {
              durationFilter.innerHTML += `<option value="${duration.value}">${duration.label}</option>`;
            });
          }
          
          // 设置BPM选项
          if (bpmFilter && filters.bpmRanges) {
            bpmFilter.innerHTML = '<option value="">所有BPM</option>';
            filters.bpmRanges.forEach(bpm => {
              bpmFilter.innerHTML += `<option value="${bpm.value}">${bpm.label}</option>`;
            });
          }
        }
      })
      .catch(error => {
        console.error('加载搜索筛选器失败:', error);
      });
  }
  
  // 加载搜索历史
  function loadSearchHistory() {
    const savedHistory = localStorage.getItem('searchHistory');
    
    if (savedHistory && searchHistoryContainer) {
      const history = JSON.parse(savedHistory);
      
      if (history.length === 0) {
        searchHistoryContainer.innerHTML = '<p class="text-muted">暂无搜索历史</p>';
        return;
      }
      
      let html = '<div class="list-group">';
      history.forEach((item, index) => {
        html += `
          <a href="/search?query=${encodeURIComponent(item.query)}&type=all" 
             class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            <span>
              <i class="bi bi-clock-history me-2"></i>
              ${item.query}
            </span>
            <button class="btn btn-sm btn-link text-danger remove-history" data-index="${index}">
              <i class="bi bi-x"></i>
            </button>
          </a>
        `;
      });
      html += '</div>';
      
      searchHistoryContainer.innerHTML = html;
      
      // 添加删除单条历史记录的点击事件
      searchHistoryContainer.querySelectorAll('.remove-history').forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const index = parseInt(this.dataset.index);
          removeSearchHistoryItem(index);
        });
      });
    }
  }
  
  // 保存搜索历史
  function saveSearchHistory(query) {
    if (!query) return;
    
    let history = [];
    const savedHistory = localStorage.getItem('searchHistory');
    
    if (savedHistory) {
      history = JSON.parse(savedHistory);
    }
    
    // 检查是否已存在相同的查询
    const existingIndex = history.findIndex(item => item.query === query);
    
    if (existingIndex > -1) {
      // 将已存在的查询移到最前面
      history.splice(existingIndex, 1);
    }
    
    // 添加新查询到开头
    history.unshift({
      query,
      time: new Date().toISOString()
    });
    
    // 只保留最近的10条记录
    history = history.slice(0, 10);
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    
    // 刷新历史记录显示
    loadSearchHistory();
  }
  
  // 删除单条搜索历史
  function removeSearchHistoryItem(index) {
    const savedHistory = localStorage.getItem('searchHistory');
    
    if (savedHistory) {
      let history = JSON.parse(savedHistory);
      
      if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        localStorage.setItem('searchHistory', JSON.stringify(history));
        
        // 刷新历史记录显示
        loadSearchHistory();
      }
    }
  }
  
  // 清空搜索历史
  function clearSearchHistory() {
    localStorage.removeItem('searchHistory');
    
    if (searchHistoryContainer) {
      searchHistoryContainer.innerHTML = '<p class="text-muted">暂无搜索历史</p>';
    }
  }
  
  // 绑定事件
  if (searchInput) {
    // 输入框事件
    searchInput.addEventListener('input', function() {
      const query = this.value.trim();
      
      if (query) {
        fetchSuggestions(query);
        
        if (clearSearchButton) {
          clearSearchButton.style.display = 'block';
        }
      } else {
        searchSuggestionsContainer.innerHTML = '';
        searchSuggestionsContainer.style.display = 'none';
        
        if (clearSearchButton) {
          clearSearchButton.style.display = 'none';
        }
      }
    });
    
    // 聚焦时显示建议
    searchInput.addEventListener('focus', function() {
      const query = this.value.trim();
      if (query && query.length >= 2) {
        fetchSuggestions(query);
      }
    });
  }
  
  // 点击文档其他地方时隐藏搜索建议
  document.addEventListener('click', function(e) {
    if (!searchSuggestionsContainer.contains(e.target) && e.target !== searchInput) {
      searchSuggestionsContainer.style.display = 'none';
    }
  });
  
  // 清除搜索框内容
  if (clearSearchButton) {
    clearSearchButton.addEventListener('click', function() {
      searchInput.value = '';
      searchInput.focus();
      searchSuggestionsContainer.innerHTML = '';
      searchSuggestionsContainer.style.display = 'none';
      this.style.display = 'none';
    });
  }
  
  // 高级搜索面板切换
  if (advancedSearchToggle) {
    advancedSearchToggle.addEventListener('click', function() {
      if (advancedSearchPanel) {
        advancedSearchPanel.classList.toggle('show');
        
        // 切换图标
        const icon = this.querySelector('i');
        if (icon) {
          if (advancedSearchPanel.classList.contains('show')) {
            icon.classList.remove('bi-chevron-down');
            icon.classList.add('bi-chevron-up');
            this.querySelector('span').textContent = '收起高级搜索';
            
            // 加载筛选器选项
            loadSearchFilters();
          } else {
            icon.classList.remove('bi-chevron-up');
            icon.classList.add('bi-chevron-down');
            this.querySelector('span').textContent = '展开高级搜索';
          }
        }
      }
    });
  }
  
  // 清空搜索历史按钮
  if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', clearSearchHistory);
  }
  
  // 提交搜索表单时保存历史记录
  if (searchForm) {
    searchForm.addEventListener('submit', function() {
      const query = searchInput.value.trim();
      if (query) {
        saveSearchHistory(query);
      }
    });
  }
  
  // 加载搜索历史
  loadSearchHistory();
  
  // 如果URL中有查询参数，填充搜索表单
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get('query');
  const typeParam = urlParams.get('type');
  
  if (queryParam && searchInput) {
    searchInput.value = queryParam;
    
    if (clearSearchButton) {
      clearSearchButton.style.display = 'block';
    }
  }
  
  if (typeParam && searchTypeSelect) {
    searchTypeSelect.value = typeParam;
  }
  
  // 如果有高级搜索参数，展开高级搜索面板并设置筛选器
  const hasAdvancedFilters = urlParams.get('genre') || 
                            urlParams.get('language') || 
                            urlParams.get('year') || 
                            urlParams.get('duration') || 
                            urlParams.get('bpm');
  
  if (hasAdvancedFilters && advancedSearchToggle && advancedSearchPanel) {
    // 展开面板
    advancedSearchPanel.classList.add('show');
    
    // 更改切换按钮状态
    const icon = advancedSearchToggle.querySelector('i');
    if (icon) {
      icon.classList.remove('bi-chevron-down');
      icon.classList.add('bi-chevron-up');
      advancedSearchToggle.querySelector('span').textContent = '收起高级搜索';
    }
    
    // 加载筛选器选项并设置值
    loadSearchFilters();
    
    // 设置筛选器值
    setTimeout(() => {
      if (genreFilter && urlParams.get('genre')) {
        genreFilter.value = urlParams.get('genre');
      }
      
      if (languageFilter && urlParams.get('language')) {
        languageFilter.value = urlParams.get('language');
      }
      
      if (yearFilter && urlParams.get('year')) {
        yearFilter.value = urlParams.get('year');
      }
      
      if (durationFilter && urlParams.get('duration')) {
        durationFilter.value = urlParams.get('duration');
      }
      
      if (bpmFilter && urlParams.get('bpm')) {
        bpmFilter.value = urlParams.get('bpm');
      }
    }, 500);
  }
});