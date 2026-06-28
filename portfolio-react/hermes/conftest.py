"""pytest 配置 — 确保 hermes 目录在 sys.path 中"""
import sys
import os

# 将 hermes 目录添加到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
