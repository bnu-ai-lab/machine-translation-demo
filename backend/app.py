# app.py
from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import uuid # For unique temporary filenames
import re # Import regular expressions module
from flask_cors import CORS  # 导入CORS支持

app = Flask(__name__)
CORS(app)  # 启用CORS，允许所有域的跨域请求

# --- Configuration for NiuTrans ---
NIUTRANS_DECODER_PATH = "../../bin/NiuTrans.Decoder"
NIUTRANS_CONFIG_PATH = "../../work/config/NiuTrans.phrase.user.config"
TEMP_DIR = "./tmp/niutrans_temp" # A temporary directory for input/output files

# Create the temporary directory if it doesn't exist
os.makedirs(TEMP_DIR, exist_ok=True)

@app.route('/translate', methods=['POST'])
def translate_text():
    print("Received translate request")
    
    # 检查请求数据
    try:
        data = request.json
        print(f"Request data: {data}")
        
        if not data or 'text' not in data:
            print("Missing 'text' in request body")
            return jsonify({"error": "Missing 'text' in request body"}), 400

        source_text = data['text']
        print(f"Source text: {source_text}")
    except Exception as e:
        print(f"Error parsing request: {e}")
        return jsonify({"error": f"Error parsing request: {str(e)}"}), 400
        
    # 生成临时文件名
    unique_id = str(uuid.uuid4())
    input_file = os.path.join(TEMP_DIR, f"input_{unique_id}.txt")
    output_file = os.path.join(TEMP_DIR, f"output_{unique_id}.txt")
    
    try:
        # 1. 写入源文本到临时输入文件
        print(f"Writing source text to {input_file}")
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write(source_text)

        # 2. 构建NiuTrans命令
        command = [
            NIUTRANS_DECODER_PATH,
            "-decoding", input_file,
            "-config", NIUTRANS_CONFIG_PATH,
            "-output", output_file,
            "-outputoov", "1",
            "-nbest", "1",
            "-nthread", "4"
        ]

        print(f"Executing command: {' '.join(command)}")

        # 3. 执行NiuTrans.Decoder
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=True
            )
            print("NiuTrans STDOUT:", result.stdout)
            print("NiuTrans STDERR:", result.stderr)
        except FileNotFoundError:
            print(f"NiuTrans decoder not found at {NIUTRANS_DECODER_PATH}")
            return jsonify({"error": f"NiuTrans decoder not found at {NIUTRANS_DECODER_PATH}. Please check the path."}), 500
        except subprocess.CalledProcessError as e:
            print(f"NiuTrans command failed with exit code {e.returncode}")
            print(f"NiuTrans STDOUT: {e.stdout}")
            print(f"NiuTrans STDERR: {e.stderr}")
            return jsonify({"error": f"NiuTrans decoding failed. Error: {e.stderr}"}), 500

        # 4. 读取翻译结果
        if os.path.exists(output_file):
            print(f"Reading translation result from {output_file}")
            try:
                with open(output_file, 'r', encoding='utf-8') as f:
                    translated_text = f.read().strip()
                print(f"Translated text: {translated_text}")
                
                # 生成示例解码日志（如果NiuTrans没有生成）
                if not os.path.exists(DECODING_LOG_FILE):
                    print("Creating example decoding log")
                    with open(DECODING_LOG_FILE, 'w', encoding='utf-8') as f:
                        f.write("[0, 1]: <s> => <s>\n")
                        # 将源文本按空格分词并创建示例映射
                        words = source_text.split()
                        for i, word in enumerate(words):
                            f.write(f"[{i+1}, {i+2}]: {word} => {word}\n")
                        f.write(f"[{len(words)+1}, {len(words)+2}]: </s> => </s>\n")
                        f.write("================\n")
                
                return jsonify({"original_text": source_text, "translated_text": translated_text})
            except Exception as e:
                print(f"Error reading translation result: {e}")
                return jsonify({"error": f"Error reading translation result: {str(e)}"}), 500
        else:
            print("Output file not found after translation")
            return jsonify({"error": "Translation output file not found"}), 500

    except Exception as e:
        print(f"Unexpected error during translation: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
    finally:
        # 5. 清理临时文件
        print("Cleaning up temporary files")
        if os.path.exists(input_file):
            os.remove(input_file)
        if os.path.exists(output_file):
            os.remove(output_file)

# 使用绝对路径指定解码日志文件
DECODING_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "decoding.log.txt")

@app.route('/decoding_log', methods=['GET'])
def get_decoding_log_data():
    print(f"Received request for decoding log from file: {DECODING_LOG_FILE}")
    parsed_log = []
    try:
        if not os.path.exists(DECODING_LOG_FILE):
            print(f"Log file not found at {DECODING_LOG_FILE}")
            # 创建一个示例日志文件用于测试
            with open(DECODING_LOG_FILE, 'w', encoding='utf-8') as f:
                f.write("[0, 1]: <s> => <s>\n")
                f.write("[1, 2]: 测试 => Test\n")
                f.write("[2, 3]: 句子 => sentence\n")
                f.write("[3, 4]: </s> => </s>\n")
                f.write("================\n")
            print(f"Created test log file at {DECODING_LOG_FILE}")
            
        if not os.path.exists(DECODING_LOG_FILE):
            print(f"Log file {DECODING_LOG_FILE} still not found after creation attempt.")
            return jsonify({"error": f"Log file {DECODING_LOG_FILE} not found."}), 404

        with open(DECODING_LOG_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line == "================": # Skip empty lines or separators
                    continue
                
                match = re.match(r'^\[(\d+),\s*(\d+)\]:\s*(.*?)\s*=>\s*(.*)$', line)
                if match:
                    start_idx, end_idx, source_phrase, target_phrase = match.groups()
                    parsed_log.append({
                        "span": [int(start_idx), int(end_idx)], # The [start, end] word indices of the source phrase in the original source sentence.
                                                              # For example, [0, 1] could refer to the first word.
                        "source": source_phrase.strip(),      # The actual phrase/word from the source sentence corresponding to the span.
                        "target": target_phrase.strip()       # The translated phrase/word in the target language for the source phrase.
                    })
                else:
                    # Optionally log or handle lines that don't match
                    print(f"Skipping unparseable log line: {line}")
                    
        return jsonify({"log_data": parsed_log})
    except Exception as e:
        print(f"Error reading or parsing decoding log: {e}")
        return jsonify({"error": f"Error processing decoding log: {str(e)}"}), 500

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    return send_from_directory('../frontend', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) # debug=True is good for development