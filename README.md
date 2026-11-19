# Book Manager：Express + EJS + Mongoose 教学示例

这是一个可以独立运行的课堂示例，演示以下技术如何组合：

- Express 4：Web 服务器与路由
- EJS：服务端渲染页面
- Mongoose + MongoDB：数据模型和增删改查
- `cookie-session`：登录后的会话
- 服务端固定账号：不注册、不建立 User 集合
- MVC：`Model -> Controller -> View` 分层
- REST API：`GET/POST/PUT/DELETE /api/books`

> 这是教学代码。账号密码直接写在 `config/users.js` 中，仅用于课堂演示，
> 不应把这种明文密码方案用于真实系统。

## 1. 项目结构

```text
example-bookmanager/
|-- server.js                     # 应用入口
|-- seed.js                       # 插入示例图书
|-- package.json                  # 依赖和 npm 命令
|-- package-lock.json             # 锁定依赖版本
|-- .env.example                  # 环境变量模板
|-- .gitignore
|-- config/
|   `-- users.js                  # 服务端提供的固定账号
|-- models/
|   `-- Book.js                   # Mongoose 数据模型
|-- controllers/
|   |-- authController.js         # 登录/退出逻辑
|   |-- bookController.js         # EJS 页面的 CRUD 控制器
|   `-- apiBookController.js      # JSON REST API 控制器
|-- middleware/
|   |-- async-handler.js          # 把 async 错误交给 Express
|   |-- require-auth.js           # 页面登录保护
|   `-- error-handler.js          # 页面/API 统一错误处理
|-- routes/
|   |-- authRoutes.js
|   |-- webBookRoutes.js
|   `-- apiBookRoutes.js
|-- views/
|   |-- login.ejs
|   |-- not-found.ejs
|   |-- error.ejs
|   |-- partials/
|   |   |-- header.ejs
|   |   |-- footer.ejs
|   |   `-- errors.ejs
|   `-- books/
|       |-- index.ejs
|       |-- show.ejs
|       |-- new.ejs
|       |-- edit.ejs
|       `-- _form.ejs
`-- public/
    `-- styles.css
```

## 2. MVC 与一次请求的流程

页面请求的流程是：

```text
浏览器
  -> routes/webBookRoutes.js        URL 匹配
  -> middleware/require-auth.js     检查 session
  -> controllers/bookController.js  执行业务逻辑
  -> models/Book.js                 查询/保存 MongoDB
  -> views/books/*.ejs              生成 HTML
  -> 浏览器
```

REST API 请求的流程是：

```text
curl / 前端程序
  -> routes/apiBookRoutes.js
  -> controllers/apiBookController.js
  -> models/Book.js
  -> MongoDB
  -> JSON 响应
```

`routes` 只做 URL 映射，`controllers` 负责流程，`models` 负责数据结构，
`views` 只负责显示。这就是本示例采用的 MVC 分层。

## 3. 登录和 cookie-session 是怎么工作的

1. 用户打开 `GET /login`，看到登录表单。
2. 表单提交到 `POST /login`。
3. `authController.login` 调用 `config/users.js` 中的 `findUser()`，
   直接在服务端固定账号列表里比对用户名和密码。
4. 登录成功后执行：

   ```js
   req.session.user = {
     username: user.username,
     displayName: user.displayName,
   };
   ```

5. `cookie-session` 会把 `req.session` 序列化进 `bookmanager.sid` Cookie，
   并生成 `bookmanager.sid.sig` 保存签名；服务器用 `SESSION_SECRET` 验证签名。
6. 后续请求携带该 Cookie。服务器验证签名后，`req.session.user` 又有值，
   `requireAuth` 就允许访问 `/books` 页面。
7. `POST /logout` 执行 `req.session = null`，浏览器中的会话 Cookie 被清除。

这里没有注册功能，也没有 `users` 集合。账号由服务器代码提供，MongoDB
只保存图书数据。需要注意：`cookie-session` 的 Cookie 是**签名**的，不是
**加密**的，所以里面只应放用户名、显示名这类非敏感信息，绝不能放密码。

## 4. Web 页面路由

| 方法 | URI | 作用 |
|---|---|---|
| GET | `/login` | 显示登录页 |
| POST | `/login` | 检查固定账号并建立 session |
| POST | `/logout` | 清除 session |
| GET | `/books` | 图书列表 |
| GET | `/books/new` | 新增表单 |
| POST | `/books` | 创建图书 |
| GET | `/books/:id` | 图书详情 |
| GET | `/books/:id/edit` | 编辑表单 |
| POST | `/books/:id/update` | 保存修改 |
| POST | `/books/:id/delete` | 删除图书 |

