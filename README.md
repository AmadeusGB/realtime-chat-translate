# 实时语音翻译项目

这是一个基于 Next.js 的实时语音翻译项目，支持实时音频捕获和翻译功能。

## 环境要求

- MacBook (M1芯片)
- Node.js 18+
- pnpm 包管理器
- BlackHole 2ch 虚拟声卡

## 安装步骤

### 1. 安装虚拟声卡

1. 安装 BlackHole 2ch:
```bash
brew install blackhole-2ch
```

2. 在系统设置 > 声音中配置：
   - 输出设备选择 MacBook Pro 扬声器
   - 创建多输出设备，包含 BlackHole 2ch
   - 确保 BlackHole 2ch 在系统音频设备列表中可见

### 2. 安装项目依赖

```bash
# 安装 pnpm（如果未安装）
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 安装项目依赖
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：
```
OPENAI_API_KEY=你的OpenAI API密钥
```

## 开发运行

```bash
# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看应用。

## 音频设置说明

### 本地使用配置
1. 输入设备：选择 MacBook Pro 麦克风
2. 输出设备：选择 BlackHole 2ch
3. 系统声音输出：保持使用 MacBook Pro 扬声器

### 远程使用配置
1. 输入设备：选择 BlackHole 2ch
2. 输出设备：选择 MacBook Pro 扬声器
3. 确保远程应用有权限访问音频设备

## 生产环境部署

1. 构建生产版本：
```bash
pnpm build
```

2. 启动生产服务器：
```bash
pnpm start
```

## 常见问题

1. 没有声音输出？
   - 检查系统声音设置中的输入/输出设备配置
   - 确保 BlackHole 2ch 正确安装并启用

2. 远程连接问题？
   - 确认网络连接稳定
   - 检查浏览器是否允许音频访问权限

## 技术栈

- Next.js 15.1.4
- React 19.0.0
- WebRTC
- TailwindCSS

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。
