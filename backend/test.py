#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试NiuTrans翻译器功能
"""

import os
import sys
import logging
from translator import NiuTranslator

# 配置日志
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_translator():
    """测试翻译器功能"""
    try:
        # 获取NiuTrans.SMT-master的根目录
        base_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(base_dir)
        
        # 设置配置文件路径 - 使用标准配置
        config_path = os.path.join(root_dir, 'config', 'NiuTrans.phrase.config')
        
        # 读取测试用例
        test_file = os.path.join(root_dir, 'sample-data', 'sample-submission-version', 'Test-set', 'Niu.test.txt')
        test_text = "Hello world, this is a test."  # 默认测试文本
        
        # 如果测试文件存在，读取第一行作为测试
        if os.path.exists(test_file):
            try:
                with open(test_file, 'r', encoding='utf-8') as f:
                    test_text = f.readline().strip()
                    logger.info(f"使用测试文件中的第一行: '{test_text}'")
            except Exception as e:
                logger.warning(f"读取测试文件失败: {e}")
                logger.info(f"使用默认测试文本: '{test_text}'")
        else:
            logger.warning(f"测试文件不存在: {test_file}")
            logger.info(f"使用默认测试文本: '{test_text}'")
            
        # 初始化翻译器
        logger.info(f"初始化翻译器，配置文件: {config_path}")
        translator = NiuTranslator(config_path)
        
        # 执行翻译
        logger.info(f"翻译文本: '{test_text}'")
        result = translator.translate(test_text)
        
        logger.info(f"翻译结果: '{result}'")
        return result
        
    except Exception as e:
        logger.error(f"翻译失败: {str(e)}")
        return f"翻译失败: {str(e)}"

if __name__ == "__main__":
    test_translator()