HTML 表单原生只支持 GET 和 POST，因此页面中的“更新”和“删除”使用 POST。
真正的 REST 风格由下面的 `/api` 路由演示。

## 5. REST API 路由

| 方法 | URI | 成功状态码 | 作用 |
|---|---|---|---|
| GET | `/api/books` | 200 | 获取全部图书 |
| GET | `/api/books/:id` | 200 | 获取一本图书 |
| POST | `/api/books` | 201 | 新建图书 |
| PUT | `/api/books/:id` | 200 | 完整更新图书 |
| DELETE | `/api/books/:id` | 204 | 删除图书 |

REST API 按课程要求不检查页面登录 session。JSON 请求体示例：

```json
{
  "title": "Node.js in Action",
  "author": "Alex Young",
  "year": 2017,
  "category": "Technology",
  "available": true
}
```

`PUT` 被视为“完整替换可编辑字段”，所以 `title`、`author`、`year`、
`category` 都要重新提供；`available` 可以省略。
## 6. 每个文件的代码讲解

### `server.js`：应用入口

- 先执行 `require('dotenv').config()`，这样后面的 `process.env.*` 能读到 `.env`。
- 设置 EJS：`app.set('view engine', 'ejs')` 和 `app.set('views', ...)`。
- `express.static` 提供 `public/styles.css`。
- `express.urlencoded()` 解析 HTML 表单，`express.json()` 解析 REST API 的 JSON。
- 注册 `cookie-session`：

  ```js
  app.use(cookieSession({
    name: 'bookmanager.sid',
    keys: [process.env.SESSION_SECRET],
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
  }));
  ```

  `httpOnly` 防止页面 JavaScript 读取 Cookie；`sameSite: 'lax'` 降低跨站请求风险；
  `secure: false` 是因为 Ubuntu 本地测试使用 `http://localhost`。
- 中间件把 `req.session.user` 放进 `res.locals.currentUser`，所有 EJS 页面都能使用。
- 挂载顺序很重要：先 `/api`，再登录路由，再受保护的 Web 路由，最后 404 和错误处理。
- 只有 MongoDB 连接成功后才 `app.listen`，避免数据库没连上却开始接请求。

### `config/users.js`：服务器提供的固定账号

- `users` 数组就是课程所说的 server-provided user database。
- `findUser(username, password)` 做直接比对，成功返回用户对象，失败返回 `null`。
- 这里故意没有连接 MongoDB，也没有 `User` 模型，因为账号不是注册出来的。
- 真实项目应使用密码哈希（例如 bcrypt），这里为课堂演示保留明文。

### `models/Book.js`：Mongoose 数据模型

- `title`、`author`：必填字符串，保存前自动去掉首尾空格。
- `year`：数字，限制在 1000 到 2100。
- `category`：只能是 `Fiction`、`Science`、`History`、`Technology` 之一。
- `available`：布尔值，默认 `true`。
- `collection: 'books'` 固定集合名；`timestamps: true` 自动添加 `createdAt` 和 `updatedAt`。
- 导出 `Book` 模型和 `CATEGORIES`，让控制器和 EJS 表单共用同一份类别列表。

### `middleware/async-handler.js`

Express 4 不会自动捕获 async 函数中抛出的 Promise rejection，所以这个包装器把错误
转交给 `next(error)`，之后由统一错误处理中间件处理。

### `middleware/require-auth.js`

检查 `req.session.user`：

- 有值：`next()`，允许进入受保护页面。
- 没有值：重定向到 `/login`。

### `middleware/error-handler.js`

- Mongoose 的 `ValidationError` 和 `CastError` 返回 400。
- `/api` 请求返回 JSON，例如：

  ```json
  {
    "error": "Validation failed.",
    "details": ["Title is required."]
  }
  ```

- 页面请求渲染 `views/error.ejs`。
- 500 错误不把内部错误细节暴露给用户，只打印在服务器终端。

### `controllers/authController.js`

- `showLogin`：已登录用户直接跳 `/books`，否则显示登录表单。
- `login`：从 `req.body` 取用户名和密码，调用 `findUser()`。
- 登录成功只把 `username` 和 `displayName` 放进 session，不保存密码。
- 登录成功后固定重定向到 `/books`。
- `logout`：把 `req.session` 设为 `null`，`cookie-session` 会清除浏览器 Cookie。

### `controllers/bookController.js`：页面 CRUD 控制器

- `list`：`Book.find().sort({ title: 1 })`，按书名排序后渲染列表页。
- `showNewForm`：渲染空的图书表单。
- `create`：把表单字段交给 `Book.create()`；验证失败时带着错误重新渲染表单。
- `show`：按 `:id` 查一本图书，找不到就渲染 404 页面。
- `showEditForm`：查出图书后渲染编辑表单。
- `update`：先查文档，`book.set(...)` 修改，再 `book.save()` 触发完整验证。
- `remove`：查到后调用 `book.deleteOne()`，完成后跳回列表。
- `formInput` 把 HTML 复选框转换成布尔值：勾选时发送 `on`，没勾选时字段不存在，
  因而得到 `false`。

