# Fortress

一个把英语单词练习和像素塔防结合在一起的小项目。

## 在线试玩

- 试玩地址: [https://allennb666.github.io/Fortress/](https://allennb666.github.io/Fortress/)
- GitHub 仓库: [https://github.com/Allennb666/Fortress](https://github.com/Allennb666/Fortress)

## 项目简介

`Fortress` 的核心玩法是:

- 怪物会沿着多条路线逼近基地
- 每个怪物身上带着英文单词
- 玩家输入正确的中文翻译来击退怪物
- 漏掉的单词会进入错题本，后续可以专项练习

它不是传统塔防里“摆塔自动打怪”的模式，而是把打字、记单词和防守节奏结合到了一起，更像一个带战斗表现的词汇训练游戏。

## 主要特色

- 像素风界面和战斗反馈
- 简单 / 中等 / 困难 三档难度
- 自定义词库模式
- 错题本与错题练习模式
- 连击、冻结、清屏、秒杀等战斗机制
- 基于浏览器本地存储保存部分进度

## 本地运行

建议使用 Node.js `20.19.0` 或更高版本。

```bash
npm install
npm run dev
```

开发服务器默认会启动在:

```text
http://localhost:5173
```

如果你想本地预览生产构建:

```bash
npm run build
npm run preview
```

## 技术栈

- React
- Vite
- JavaScript
- GitHub Pages

## 仓库说明

- `src/App.jsx`: 游戏主逻辑与主要界面
- `src/gameData.js`: 单词数据、商店道具和基础配置
- `src/styles.css`: 视觉样式

## 部署

这个项目已经配置为通过 GitHub Actions 自动部署到 GitHub Pages。推送到 `main` 分支后，会自动重新发布站点。
