#!/bin/bash

# Default paths for NiuTrans configuration
DECODER_PATH="../bin/NiuTrans.Decoder"
CONFIG_PATH="../work/config/NiuTrans.phrase.user.config"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --decoder)
            DECODER_PATH="$2"
            shift 2
            ;;
        --config)
            CONFIG_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Export environment variables for backend
export NIUTRANS_DECODER_PATH="$DECODER_PATH"
export NIUTRANS_CONFIG_PATH="$CONFIG_PATH"

# Start backend server
echo "Starting backend server..."
cd backend
pip install -r requirements.txt
python app.py > >(tee /dev/tty) 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
cd ../frontend
python -m http.server 8000 --bind 0.0.0.0 &
FRONTEND_PID=$!

# Get IP address
IP_ADDR=$(hostname -I | awk '{print $1}')

echo "Services started:"
echo "Frontend running at: http://${IP_ADDR}:8000"
echo "Press Ctrl+C to stop all services"

# Handle shutdown gracefully
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# Wait for both processes
wait
