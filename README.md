# Machine Translation Demo - Backend

Backend service for NiuTrans.SMT machine translation with API endpoints.

## NiuTrans Configuration

The following paths are configured in `app.py`:
```python
NIUTRANS_DECODER_PATH = "../../bin/NiuTrans.Decoder"
NIUTRANS_CONFIG_PATH = "../../work/config/NiuTrans.phrase.user.config"
```

Make sure these paths correctly point to your NiuTrans decoder and configuration files.

## Setup & Run

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the Flask application:
   ```bash
   python app.py
   ```

   The server runs at http://127.0.0.1:5000 by default.

## API Endpoints

- **/translate** (POST): Translates text
  - Request: `{"text": "text to translate"}`
  - Response: `{"translation": "translated text", "log": "decoding log"}`

- **/get_decoding_log** (GET): Gets latest decoding log
