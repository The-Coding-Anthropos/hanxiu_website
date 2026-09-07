# 汉绣个人展示与变现网站

这是一个可直接运行的汉绣非遗风格网站示例，包含：

- 首页（精品作品展示、品牌故事）
- 汉绣作品集（分类展示、细节特写、创作视频、询价定制）
- 商城店铺（多类目、规格选择、联系管理员付款）
- 汉绣知识库（SEO 内容沉淀）
- 关于我/工作室（非遗传承、地址、师资）
- 留言/预约板块（定制预约、到店咨询、合作留言）
- 简易后台（内容管理、留言跟进、作品与商品维护）

## 1. 启动方式

```bash
npm install
npm start
```

默认启动地址：

- http://localhost:3000
- 管理后台：http://localhost:3000/admin.html

说明：前台页面已将“管理后台入口”统一放在网站底部（footer）。

## 2. 管理后台登录

后端使用请求头 `x-admin-token` 做简易鉴权。

默认 token：`change-me`

建议上线时设置环境变量：

```bash
export ADMIN_TOKEN="your-strong-token"
npm start
```

## 3. 数据与内容管理

- 内容和运营数据存储在 `data/content.json`
- 后台可编辑以下内容板块：
  - home
  - works
  - products
  - knowledge
  - about
  - stories

## 3.1 后台管理方式（详细，新手友好）

### A. 登录后台

1. 打开任意前台页面，滑到最底部，点击“管理后台入口”。
2. 输入管理员 Token（默认 `change-me`）。
3. 点击“登录后台”。
4. 登录后会看到顶部“选项卡”导航：概览、基础信息、留言跟进、作品管理、商城物品、知识库管理。

### B. 首页与关于我内容管理（不用改代码）

1. 在“1) 首页文案快捷编辑”中直接改文字。
2. 点击“保存首页文案”。
3. 在“2) 关于我快捷编辑”中修改简介、地址、师资。
4. 师资是一行一个名字。
5. 点击“保存关于我”。

### C. 留言预约跟进（状态管理）

1. 在“3) 留言预约跟进”查看姓名、电话、咨询内容。
2. 下拉选择状态：`new` / `in-progress` / `done`。
3. 点击“保存状态”。

### D. 作品集管理（新增 / 编辑 / 删除）

1. 在“5) 作品集管理”左侧点“编辑该作品”。
2. 右侧会自动带出作品信息。
3. 修改后点击“保存作品”。
4. 新增作品点“新建空白”，填完后点“保存作品”。
5. 删除作品点“删除当前”。
6. 资源管理支持本地上传：
   - 封面图：选择文件后点“上传并填入封面图”
   - 细节图：支持多张，每行一张；也可重复点击“上传并追加细节图”
   - 视频：选择文件后点“上传并填入视频地址”

### E. 商城物品管理（新增 / 编辑 / 删除）

1. 在“6) 商城物品管理”左侧选择物品。
2. 右侧修改名称、价格、运费、规格和图片链接。
3. 规格按“/”分隔，如 `40x60cm/60x90cm`。
4. 点击“保存物品”生效。
5. 新增点“新建空白”，删除点“删除当前”。
6. 商品图支持直接上传：选择文件后点“上传并填入商品图”。
7. 商品细节图支持多张：
   - 细节图链接框按“每行一张”填写
   - 或重复点击“上传并追加细节图”

### F. 汉绣知识库管理（新增 / 编辑 / 删除）

1. 点击顶部“知识库管理”选项卡。
2. 左侧选择文章，右侧编辑标题、标签、摘要。
3. 标签按“/”分隔，如 `针法教程/新手`。
4. 点击“保存文章”即可更新。
5. 新增点“新建空白”，删除点“删除当前”。

### G. 每日操作建议（给不熟悉电脑的管理者）

1. 先看顶部统计卡片，确认今天有多少新增订单和留言。
2. 先处理留言状态，再处理内容更新。
3. 最后再修改首页/关于页文案。
4. 每次保存后刷新前台页面检查效果。

### H. 安全与运维建议（必做）

- 把默认 Token `change-me` 改成高强度随机字符串。
- 仅在 HTTPS 下使用后台。
- 可在 Nginx 再加一层访问保护（IP 白名单或 Basic Auth）。
- 定期备份 `data/content.json`。

## 3.2 资源上传目录

- 所有后台上传文件会保存到 `public/uploads/`。
- 上传成功后会自动生成站内地址，例如 `/uploads/xxxx.jpg`。
- 网站前台会直接读取这些站内地址，不再依赖外部图床。
- 建议定期备份 `public/uploads/` 与 `data/content.json`。

## 4. 已实现业务能力

- 商城联系流程：商品页选择规格与数量 -> 点击“联系管理员付款” -> 跳转留言页自动带入商品信息 -> 管理员一对一确认支付与发货
- 留言预约：`POST /api/inquiries`

## 5. HTTPS / SSL 配置建议（生产）

当前 Node 服务为 HTTP。生产环境建议通过 Nginx 或 Caddy 反向代理并配置 SSL。

Nginx 示例：

```nginx
server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 6. 下一步扩展建议

- 对接真实支付（微信支付 / 支付宝 / Stripe）
- 接入数据库（MySQL / PostgreSQL）替代 JSON 文件
- 上传作品图与视频到对象存储（OSS/S3）
- 接入邮件服务（Resend/SendGrid）实现自动通知
- 为知识库增加文章详情页与 SEO 元信息