### `controllers/apiBookController.js`：REST API 控制器

- `list`：返回图书数组。
- `show`：非法 ObjectId 返回 400，不存在的 ID 返回 404。
- `create`：用请求 JSON 创建图书，成功返回 201 和 `Location` 响应头。
- `update`：按 PUT 的完整更新语义，重新设置四个必填字段后 `save()`；
  这样 Mongoose 会再次执行必填、范围和枚举验证。
- `remove`：删除成功返回 204，响应体为空。
- 这个控制器不检查 session，符合课堂上 REST API 不要求 Web 登录的设定。

### `routes/authRoutes.js`

只做 URL 映射：

```text
GET  /login   -> authController.showLogin
POST /login   -> authController.login
POST /logout  -> authController.logout
```

### `routes/webBookRoutes.js`

- 第一行 `router.use(requireAuth)` 让后面的所有页面路由都受 session 保护。
- `/books/new` 必须写在 `/books/:id` 前面，否则 `new` 会被当成一个图书 ID。
- 页面更新和删除使用 POST，这是 HTML 表单的限制。

### `routes/apiBookRoutes.js`

用 REST 风格映射同一个资源的五个操作：

```text
GET    /books
GET    /books/:id
POST   /books
PUT    /books/:id
DELETE /books/:id
```

文件挂载到 `/api` 后，完整路径就是 `/api/books`。

### `views/partials/header.ejs` 和 `footer.ejs`

- `header.ejs` 输出 HTML 头部、导航栏和 `<main>` 开始标签。
- 根据 `currentUser` 决定显示登录链接还是用户信息、图书导航和 Logout 按钮。
- `footer.ejs` 关闭 `<main>`、添加页脚并结束 HTML。

### `views/partials/errors.ejs`

读取控制器传入的 `errors` 数组。数组有内容时显示错误列表；没有内容时不输出任何东西。

### `views/login.ejs`

- `POST /login` 表单包含用户名和密码。
- 登录失败时 `username` 会回填，`errors` 会显示在表单上方。
- 页面上明确写出测试账号，并说明没有注册页面。

### `views/books/index.ejs`

- 用 `books.forEach` 生成表格行。
- 显示书名、作者、年份、类别和借阅状态。
- 每行提供详情、编辑和删除操作；删除按钮放在 POST 表单中并有确认提示。
- `<%= ... %>` 会 HTML 转义内容，避免用户输入被当作 HTML 执行。

### `views/books/_form.ejs`

新增页和编辑页共用的表单：

- 三个文本/数字输入和一个类别下拉框。
- 复选框使用 `book.available !== false`，所以新增时默认勾选，编辑时按数据库值显示。
- `formAction` 和 `submitLabel` 由调用它的页面传入，避免复制两份表单代码。

### `views/books/new.ejs`、`edit.ejs`、`show.ejs`

- `new.ejs`：用 `_form.ejs` 创建记录，提交到 `POST /books`。
- `edit.ejs`：用同一个表单，提交到 `POST /books/:id/update`。
- `show.ejs`：显示详情，提供编辑、返回和删除按钮。

### `views/not-found.ejs` 和 `views/error.ejs`

分别是 404 页面和统一错误页面。它们也复用 `header` 与 `footer`。

### `public/styles.css`

负责页面布局、登录卡片、表单、表格、状态徽章、按钮和移动端适配。
它不参与业务逻辑，只通过 `express.static` 提供给浏览器。

### `seed.js`

- 连接 `.env` 中的 MongoDB。
- 逐条使用 `updateOne(..., { upsert: true })` 写入示例图书。
- 相同 `title + author` 已存在时更新而不是重复插入，所以可以重复执行。
- 最后断开数据库连接。

### `package.json`、`.env.example`、`.gitignore`

- `npm start`：正常启动。
- `npm run dev`：Node 18+ 的 watch 模式，修改文件后自动重启。
- `npm run seed`：插入示例数据。
- `.env.example` 只是模板；真正的 `.env` 已被 `.gitignore` 排除，不能提交数据库密码。
## 7. 在 Ubuntu 中运行

### 7.1 前置条件

- Node.js 18 或以上
- 一个可用的 MongoDB 数据库：本机 MongoDB Community，或 MongoDB Atlas

检查 Node：

```bash
node -v
npm -v
```

### 7.2 安装和配置

进入项目目录，然后执行：

```bash
npm install
cp .env.example .env
nano .env
```

`.env` 至少填写：

