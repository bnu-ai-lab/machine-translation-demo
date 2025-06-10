# NiuTrans.SMT Web Service

## Directory Structure

- **frontend/**  
  Frontend code, including HTML, CSS, and JavaScript user interface
  - css/ - Style sheets
  - js/ - JavaScript scripts
  - index.html - Main page

- **backend/**  
  Backend code, including Flask API and NiuTrans interface
  - app.py - Flask application main program
  - test.py - Test script
  - decoding.log.txt - Decoding log file
  - requirements.txt - Dependencies list
  - tmp/ - Temporary files directory

- **backend_interface.md**  
  API documentation describing frontend-backend interaction

## Usage

1. Navigate to the backend directory: `cd backend`
2. Start the backend service: `python app.py`
3. Access the frontend page in browser: `frontend/index.html`

## Remote Deployment

If you need to deploy frontend and backend on different servers, modify the API_BASE_URL configuration in the frontend code:

```javascript
// Located in frontend/js/main.js
const API_BASE_URL = 'http://your-server-ip-or-domain:port';
```
