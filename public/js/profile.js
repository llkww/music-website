// profile.js (修改后)
document.addEventListener('DOMContentLoaded', function() {
  // 头像上传预览
  const avatarInput = document.getElementById('avatar-upload');
  const avatarPreview = document.getElementById('avatar-preview');
  
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          avatarPreview.src = e.target.result;
        };
        
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // 上传头像
  const avatarForm = document.getElementById('avatar-form');
  
  if (avatarForm) {
    avatarForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      
      fetch('/user/upload-avatar', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // 更新头像显示
          document.querySelectorAll('.user-avatar').forEach(img => {
            img.src = data.avatarPath;
          });
          
          // 更新导航栏头像
          document.querySelector('.navbar .avatar-sm').src = data.avatarPath;
          
          // 显示成功消息
          alert('头像上传成功');
          
          // 关闭模态框
          const modal = bootstrap.Modal.getInstance(document.getElementById('avatarModal'));
          if (modal) modal.hide();
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
});