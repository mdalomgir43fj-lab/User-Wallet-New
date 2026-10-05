const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const DATA = process.env.DATA_DIR || path.join(ROOT, 'data');
const UPLOAD = process.env.UPLOAD_DIR || path.join(ROOT, 'data', 'uploads');

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(UPLOAD, { recursive: true });

const db = new Database(path.join(DATA, 'user-wallet.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  login_password_hash TEXT NOT NULL,
  dashboard_password TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  balance REAL DEFAULT 0,
  currency TEXT DEFAULT '',
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS images(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

if (!db.prepare('SELECT id FROM users WHERE username = ?').get('admin')) {
  db.prepare(`
    INSERT INTO users
    (username, full_name, login_password_hash)
    VALUES (?, ?, ?)
  `).run(
    'admin',
    'Administrator',
    bcrypt.hashSync('Admin@12345', 12)
  );
}

app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* CSS / normal public files */
app.use(express.static(path.join(ROOT, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'CHANGE_ME',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

/* Upload settings */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (_, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

/* Helpers */
const esc = s =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const getUser = id =>
  db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id));

const login = (req, res, next) => {
  if (req.session.userId) return next();
  res.redirect('/login');
};

const admin = (req, res, next) => {
  if (
    req.session.userId &&
    req.session.role === 'admin'
  ) {
    return next();
  }

  res.redirect('/login');
};

/* HTML shell */
function shell(title, body, js = '') {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · User Wallet</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
${body}
${js}
</body>
</html>`;
}

/* Login */
function loginPage(msg = '') {
  return shell(
    'Login',
    `
<main class="login-layout">

<section class="login-hero">

<div class="brand-lockup">
  <div class="logo-mark">◉</div>
  <div class="brand-name">User Wallet</div>
</div>

<div class="login-card">

<h1>Welcome Back</h1>
<p>Please login to your account</p>

${msg ? `<div class="alert">${esc(msg)}</div>` : ''}

<form method="post" action="/login">

<label>
User ID
<input
  name="username"
  placeholder="User ID"
  autocomplete="username"
  required
>
</label>

<label>
Password
<input
  name="password"
  type="password"
  placeholder="Password"
  autocomplete="current-password"
  required
>
</label>

<button class="primary full" type="submit">
Login
</button>

</form>

</div>
</section>

<section class="preview">

<div class="preview-top">
  <b>User Wallet</b>
  <span>Secure User Portal</span>
</div>

<div class="welcome">

<div>
<h2>Welcome, Trust Bank 👋</h2>
<p>Here are your images</p>
</div>

<div class="bal">
<small>BALANCE :</small>
<strong>1,250.00</strong>
</div>

</div>

<div class="demo-grid">
${[
  'Tropical beach',
  'Modern villa',
  'Luxury car',
  'Airplane',
  'Mountain lake',
  'City skyline'
].map((x, i) =>
  `<div class="tile t${i}">${x}</div>`
).join('')}
</div>

<div class="demo-bottom">

<div>
<b>Account Number</b>
<span>1234 5678 9012 3456</span>
</div>

<button class="primary">
Withdraw
</button>

</div>

</section>

</main>
`
  );
}

/* User Dashboard */
function dashboard(user, images) {

  const money =
    (user.currency ? esc(user.currency) + ' ' : '') +
    Number(user.balance || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  return shell(
    'Dashboard',
    `
<div class="app">

<header class="topbar">

<div class="brand">
<span class="logo-mini">◉</span>
<b>User Wallet</b>
</div>

<div class="top-user">
<span class="avatar">●</span>
${esc(user.full_name)}

<form method="post" action="/logout">
<button class="logout" type="submit">
Logout
</button>
</form>

</div>

</header>

<main class="dash">

<section class="welcome">

<div>
<h1>Welcome, ${esc(user.full_name)} 👋</h1>
<p>Here are your images</p>
</div>

<div class="bal">
<span>BALANCE :</span>
<strong>${money}</strong>
</div>

</section>

<section class="image-grid">

${
  images.length
    ? images.map(image => `
      <div class="image-card">
        <img
          src="/user-files/${encodeURIComponent(image.filename)}"
          alt="${esc(image.original_name)}"
        >
      </div>
    `).join('')
    : `
      <div class="empty">
        No images have been assigned to your account yet.
      </div>
    `
}

</section>

<section class="account">

<div>
<label>Account Number</label>

<div class="value">
<span>▣</span>
${esc(user.account_number || 'Not set')}

<button
  class="copy"
  data-copy="${esc(user.account_number || '')}"
  type="button"
>
⧉
</button>

</div>
</div>

<!-- Dashboard password is intentionally NOT shown to the user -->

<div>
<label>Withdraw</label>

<button
  class="primary withdraw"
  type="button"
>
▣ &nbsp; Withdraw
</button>

</div>

</section>

</main>

</div>

<div id="modal" class="modal">

<div class="modal-card">

<button class="x" onclick="closeM()" type="button">
×
</button>

<h3>Withdrawal</h3>

<p id="mt">
Withdrawal request received.
</p>

<button
  class="primary"
  onclick="closeM()"
  type="button"
>
OK
</button>

</div>

</div>
`,
    `
<script>

document.querySelectorAll('.copy').forEach(button => {

  button.onclick = async () => {

    const value = button.dataset.copy;

    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      button.textContent = '✓';

      setTimeout(() => {
        button.textContent = '⧉';
      }, 800);

    } catch (e) {}

  };

});

const modal = document.getElementById('modal');

function closeM() {
  modal.classList.remove('show');
}

const withdrawButton =
  document.querySelector('.withdraw');

if (withdrawButton) {

  withdrawButton.onclick = async () => {

    const response =
      await fetch('/withdraw', {
        method: 'POST'
      });

    const data =
      await response.json();

    document.getElementById('mt')
      .textContent = data.message;

    modal.classList.add('show');
  };

}

</script>
`
  );
}

/* Admin Panel */
function adminPage(users) {

  return shell(
    'Admin Panel',
    `
<div class="admin">

<header class="topbar">

<div class="brand">
<span class="logo-mini">◉</span>
<b>User Wallet Admin</b>
</div>

<form method="post" action="/logout">
<button class="secondary" type="submit">
Logout
</button>
</form>

</header>

<main class="admin-main">

<h1>Admin Panel</h1>

<p class="muted">
Create unlimited users and manage each user's dashboard.
</p>

<section class="create">

<h2>Create User</h2>

<form method="post" action="/admin/users">

<div class="form-grid">

<label>
Username / User ID
<input name="username" required>
</label>

<label>
Full name
<input name="full_name" required>
</label>

<label>
Email
<input name="email">
</label>

<label>
Login password
<input
 name="login_password"
 type="password"
 required
>
</label>

<label>
Dashboard password
<input name="dashboard_password">
</label>

<label>
Account number
<input name="account_number">
</label>

<label>
Balance
<input
 name="balance"
 type="number"
 step="0.01"
 value="0"
>
</label>

<label>
Currency / unit
<input
 name="currency"
 placeholder="USD, EUR, points..."
>
</label>

</div>

<button class="primary" type="submit">
Create User
</button>

</form>

</section>

<h2>Users (${users.length})</h2>

${users.map(user => {

  const images =
    db.prepare(
      'SELECT * FROM images WHERE user_id = ? ORDER BY id DESC'
    ).all(user.id);

  return `
<article class="user-card">

<div class="user-head">

<div>

<h3>${esc(user.full_name)}</h3>

<p>
@${esc(user.username)}
·
${esc(user.email)}
</p>

</div>

<span class="status ${user.enabled ? 'on' : 'off'}">
${user.enabled ? 'Active' : 'Disabled'}
</span>

</div>

<form
 method="post"
 action="/admin/users/${user.id}/update"
>

<div class="form-grid">

<label>
Full name
<input
 name="full_name"
 value="${esc(user.full_name)}"
>
</label>

<label>
Email
<input
 name="email"
 value="${esc(user.email)}"
>
</label>

<label>
Account number
<input
 name="account_number"
 value="${esc(user.account_number)}"
>
</label>

<label>
Balance
<input
 name="balance"
 type="number"
 step="0.01"
 value="${esc(user.balance)}"
>
</label>

<label>
Currency / unit
<input
 name="currency"
 value="${esc(user.currency)}"
>
</label>

<label>
Dashboard password
<input
 name="dashboard_password"
 value="${esc(user.dashboard_password)}"
>
</label>

<label>
New login password
<input
 name="new_login_password"
 type="password"
 placeholder="Leave blank to keep"
>
</label>

<label>
Status

<select name="enabled">

<option
 value="1"
 ${user.enabled ? 'selected' : ''}
>
Active
</option>

<option
 value="0"
 ${!user.enabled ? 'selected' : ''}
>
Disabled
</option>

</select>

</label>

</div>

<button class="primary" type="submit">
Save User
</button>

</form>

<div class="upload-row">

<form
 method="post"
 action="/admin/users/${user.id}/images"
 enctype="multipart/form-data"
>

<input
 type="file"
 name="images"
 accept="image/jpeg,image/png,image/webp,image/gif"
 multiple
 required
>

<button class="secondary" type="submit">
Upload Images
</button>

</form>

<form
 method="post"
 action="/admin/users/${user.id}/delete"
 onsubmit="return confirm('Delete this user?')"
>

<button class="danger" type="submit">
Delete User
</button>

</form>

</div>

<div class="admin-images">

${images.map(image => `

<div>

<img
 src="/user-files/${encodeURIComponent(image.filename)}"
 alt="${esc(image.original_name)}"
>

<form
 method="post"
 action="/admin/images/${image.id}/delete"
>

<button
 class="tiny"
 type="submit"
>
×
</button>

</form>

</div>

`).join('')}

</div>

</article>
`;

}).join('')}

</main>

</div>
`
  );
}

/* Home */
app.get('/', (req, res) => {

  if (!req.session.userId) {
    return res.redirect('/login');
  }

  res.redirect(
    req.session.role === 'admin'
      ? '/admin'
      : '/dashboard'
  );

});

/* Login */
app.get('/login', (req, res) => {

  if (req.session.userId) {
    return res.redirect('/');
  }

  res.send(loginPage());

});

app.post('/login', (req, res) => {

  const username =
    String(req.body.username || '').trim();

  const password =
    String(req.body.password || '');

  const user =
    db.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).get(username);

  if (
    !user ||
    !bcrypt.compareSync(
      password,
      user.login_password_hash
    )
  ) {
    return res.send(
      loginPage('Invalid User ID or password.')
    );
  }

  if (!user.enabled) {
    return res.send(
      loginPage('This account is disabled.')
    );
  }

  req.session.userId = user.id;

  req.session.role =
    user.username === 'admin'
      ? 'admin'
      : 'user';

  res.redirect(
    req.session.role === 'admin'
      ? '/admin'
      : '/dashboard'
  );

});

/* Logout */
app.post('/logout', (req, res) => {

  req.session.destroy(() => {
    res.redirect('/login');
  });

});

/* User Dashboard */
app.get('/dashboard', login, (req, res) => {

  if (req.session.role === 'admin') {
    return res.redirect('/admin');
  }

  const user =
    getUser(req.session.userId);

  if (!user) {
    req.session.destroy(() => {
      res.redirect('/login');
    });

    return;
  }

  const images =
    db.prepare(
      'SELECT * FROM images WHERE user_id = ? ORDER BY id DESC'
    ).all(user.id);

  res.send(
    dashboard(user, images)
  );

});

/* Protected image/file route */
app.get('/user-files/:filename', login, (req, res) => {

  const filename =
    path.basename(req.params.filename);

  const image =
    db.prepare(
      'SELECT * FROM images WHERE filename = ?'
    ).get(filename);

  if (!image) {
    return res.status(404).send('File not found.');
  }

  if (req.session.role === 'admin') {
    return res.sendFile(
      path.join(UPLOAD, filename)
    );
  }

  if (
    Number(image.user_id) !==
    Number(req.session.userId)
  ) {
    return res.status(403).send('Access denied.');
  }

  res.sendFile(
    path.join(UPLOAD, filename)
  );

});

/* Withdraw */
app.post('/withdraw', login, (req, res) => {

  if (req.session.role === 'admin') {
    return res.json({
      ok: false,
      message: 'Admin cannot make a withdrawal.'
    });
  }

  res.json({
    ok: true,
    message:
      'Withdrawal request received. This demo does not transfer real funds.'
  });

});

/* Admin */
app.get('/admin', admin, (req, res) => {

  const users =
    db.prepare(
      "SELECT * FROM users WHERE username != 'admin' ORDER BY id DESC"
    ).all();

  res.send(
    adminPage(users)
  );

});

/* Create User */
app.post('/admin/users', admin, (req, res) => {

  try {

    const username =
      String(req.body.username || '').trim();

    const fullName =
      String(req.body.full_name || '').trim();

    const email =
      String(req.body.email || '');

    const loginPassword =
      String(req.body.login_password || '');

    const dashboardPassword =
      String(req.body.dashboard_password || '');

    const accountNumber =
      String(req.body.account_number || '');

    const balance =
      Number(req.body.balance || 0);

    const currency =
      String(req.body.currency || '');

    const hash =
      bcrypt.hashSync(
        loginPassword,
        12
      );

    db.prepare(`
      INSERT INTO users
      (
        username,
        full_name,
        email,
        login_password_hash,
        dashboard_password,
        account_number,
        balance,
        currency
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      username,
      fullName,
      email,
      hash,
      dashboardPassword,
      accountNumber,
      balance,
      currency
    );

    res.redirect('/admin');

  } catch (error) {

    console.error(error);

    if (
      String(error.message).includes('UNIQUE')
    ) {
      return res
        .status(400)
        .send('Username already exists.');
    }

    res
      .status(400)
      .send('Could not create user.');

  }

});

/* Update User */
app.post(
  '/admin/users/:id/update',
  admin,
  (req, res) => {

    const user =
      getUser(req.params.id);

    if (
      !user ||
      user.username === 'admin'
    ) {
      return res
        .status(404)
        .send('User not found.');
    }

    let passwordHash =
      user.login_password_hash;

    const newPassword =
      String(
        req.body.new_login_password || ''
      ).trim();

    if (newPassword) {

      passwordHash =
        bcrypt.hashSync(
          newPassword,
          12
        );

    }

    db.prepare(`
      UPDATE users
      SET
        full_name = ?,
        email = ?,
        dashboard_password = ?,
        account_number = ?,
        balance = ?,
        currency = ?,
        enabled = ?,
        login_password_hash = ?
      WHERE id = ?
    `).run(
      String(req.body.full_name || ''),
      String(req.body.email || ''),
      String(req.body.dashboard_password || ''),
      String(req.body.account_number || ''),
      Number(req.body.balance || 0),
      String(req.body.currency || ''),
      req.body.enabled === '1' ? 1 : 0,
      passwordHash,
      user.id
    );

    res.redirect('/admin');

  }
);

/* Delete User */
app.post(
  '/admin/users/:id/delete',
  admin,
  (req, res) => {

    const images =
      db.prepare(
        'SELECT filename FROM images WHERE user_id = ?'
      ).all(req.params.id);

    for (const image of images) {

      const filePath =
        path.join(
          UPLOAD,
          image.filename
        );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

    }

    db.prepare(
      'DELETE FROM images WHERE user_id = ?'
    ).run(req.params.id);

    db.prepare(
      "DELETE FROM users WHERE id = ? AND username != 'admin'"
    ).run(req.params.id);

    res.redirect('/admin');

  }
);

/* Admin Upload Images */
app.post(
  '/admin/users/:id/images',
  admin,
  upload.array('images', 20),
  (req, res) => {

    const user =
      getUser(req.params.id);

    if (
      !user ||
      user.username === 'admin'
    ) {
      return res
        .status(404)
        .send('User not found.');
    }

    const insert =
      db.prepare(`
        INSERT INTO images
        (user_id, filename, original_name)
        VALUES (?, ?, ?)
      `);

    const transaction =
      db.transaction(files => {

        for (const file of files) {

          insert.run(
            user.id,
            file.filename,
            file.originalname
          );

        }

      });

    transaction(req.files || []);

    res.redirect('/admin');

  }
);

/* Delete Image */
app.post(
  '/admin/images/:id/delete',
  admin,
  (req, res) => {

    const image =
      db.prepare(
        'SELECT * FROM images WHERE id = ?'
      ).get(req.params.id);

    if (image) {

      const filePath =
        path.join(
          UPLOAD,
          image.filename
        );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      db.prepare(
        'DELETE FROM images WHERE id = ?'
      ).run(image.id);

    }

    res.redirect('/admin');

  }
);

/* Error handler */
app.use((error, req, res, next) => {

  console.error(error);

  res
    .status(400)
    .send(
      error.message || 'Request failed'
    );

});

/* Start */
app.listen(PORT, () => {

  console.log(
    `User Wallet: http://localhost:${PORT}`
  );

});
