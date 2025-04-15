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
          
          // 显示成功消息
          alert('头像上传成功');
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
  
  // VIP开通表单
  const vipForm = document.getElementById('vip-form');
  
  if (vipForm) {
    vipForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      fetch('/user/vip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: document.querySelector('input[name="vip-plan"]:checked').value
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('恭喜您，VIP开通成功！');
          
          // 显示VIP到期时间
          const expiryDate = new Date(data.expiry);
          document.getElementById('vip-expiry').textContent = expiryDate.toLocaleDateString();
          
          // 显示VIP标识
          document.getElementById('vip-badge').style.display = 'inline-block';
          
          // 隐藏开通表单，显示续费表单
          document.getElementById('vip-purchase').style.display = 'none';
          document.getElementById('vip-renew').style.display = 'block';
        } else {
          alert(data.message || '开通失败');
        }
      })
      .catch(error => {
        console.error('开通失败:', error);
        alert('开通失败');
      });
    });
  }
});