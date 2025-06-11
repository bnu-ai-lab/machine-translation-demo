# Machine Translation Demo 

## Project Structure

- **frontend**  
  Development branch for the user interface components (HTML, CSS, JavaScript).
  Deployed on a device with a GUI display.

- **backend**  
  Development branch for the server-side code and NiuTrans integration.
  Deployed on a aliyun cloud server built in the previous lab.

## Quick Start

Use the provided `run.sh` script to start both frontend and backend services:

```bash
# Start with default NiuTrans paths
./run.sh

# Or specify custom paths for NiuTrans
./run.sh --decoder /path/to/NiuTrans.Decoder --config /path/to/config/file
```

After running the script:
- Backend will be available at: http://127.0.0.1:5000
- Frontend will be available at: http://ip_address:8000

Press Ctrl+C to stop all services.
