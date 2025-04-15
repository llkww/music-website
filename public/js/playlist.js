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
  const addToPlaylistButtons = document.querySelectorAll('.btn-add-to-playlist');
  
  if (addToPlaylistButtons.length > 0) {
    addToPlaylistButtons.forEach(button => {
      button.addEventListener('click', function() {
        const songId = this.dataset.songId;
        const playlistSelect = document.getElementById('playlist-select');
        
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
              
              playlistSelect.innerHTML = html;
              
              // 显示添加到歌单模态框
              const addToPlaylistModal = new bootstrap.Modal(document.getElementById('add-to-playlist-modal'));
              addToPlaylistModal.show();
              
              // 设置歌曲ID
              document.getElementById('song-id').value = songId;
            } else {
              alert('您还没有创建歌单，请先创建歌单');
            }
          })
          .catch(error => {
            console.error('获取歌单失败:', error);
            alert('获取歌单失败');
          });
      });
    });
  }
  
  // 添加到歌单表单提交
  const addToPlaylistForm = document.getElementById('add-to-playlist-form');
  
  if (addToPlaylistForm) {
    addToPlaylistForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const playlistId = document.getElementById('playlist-select').value;
      const songId = document.getElementById('song-id').value;
      
      if (!playlistId) {
        alert('请选择歌单');
        return;
      }
      
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
          const modal = bootstrap.Modal.getInstance(document.getElementById('add-to-playlist-modal'));
          modal.hide();
        } else {
          alert(data.message || '添加失败');
        }
      })
      .catch(error => {
        console.error('添加失败:', error);
        alert('添加失败');
      });
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
            } else {
              alert(data.message || '移除失败');
            }
          })
          .catch(error => {
            console.error('移除失败:', error);
            alert('移除失败');
          });
        }
      });
    });
  }
  
  // 点赞/取消点赞歌单
  const likePlaylistButton = document.getElementById('like-playlist');
  
  if (likePlaylistButton) {
    likePlaylistButton.addEventListener('click', function() {
      const playlistId = this.dataset.playlistId;
      
      fetch(`/playlist/${playlistId}/like`, {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // 更新按钮状态
          if (data.liked) {
            this.innerHTML = '<i class="bi bi-heart-fill text-danger"></i> 已喜欢';
            this.classList.add('liked');
          } else {
            this.innerHTML = '<i class="bi bi-heart"></i> 喜欢';
            this.classList.remove('liked');
          }
          
          // 更新点赞数
          const likesCount = document.getElementById('likes-count');
          if (likesCount) {
            const count = parseInt(likesCount.textContent);
            likesCount.textContent = data.liked ? count + 1 : count - 1;
          }
        } else {
          alert(data.message || '操作失败');
        }
      })
      .catch(error => {
        console.error('操作失败:', error);
        alert('操作失败');
      });
    });
  }
});