```env
MONGODB_URI=mongodb://127.0.0.1:27017/bookmanager
SESSION_SECRET=请换成一串足够长的随机字符
PORT=8099
```

如果使用 MongoDB Atlas，连接字符串通常类似：

```env
MONGODB_URI=mongodb+srv://用户名:密码@集群地址/bookmanager?retryWrites=true&w=majority
```

密码里有特殊字符时要按 MongoDB Atlas 的要求进行 URL 编码。Atlas 还需要在
Network Access 中允许你的公网 IP；课堂临时测试通常可以添加 `0.0.0.0/0`，
但不要把这种设置当成长期安全方案。

### 7.3 插入示例数据并启动

```bash
npm run seed
npm start
```

看到下面的输出就表示启动成功：

```text
MongoDB connected.
Book Manager running at http://localhost:8099
```

浏览器打开：

```text
http://localhost:8099/login
```

测试账号：

```text
student01 / demo123
student02 / demo123
```

不运行 `npm run seed` 也可以启动，只是列表一开始为空，可以直接在页面新增。

### 7.4 页面测试顺序

1. 未登录时打开 `http://localhost:8099/books`，应跳转到登录页。
2. 用 `student01 / demo123` 登录。
3. 在列表页新增一本书。
4. 打开详情页，再编辑这本书。
5. 删除这本书。
6. 点击 Logout，再访问 `/books`，应重新跳转到登录页。
7. 不登录直接访问 `/api/books`，应仍能拿到 JSON，因为 REST API 不要求页面登录。

## 8. CURL 测试 REST API

以下命令在 Ubuntu 终端执行。先启动应用。

### 查询全部图书

```bash
curl -i http://localhost:8099/api/books
```

### 新建图书

```bash
curl -i -X POST http://localhost:8099/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Node.js in Action",
    "author": "Alex Young",
    "year": 2017,
    "category": "Technology",
    "available": true
  }'
```

响应状态应为 `201 Created`。复制响应中的 `_id`，下文记作 `BOOK_ID`。

### 查询一本图书

```bash
curl -i http://localhost:8099/api/books/BOOK_ID
```

### 完整更新图书

```bash
curl -i -X PUT http://localhost:8099/api/books/BOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Node.js in Action, 2nd Edition",
    "author": "Alex Young",
    "year": 2017,
    "category": "Technology",
    "available": false
  }'
```

### 删除图书

```bash
curl -i -X DELETE http://localhost:8099/api/books/BOOK_ID
```

成功时状态应为 `204 No Content`。

### 测试验证错误

```bash
curl -i -X POST http://localhost:8099/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Missing fields"}'
```

应返回 `400 Bad Request`，JSON 中会有 `Validation failed.` 和具体错误列表。

### 用 curl 测试登录 Cookie

把登录响应写入 Cookie 文件，再带着 Cookie 请求受保护页面：

```bash
curl -i -c cookies.txt -X POST http://localhost:8099/login \
  -d "username=student01" \
  -d "password=demo123"

curl -i -b cookies.txt http://localhost:8099/books
```

第一次请求应返回 `302` 并设置 `bookmanager.sid` 及其签名 Cookie，第二次请求应返回图书列表 HTML。
也可以打开浏览器开发者工具的 Application/Storage -> Cookies，通常会看到
`bookmanager.sid` 和 `bookmanager.sid.sig` 两个 Cookie；`curl -c cookies.txt`
会自动把两个都保存下来。

## 9. 这个示例的边界

这是 COMP3810SEF 风格的教学示例，不是生产系统：

- 固定账号和明文密码只用于演示“服务器提供账号”。
- `cookie-session` 数据放在浏览器 Cookie 中，不适合保存大量或敏感会话数据。
- 本地 `secure: false`；生产环境应在 HTTPS 下改为 `secure: true`。
- REST API 按课程要求不做 Web 登录校验，因此任何人都能调用。真实系统应增加
  API 认证和授权。
- 示例没有实现 CSRF token、限流、审计日志、密码找回等生产功能。

## 10. 常见问题

### 启动时报 `MONGODB_URI is missing`

没有创建 `.env`，或 `.env` 里没有 `MONGODB_URI`。执行：

```bash
cp .env.example .env
nano .env
```

### 启动时一直连不上 MongoDB

- 本机 MongoDB：确认 MongoDB 服务正在运行，端口通常是 `27017`。
- Atlas：检查用户名、密码、数据库名、IP 白名单和网络。
- 连接字符串不要保留尖括号 `< >`。

### 登录一直失败

确认输入的是 `student01 / demo123` 或 `student02 / demo123`，并检查
`config/users.js` 是否被修改。

### 端口被占用

修改 `.env`：

```env
PORT=8100
```

然后重新启动，访问 `http://localhost:8100`。
