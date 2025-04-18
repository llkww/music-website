document.addEventListener('DOMContentLoaded', function() {
  // 评论相关元素
  const commentForm = document.getElementById('comment-form');
  const commentInput = document.getElementById('comment-input');
  const commentsList = document.getElementById('comments-list');
  const loadMoreButton = document.getElementById('load-more-comments');
  
  // 歌曲或歌单ID
  const contentId = commentForm ? commentForm.dataset.id : null;
  const contentType = commentForm ? commentForm.dataset.type : null; // song 或 playlist
  
  // 当前评论页
  let currentPage = 1;
  const pageSize = 10;
  
  // 调试信息
  console.log('评论组件初始化:', { contentId, contentType });
  
  // 加载评论
  function loadComments(page = 1, append = false) {
    if (!contentId || !contentType) return;
    
    const url = `/api/${contentType}/${contentId}/comments`;
    console.log('加载评论URL:', url);
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('评论加载成功:', data.comments.length);
          renderComments(data.comments, append);
          
          // 更新加载更多按钮状态
          if (loadMoreButton) {
            loadMoreButton.style.display = data.comments.length < pageSize ? 'none' : 'block';
          }
        } else {
          console.error('加载评论失败:', data.message);
        }
      })
      .catch(error => {
        console.error('加载评论失败:', error);
      });
  }
  
  // 渲染评论
  function renderComments(comments, append = false) {
    if (!commentsList) return;
    
    if (!append) {
      commentsList.innerHTML = '';
    }
    
    if (comments.length === 0 && !append) {
      commentsList.innerHTML = '<div class="text-center text-muted my-4">暂无评论，快来抢沙发吧！</div>';
      return;
    }
    
    let html = '';
    
    comments.forEach(comment => {
      // 格式化日期
      const date = new Date(comment.createdAt);
      const formattedDate = date.toLocaleDateString('zh-CN', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      html += `
        <div class="comment-item ${comment.isHot ? 'hot-comment' : ''}" id="comment-${comment._id}">
          <div class="comment-header">
            <div class="comment-user">
              <img src="${comment.user.avatar}" alt="${comment.user.username}" class="comment-avatar">
              <div>
                <div class="comment-username">${comment.user.username}</div>
                <div class="comment-time">${formattedDate}</div>
              </div>
            </div>
            ${comment.isHot ? '<span class="hot-tag"><i class="bi bi-fire"></i> 热门评论</span>' : ''}
          </div>
          <div class="comment-content">${comment.text}</div>
          <div class="comment-actions">
            <button class="btn btn-sm btn-link like-button" data-id="${comment._id}" data-type="comment">
              <i class="bi bi-heart${comment.liked ? '-fill text-danger' : ''}"></i> <span class="like-count">${comment.likes || 0}</span>
            </button>
            <button class="btn btn-sm btn-link reply-button" data-id="${comment._id}">
              <i class="bi bi-reply"></i> 回复
            </button>
          </div>
      `;
      
      // 添加回复
      if (comment.replies && comment.replies.length > 0) {
        html += '<div class="comment-replies">';
        
        comment.replies.forEach(reply => {
          const replyDate = new Date(reply.createdAt);
          const formattedReplyDate = replyDate.toLocaleDateString('zh-CN', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          html += `
            <div class="reply-item" id="reply-${reply._id}">
              <div class="reply-user">
                <img src="${reply.user.avatar}" alt="${reply.user.username}" class="reply-avatar">
                <div>
                  <div class="reply-username">${reply.user.username}</div>
                  <div class="reply-time">${formattedReplyDate}</div>
                </div>
              </div>
              <div class="reply-content">${reply.text}</div>
              <div class="reply-actions">
                <button class="btn btn-sm btn-link like-button" data-id="${reply._id}" data-type="reply">
                  <i class="bi bi-heart${reply.liked ? '-fill text-danger' : ''}"></i> <span class="like-count">${reply.likes || 0}</span>
                </button>
              </div>
            </div>
          `;
        });
        
        html += '</div>';
      }
      
      // 回复表单（默认隐藏）
      html += `
          <div class="reply-form-container" id="reply-form-${comment._id}" style="display: none;">
            <form class="reply-form" data-comment-id="${comment._id}">
              <div class="input-group">
                <input type="text" class="form-control reply-input" placeholder="回复 ${comment.user.username}...">
                <button type="submit" class="btn btn-primary">发送</button>
              </div>
            </form>
          </div>
        </div>
      `;
    });
    
    if (append) {
      commentsList.innerHTML += html;
    } else {
      commentsList.innerHTML = html;
    }
    
    // 绑定事件处理函数
    bindCommentEvents();
    console.log('评论渲染完成，已绑定事件');
  }
  
  // 绑定评论相关事件处理
  function bindCommentEvents() {
    // 绑定点赞事件
    const likeButtons = commentsList.querySelectorAll('.like-button');
    console.log(`找到 ${likeButtons.length} 个点赞按钮`);
    
    likeButtons.forEach(button => {
      button.removeEventListener('click', likeButtonHandler); // 避免重复绑定
      button.addEventListener('click', likeButtonHandler);
    });
    
    // 绑定回复按钮事件
    const replyButtons = commentsList.querySelectorAll('.reply-button');
    console.log(`找到 ${replyButtons.length} 个回复按钮`);
    
    replyButtons.forEach(button => {
      button.removeEventListener('click', replyButtonHandler); // 避免重复绑定
      button.addEventListener('click', replyButtonHandler);
    });
    
    // 绑定回复表单提交事件
    const replyForms = commentsList.querySelectorAll('.reply-form');
    console.log(`找到 ${replyForms.length} 个回复表单`);
    
    replyForms.forEach(form => {
      form.removeEventListener('submit', replyFormHandler); // 避免重复绑定
      form.addEventListener('submit', replyFormHandler);
    });
  }
  
  // 点赞按钮事件处理
  function likeButtonHandler() {
    const commentId = this.dataset.id;
    const type = this.dataset.type;
    console.log('点赞按钮点击:', { commentId, type });
    likeComment(commentId, type, this);
  }
  
  // 回复按钮事件处理
  function replyButtonHandler() {
    const commentId = this.dataset.id;
    console.log('回复按钮点击:', { commentId });
    
    const replyFormContainer = document.getElementById(`reply-form-${commentId}`);
    if (!replyFormContainer) {
      console.error('未找到回复表单容器:', `reply-form-${commentId}`);
      return;
    }
    
    // 隐藏所有其他回复表单
    document.querySelectorAll('.reply-form-container').forEach(container => {
      if (container.id !== `reply-form-${commentId}`) {
        container.style.display = 'none';
      }
    });
    
    // 切换当前回复表单显示状态
    replyFormContainer.style.display = replyFormContainer.style.display === 'none' ? 'block' : 'none';
    
    // 聚焦到输入框
    if (replyFormContainer.style.display === 'block') {
      replyFormContainer.querySelector('.reply-input').focus();
    }
  }
  
  // 回复表单提交事件处理
  function replyFormHandler(e) {
    e.preventDefault();
    
    const commentId = this.dataset.commentId;
    const replyInput = this.querySelector('.reply-input');
    const replyText = replyInput.value.trim();
    
    console.log('提交回复:', { commentId, text: replyText });
    
    if (replyText) {
      submitReply(commentId, replyText, this);
    }
  }
  
  // 点赞评论
  function likeComment(commentId, type, button) {
    if (!commentId) return;
    
    const url = `/api/${contentType}/${contentId}/comment/${commentId}/like`;
    console.log('点赞请求URL:', url);
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type })
    })
    .then(response => response.json())
    .then(data => {
      console.log('点赞响应:', data);
      
      if (data.success) {
        // 更新点赞数
        const likeCountEl = button.querySelector('.like-count');
        if (likeCountEl) {
          likeCountEl.textContent = data.likes;
        }
        
        // 切换按钮样式
        const icon = button.querySelector('i');
        if (data.liked) {
          button.classList.add('liked');
          if (icon) {
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
            icon.classList.add('text-danger');
          }
        } else {
          button.classList.remove('liked');
          if (icon) {
            icon.classList.remove('bi-heart-fill');
            icon.classList.remove('text-danger');
            icon.classList.add('bi-heart');
          }
        }
      } else {
        if (data.message === '请先登录') {
          alert('请先登录后再点赞');
        } else {
          console.error('点赞失败:', data.message);
        }
      }
    })
    .catch(error => {
      console.error('点赞请求失败:', error);
    });
  }
  
  // 提交评论
  function submitComment(text) {
    if (!contentId || !contentType || !text) return;
    
    const url = `/api/${contentType}/${contentId}/comment`;
    console.log('提交评论URL:', url);
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })
    .then(response => response.json())
    .then(data => {
      console.log('评论响应:', data);
      
      if (data.success) {
        // 清空输入框
        if (commentInput) {
          commentInput.value = '';
        }
        
        // 重新加载评论
        loadComments();
        
        // 滚动到评论区顶部
        if (commentsList) {
          commentsList.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        if (data.message === '请先登录') {
          alert('请先登录后再评论');
        } else {
          console.error('评论失败:', data.message);
        }
      }
    })
    .catch(error => {
      console.error('提交评论失败:', error);
    });
  }
  
  // 提交回复
  function submitReply(commentId, text, form) {
    if (!contentId || !contentType || !commentId || !text) return;
    
    const url = `/api/${contentType}/${contentId}/comment/${commentId}/reply`;
    console.log('提交回复URL:', url);
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })
    .then(response => response.json())
    .then(data => {
      console.log('回复响应:', data);
      
      if (data.success) {
        // 清空输入框
        form.querySelector('.reply-input').value = '';
        
        // 隐藏回复框
        const replyFormContainer = form.parentElement;
        replyFormContainer.style.display = 'none';
        
        // 添加新回复到DOM
        addReplyToDOM(commentId, data.reply);
      } else {
        if (data.message === '请先登录') {
          alert('请先登录后再回复');
        } else {
          console.error('回复失败:', data.message);
        }
      }
    })
    .catch(error => {
      console.error('提交回复失败:', error);
    });
  }
  
  // 添加新回复到DOM
  function addReplyToDOM(commentId, reply) {
    const commentEl = document.getElementById(`comment-${commentId}`);
    console.log('添加回复到DOM:', { commentId, reply });
    
    if (!commentEl) {
      console.error('未找到评论元素:', `comment-${commentId}`);
      return;
    }
    
    // 查找或创建回复容器
    let repliesContainer = commentEl.querySelector('.comment-replies');
    if (!repliesContainer) {
      repliesContainer = document.createElement('div');
      repliesContainer.className = 'comment-replies';
      
      // 插入到评论操作按钮后面
      const actionsEl = commentEl.querySelector('.comment-actions');
      if (actionsEl) {
        actionsEl.insertAdjacentElement('afterend', repliesContainer);
      } else {
        commentEl.appendChild(repliesContainer);
      }
    }
    
    // 格式化日期
    const date = new Date(reply.createdAt);
    const formattedDate = date.toLocaleDateString('zh-CN', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 创建回复元素
    const replyEl = document.createElement('div');
    replyEl.className = 'reply-item';
    replyEl.id = `reply-${reply._id}`;
    replyEl.innerHTML = `
      <div class="reply-user">
        <img src="${reply.user.avatar}" alt="${reply.user.username}" class="reply-avatar">
        <div>
          <div class="reply-username">${reply.user.username}</div>
          <div class="reply-time">${formattedDate}</div>
        </div>
      </div>
      <div class="reply-content">${reply.text}</div>
      <div class="reply-actions">
        <button class="btn btn-sm btn-link like-button" data-id="${reply._id}" data-type="reply">
          <i class="bi bi-heart"></i> <span class="like-count">0</span>
        </button>
      </div>
    `;
    
    // 添加到回复容器
    repliesContainer.appendChild(replyEl);
    
    // 绑定点赞事件
    const likeButton = replyEl.querySelector('.like-button');
    if (likeButton) {
      likeButton.addEventListener('click', function() {
        const replyId = this.dataset.id;
        likeComment(replyId, 'reply', this);
      });
    }
    
    // 滚动到新回复
    replyEl.scrollIntoView({ behavior: 'smooth' });
  }
  
  // 绑定评论表单提交事件
  if (commentForm) {
    commentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const text = commentInput.value.trim();
      if (text) {
        submitComment(text);
      }
    });
  }
  
  // 绑定加载更多按钮点击事件
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', function() {
      currentPage++;
      loadComments(currentPage, true);
    });
  }
  
  // 初始加载评论
  if (contentId && contentType && commentsList) {
    console.log('初始加载评论');
    loadComments();
  }
});