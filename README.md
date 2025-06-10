# Machine Translation Demo - Frontend

This repository contains the frontend components for the Machine Translation Demo project, which provides a web interface for translating text using the NiuTrans.SMT system.

## How to Run

1. **重要：修改服务器URL**
   在 `js/main.js` 文件的开头部分找到以下代码并修改：
   ```javascript
   // 全局变量 - 配置远程服务器URL
   // 请将以下地址替换为您的远程服务器地址和端口
   const API_BASE_URL = 'http://127.0.0.1:5000';
   ```
   将 `API_BASE_URL` 修改为您的阿里云服务器地址，例如：
   ```javascript
   const API_BASE_URL = 'http://your-aliyun-server-ip:5000';

   ```

2. Make sure the backend service is running (on the Aliyun cloud server)

3. 启动本地web服务器：
   ```bash
   # 进入frontend目录
   cd frontend
   
   # 使用Python启动简单的HTTP服务器
   python -m http.server
   ```

4. 在浏览器中访问 http://localhost:8000

5. 或者，您也可以直接在浏览器中打开 `index.html` 文件（但可能受到浏览器安全策略的限制）。
