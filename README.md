# Machine Translation Demo - Backend

基于NiuTrans.SMT的机器翻译后端服务，提供翻译API接口。

## 配置说明

后端服务使用以下NiuTrans配置路径：
```python
NIUTRANS_DECODER_PATH = "../../bin/NiuTrans.Decoder"
NIUTRANS_CONFIG_PATH = "../../work/config/NiuTrans.phrase.user.config"
```

确保这些路径指向正确的NiuTrans解码器和配置文件。

## 依赖安装

安装所需的Python依赖：
```bash
pip install -r requirements.txt
```

## 如何运行

1. 确保NiuTrans.SMT工具已正确安装在上级目录中

2. 启动Flask服务：
   ```bash
   python app.py
   ```
   
3. 服务默认在 http://127.0.0.1:5000 启动

4. 可以通过修改app.py中的配置来更改服务器地址和端口：
   ```python
   if __name__ == '__main__':
       app.run(host='0.0.0.0', port=5000, debug=True)
   ```
   
   - 如果部署在阿里云服务器上，建议将host设置为'0.0.0.0'以允许外部访问
   - 根据需要调整端口号

## API接口

- **/translate** (POST): 接收待翻译文本，返回翻译结果
  - 请求体格式: `{"text": "要翻译的文本"}`
  - 返回格式: `{"translation": "翻译结果", "log": "解码日志"}`

- **/get_decoding_log** (GET): 获取最近一次翻译的解码日志
  - 返回格式: `{"log": "解码日志内容"}`
