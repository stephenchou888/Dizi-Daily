# 中国竹笛每日练习与指法追踪 (Dizi Daily)

[![CI](https://github.com/stephenchou888/Dizi-Daily/actions/workflows/ci.yml/badge.svg)](https://github.com/stephenchou888/Dizi-Daily/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/stephenchou888/Dizi-Daily/actions/workflows/deploy.yml/badge.svg)](https://github.com/stephenchou888/Dizi-Daily/actions/workflows/deploy.yml)

在线体验地址：**https://stephenchou888.github.io/Dizi-Daily/**

参考 [Saxophone-Daily](https://github.com/stephenchou888/Saxophone-Daily) 的 React + TypeScript + Vite 架构与响应式练习界面打造。保留竹笛专属的曲笛 / 梆笛调性、筒音转调指法、半孔查指法与笛膜音色，同时提供五线谱视奏、节拍跟练、每日打卡和浅色 / 深色模式。

## 核心功能

- **四大常用竹笛调性一键切换**：
  - **D调曲笛**（第三孔 `1 = D5`，江南丝竹与初学首选）
  - **C调大曲笛**（第三孔 `1 = C5`，浑厚悠远、记谱实音）
  - **F调中音梆笛**（第三孔 `1 = F5`，南北兼修）
  - **G调北派梆笛**（第三孔 `1 = G5`，高亢清脆）
- **28 套竹笛核心指法与每日轮换曲库**：
  - **7 套常用筒音转调系统**：筒音作 5、筒音作 2、筒音作 1、筒音作 6、筒音作 3、筒音作 4、筒音作 ♭7
  - **7 项竹笛气功与绝技特训**：三度音区八度大跳（缓吹/平吹/急吹）、极高音超吹与泛音冲顶（`6̇` / `7̇` / `1̈` 叉口指法）、江南丝竹行腔（叠/打/赠音）、北派梆笛吐音与历音、气震音与指震音、十二半音阶全半孔特训、五声与三和弦大跳琶音
  - **8 套中国传统五声与古典七声调式**：宫、商、角、徵、羽五声调式，雅乐（`#4` 变徵）、清乐（`4` 清角）、燕乐（`4` 清角 + `♭7` 闰）七声音阶
  - **6 套通用大调与小调五线谱视奏**
- **双模式竹笛六孔指法图 & 交互式「查指法」反查器**：
  - 支持 **教学示意图**、**拟真苦竹/紫竹笛图（含吹孔、芦苇笛膜、双插铜套、牛角笛头与中国结红穗）** 以及 **双图同屏对比**
  - 完整支持 **全按闭孔 (`●`)**、**半孔按法 (`◐`)**、**开放音孔 (`○`)** 三态切换与 **缓吹/平吹/急吹/超吹** 同孔位泛音列一键切换
- **Web Audio 竹笛物理建模合成器与节拍器**：
  - 内置竹管驻波 + **芦苇笛膜 (`Dimo`) 高次谐波共鸣** + **吹孔气声 (`Chiff`)** + **自然腹震音 (`Vibrato`)** + **木鱼/梆子节拍器**
- **每日练笛打卡热力图 (`StreakCard`)** 与 **单音风门/口风/防漏气指导卡片 (`PracticeTipsCard`)**
- **统一演奏控制**：静音统一控制竹笛音色、按孔音与节拍器；主题默认跟随系统并可手动切换。

## 本地开发与构建

需要 Node.js 22。

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
```
