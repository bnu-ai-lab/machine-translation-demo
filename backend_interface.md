# NiuTrans 翻译服务 API 文档

本文档描述了 NiuTrans 翻译服务的可用 API 接口。

## 基础 URL

所有 API 请求都应基于运行 Flask 应用的服务器地址和端口。默认情况下，开发环境的 URL 为 `http://localhost:5000`。

## 接口列表

1.  **文本翻译 (`/translate`)**
2.  **获取解码日志 (`/decoding_log`)**

---

## 1. 文本翻译 (`/translate`)

此接口用于将源语言文本翻译成目标语言文本。

*   **URL:** `/translate`
*   **HTTP 方法:** `POST`
*   **请求头 (Request Headers):**
    *   `Content-Type: application/json`
*   **请求体 (Request Body):**
    发送一个 JSON 对象，包含待翻译的文本。
    ```json
    {
      "text": "要翻译的源语言句子或段落。"
    }
    ```
    *   [text](cci:1://file:///home/ubuntu/lsh/NLP/project/NiuTrans.SMT-master/NiuTrans.SMT-master/web_service/app.py:17:0-85:34) (string, 必需): 需要翻译的文本字符串。

*   **响应 (Responses):**

    *   **成功 (200 OK):**
        返回一个 JSON 对象，包含原始文本和翻译后的文本。
        ```json
        {
          "original_text": "输入的原始文本",
          "translated_text": "翻译后的目标语言文本"
        }
        ```

    *   **错误 - 请求无效 (400 Bad Request):**
        如果请求体中缺少 [text](cci:1://file:///home/ubuntu/lsh/NLP/project/NiuTrans.SMT-master/NiuTrans.SMT-master/web_service/app.py:17:0-85:34) 字段。
        ```json
        {
          "error": "Missing 'text' in request body"
        }
        ```

    *   **错误 - 服务器内部错误 (500 Internal Server Error):**
        可能由于多种原因导致，例如解码器路径不正确、解码过程中出错等。
        ```json
        {
          "error": "具体的错误描述信息，例如：NiuTrans decoder not found at <path>."
        }
        ```
        或者
        ```json
        {
          "error": "NiuTrans decoding failed. Error: <解码器标准错误输出>"
        }
        ```
        或者
        ```json
        {
          "error": "An unexpected error occurred: <具体异常信息>"
        }
        ```

*   **示例请求 (cURL):**
    ```bash
    curl -X POST \
         -H "Content-Type: application/json" \
         -d '{"text": "This is a test sentence."}' \
         http://localhost:5000/translate
    ```

*   **示例成功响应:**
    ```json
    {
      "original_text": "This is a test sentence.",
      "translated_text": "is This a sentence. test"
    }
    ```

---

## 2. 获取解码日志 (`/decoding_log`)

此接口用于获取最近一次 `/translate` 请求后生成的 `decoding.log.txt` 文件内容的序列化数据。该日志包含了短语级别的翻译对应关系，可用于前端可视化展示。

*   **URL:** `/decoding_log`
*   **HTTP 方法:** `GET`
*   **请求参数:** 无

*   **响应 (Responses):**

    *   **成功 (200 OK):**
        返回一个 JSON 对象，其中 [log_data](cci:1://file:///home/ubuntu/lsh/NLP/project/NiuTrans.SMT-master/NiuTrans.SMT-master/web_service/app.py:89:0-118:82) 键对应一个数组，数组中的每个元素代表日志中的一行解析数据。
        ```json
        {
          "log_data": [
            {
              "span": [0, 1],
              "source": "<s>",
              "target": "<s>"
            },
            {
              "span": [2, 3],
              "source": "is",
              "target": "is"
            },
            // ... 更多日志条目
          ]
        }
        ```
        **字段说明:**
        *   `span` (array of integers): 源短语在原始输入句子中基于词的起止索引 `[start_index, end_index]`。例如, `[0, 1]` 可能指第一个词。
        *   `source` (string): 对应 `span` 的源语言中的实际短语/词。
        *   `target` (string): 针对该源短语，在目标语言中翻译得到的短语/词。

    *   **错误 - 文件未找到 (404 Not Found):**
        如果 `decoding.log.txt` 文件不存在（例如，在 `/translate` 接口被调用之前）。
        ```json
        {
          "error": "Log file decoding.log.txt not found."
        }
        ```

    *   **错误 - 服务器内部错误 (500 Internal Server Error):**
        读取或解析日志文件时发生错误。
        ```json
        {
          "error": "Error processing decoding log: <具体异常信息>"
        }
        ```

*   **示例请求 (cURL):**
    ```bash
    curl http://localhost:5000/decoding_log
    ```

*   **示例成功响应:**
    ```json
    {
      "log_data": [
        {
          "span": [0, 1],
          "source": "<s>",
          "target": "<s>"
        },
        {
          "span": [2, 3],
          "source": "is",
          "target": "is"
        },
        {
          "span": [1, 2],
          "source": "This",
          "target": "This"
        },
        {
          "span": [4, 5],
          "source": "test",
          "target": "test"
        },
        {
          "span": [3, 4],
          "source": "a",
          "target": "a"
        },
        {
          "span": [5, 6],
          "source": "sentence.",
          "target": "sentence."
        },
        {
          "span": [6, 7],
          "source": "</s>",
          "target": "</s>"
        }
      ]
    }
    ```

**注意:**
*   `/decoding_log` 接口返回的是**最近一次** `/translate` 调用产生的日志。如果希望每次翻译都获取对应的日志，前端应在调用 `/translate` 成功后立即调用 `/decoding_log`。
*   `decoding.log.txt` 文件会在每次 `/translate` 请求后被覆盖或重新生成。