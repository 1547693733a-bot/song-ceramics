# 可直接上传的视频生成素材

## 方形视频（推荐）

1. 首帧：`01-start-frame-square-1024.png`
2. 运动/材质参考：`02-cavity-motion-reference-square-1024.png`
3. 尾帧：`03-cizhou-end-frame-square-1024.png`

输出建议：1024×1024，3–4 秒，24 或 30fps。模型支持首尾帧时，将 01 指定为首帧、03 指定为尾帧，02 仅作为风格与运动参考。

## 竖屏视频

1. 首帧：`01-start-frame-portrait-720x1280.png`
2. 运动/材质参考：`02-cavity-motion-reference-square-1024.png`
3. 尾帧：`03-cizhou-end-frame-portrait-720x1280.png`

输出建议：720×1280，3–4 秒，24 或 30fps。

## 提示词

- `VIDEO_PROMPT_ZH.txt`：中文主提示词。
- `VIDEO_PROMPT_EN.txt`：英文主提示词。
- `NEGATIVE_PROMPT.txt`：中英文负面约束。

所有图片均已去除设备外框、页面文字、火焰和全景贴图边缘，不需要再次裁切。
