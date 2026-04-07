# Samsung Electronics + SK hynix 在线实时价格看板（Vercel版）

## 文件说明
- `index.html`：前端页面
- `api/quotes.js`：服务端报价接口
- `vercel.json`：Vercel 配置
- `package.json`：项目说明

## 一键上线到 Vercel
### 方法一：网页上传
1. 打开 Vercel 控制台
2. 新建 Project
3. 选择导入这个项目文件夹
4. 直接 Deploy

### 方法二：命令行
```bash
npm i -g vercel
cd stock-board-vercel
vercel
```

## 上线后访问
- 首页：`https://你的域名/`
- 报价接口：`https://你的域名/api/quotes`

## 标的代码
- 三星电子：`005930.KS` / `005930:KRX`
- SK海力士：`000660.KS` / `000660:KRX`

## 说明
- 页面每 15 秒自动刷新
- 如果上游免费行情源变化，改 `api/quotes.js` 里的源地址即可
