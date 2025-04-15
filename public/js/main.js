// 主题切换功能
document.addEventListener('DOMContentLoaded', function() {
  // 检查本地存储中的主题设置
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    document.getElementById('theme-toggle').innerHTML = '<i class="bi bi-sun"></i>';
  }
  
  // 主题切换按钮点击事件
  document.getElementById('theme-toggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    this.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
  });
  
  // 注册表单密码匹配验证
  const registerForm = document.querySelector('form[action="/auth/register"]');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm_password').value;
      
      if (password !== confirmPassword) {
        e.preventDefault();
        alert('两次输入的密码不一致');
      }
    });
  }
  
  // 搜索建议功能
  const searchInput = document.querySelector('input[name="query"]');
  if (searchInput) {
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      const query = this.value.trim();
      
      if (query.length > 1) {
        searchTimeout = setTimeout(function() {
          fetchSearchSuggestions(query);
        }, 300);
      }
    });
    
    function fetchSearchSuggestions(query) {
      fetch(`/api/search-suggestions?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
          // 处理搜索建议
          console.log(data);
        })
        .catch(error => {
          console.error('获取搜索建议失败:', error);
        });
    }
  }
  
  // 初始化工具提示
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});