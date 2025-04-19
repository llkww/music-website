document.addEventListener('DOMContentLoaded', function() {
  // 创建歌单表单
  const createPlaylistForm = document.getElementById('create-playlist-form');
  
  if (createPlaylistForm) {
    createPlaylistForm.addEventListener('submit', function(e) {
      // 表单验证
      const playlistName = document.getElementById('playlist-name').value.trim();
      
      if (!playlistName) {
        e.preventDefault();
        alert('请输入歌单名称');
      }
    });
  }
  
  // 歌单封面上传预览
  const coverInput = document.getElementById('cover-upload');
  const coverPreview = document.getElementById('cover-preview');
  
  if (coverInput && coverPreview) {
    coverInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          coverPreview.src = e.target.result;
        };
        
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // 上传歌单封面
  const coverForm = document.getElementById('cover-form');
  
  if (coverForm) {
    coverForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const playlistId = this.dataset.playlistId;
      const formData = new FormData(this);
      
      fetch(`/playlist/${playlistId}/upload-cover`, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // 更新封面显示
          document.querySelectorAll('.playlist-cover').forEach(img => {
            img.src = data.coverPath;
          });
          
          // 显示成功消息
          alert('封面上传成功');
        } else {
          alert(data.message || '上传失败');
        }
      })
      .catch(error => {
        console.error('上传失败:', error);
        alert('上传失败');
      });
    });
  }
  
  // 添加歌曲到歌单
  function initAddToPlaylistButtons() {
    const addToPlaylistButtons = document.querySelectorAll('.btn-add-to-playlist');
    
    if (addToPlaylistButtons.length > 0) {
      addToPlaylistButtons.forEach(button => {
        // 移除之前可能存在的事件监听器，避免重复绑定
        button.removeEventListener('click', addToPlaylistHandler);
        button.addEventListener('click', addToPlaylistHandler);
      });
    }
  }
  
  // 添加到歌单的处理函数
  function addToPlaylistHandler() {
    const songId = this.dataset.songId;
    
    if (!songId) {
      console.error('添加歌曲到歌单失败：缺少歌曲ID');
      alert('添加失败：无法获取歌曲信息');
      return;
    }
    
    console.log('添加歌曲到歌单, 歌曲ID:', songId);
    
    // 获取用户的歌单列表
    fetch('/api/user-playlists')
      .then(response => response.json())
      .then(data => {
        if (data.playlists && data.playlists.length > 0) {
          // 创建歌单选择下拉框
          let html = '<option value="">选择歌单</option>';
          data.playlists.forEach(playlist => {
            html += `<option value="${playlist._id}">${playlist.name}</option>`;
          });
          
          const playlistSelect = document.getElementById('playlist-select');
          if (playlistSelect) {
            playlistSelect.innerHTML = html;
          } else {
            console.error('未找到歌单选择下拉框元素');
            return;
          }
          
          // 设置歌曲ID
          const songIdInput = document.getElementById('song-id');
          if (songIdInput) {
            songIdInput.value = songId;
          } else {
            console.error('未找到歌曲ID输入框元素');
            return;
          }
          
          // 显示添加到歌单模态框
          const addToPlaylistModal = document.getElementById('add-to-playlist-modal');
          if (addToPlaylistModal) {
            // 确保使用Bootstrap的Modal实例
            if (typeof bootstrap !== 'undefined') {
              const modalInstance = new bootstrap.Modal(addToPlaylistModal);
              modalInstance.show();
            } else {
              console.error('Bootstrap未定义，无法初始化模态框');
              alert('页面加载不完整，请刷新后重试');
            }
          } else {
            console.error('未找到添加到歌单模态框元素');
            alert('页面元素缺失，无法添加歌曲到歌单');
          }
        } else {
          alert('您还没有创建歌单，请先创建歌单');
        }
      })
      .catch(error => {
        console.error('获取歌单失败:', error);
        alert('获取歌单失败，请稍后再试');
      });
  }
  
  // 添加到歌单表单提交
  const addToPlaylistForm = document.getElementById('add-to-playlist-form');
  
  if (addToPlaylistForm) {
    // 移除之前可能存在的事件监听器，避免重复绑定
    addToPlaylistForm.removeEventListener('submit', addToPlaylistFormHandler);
    addToPlaylistForm.addEventListener('submit', addToPlaylistFormHandler);
  }
  
  // 表单提交处理函数
  function addToPlaylistFormHandler(e) {
    e.preventDefault();
    
    const playlistSelect = document.getElementById('playlist-select');
    const songIdInput = document.getElementById('song-id');
    
    if (!playlistSelect || !songIdInput) {
      console.error('表单元素缺失');
      alert('操作失败：页面元素缺失');
      return;
    }
    
    const playlistId = playlistSelect.value;
    const songId = songIdInput.value;
    
    if (!playlistId) {
      alert('请选择歌单');
      return;
    }
    
    if (!songId) {
      alert('未找到歌曲信息');
      return;
    }
    
    console.log('提交添加歌曲请求:', { playlistId, songId });
    
    fetch('/playlist/add-song', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playlistId, songId })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('添加成功');
        
        // 关闭模态框
        const addToPlaylistModal = document.getElementById('add-to-playlist-modal');
        if (addToPlaylistModal) {
          // 使用Bootstrap的Modal实例关闭模态框
          if (typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(addToPlaylistModal);
            if (modalInstance) {
              modalInstance.hide();
            } else {
              // 如果获取不到实例，尝试直接关闭
              $(addToPlaylistModal).modal('hide');
            }
          } else {
            // 后备方案，直接触发点击事件
            const closeButton = addToPlaylistModal.querySelector('[data-bs-dismiss="modal"]');
            if (closeButton) {
              closeButton.click();
            }
          }
        }
      } else {
        alert(data.message || '添加失败');
      }
    })
    .catch(error => {
      console.error('添加失败:', error);
      alert('添加失败，请稍后再试');
    });
  }
  
  // 从歌单中移除歌曲
  const removeFromPlaylistButtons = document.querySelectorAll('.btn-remove-from-playlist');
  
  if (removeFromPlaylistButtons.length > 0) {
    removeFromPlaylistButtons.forEach(button => {
      button.addEventListener('click', function() {
        if (confirm('确定从歌单中移除此歌曲?')) {
          const playlistId = this.dataset.playlistId;
          const songId = this.dataset.songId;
          
          fetch(`/playlist/${playlistId}/song/${songId}`, {
            method: 'DELETE'
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // 移除歌曲行
              this.closest('tr').remove();
              
              // 如果没有歌曲了，显示空状态
              const tableBody = document.querySelector('tbody');
              if (tableBody && tableBody.children.length === 0) {
                const tableContainer = tableBody.closest('.table-responsive');
                if (tableContainer) {
                  tableContainer.innerHTML = `
                    <div class="text-center py-5">
                      <i class="bi bi-music-note-list display-1 text-muted"></i>
                      <p class="mt-3">这个歌单还没有歌曲</p>
                      <a href="/search?type=song" class="btn btn-primary">
                        <i class="bi bi-plus-lg"></i> 添加歌曲
                      </a>
                    </div>
                  `;
                }
              }
              
              // 更新歌曲数量显示
              const songCountEl = document.querySelector('.playlist-info p:nth-child(2)');
              if (songCountEl) {
                const currentCount = parseInt(songCountEl.textContent.match(/\d+/)[0]) - 1;
                songCountEl.innerHTML = `<strong>歌曲数:</strong> ${currentCount}`;
              }
            } else {
              alert(data.message || '移除失败');
            }
          })
          .catch(error => {
            console.error('移除失败:', error);
            alert('移除失败，请稍后再试');
          });
        }
      });
    });
  }
  
  // 初始化添加到歌单按钮
  initAddToPlaylistButtons();
  
  // 当DOM内容发生变化时，检查是否有新添加的按钮需要绑定事件
  const observer = new MutationObserver(() => {
    initAddToPlaylistButtons();
  });
  
  // 监听文档内容变化
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 确保模态框点取消按钮能正确关闭
  document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal && typeof bootstrap !== 'undefined') {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
          modalInstance.hide();
        }
      }
    });
  });
  
  // 模态框背景点击关闭
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      // 只有点击模态框背景时才关闭
      if (e.target === this) {
        const modalInstance = bootstrap.Modal.getInstance(this);
        if (modalInstance) {
          modalInstance.hide();
        }
      }
    });
  });
});