const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'data', 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'user-wallet.db'));
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
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

  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const columns = db.prepare('PRAGMA table_info(users)').all().map(x => x.name);

if (!columns.includes('email')) {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''");
}

if (!columns.includes('dashboard_password')) {
  db.exec("ALTER TABLE users ADD COLUMN dashboard_password TEXT DEFAULT ''");
}

if (!columns.includes('account_number')) {
  db.exec("ALTER TABLE users ADD COLUMN account_number TEXT DEFAULT ''");
}

if (!columns.includes('balance')) {
  db.exec("ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0");
}

if (!columns.includes('currency')) {
  db.exec("ALTER TABLE users ADD COLUMN currency TEXT DEFAULT ''");
}

if (!columns.includes('enabled')) {
  db.exec("ALTER TABLE users ADD COLUMN enabled INTEGER DEFAULT 1");
}

const adminExists = db
  .prepare('SELECT id FROM users WHERE username = ?')
  .get('admin');

if (!adminExists) {
  const hash = bcrypt.hashSync('Admin@12345', 12);

  db.prepare(`
    INSERT INTO users
    (username, full_name, email, login_password_hash, enabled)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'admin',
    'Administrator',
    '',
    hash,
    1
  );
}const adminResetHash = bcrypt.hashSync('Admin@12345', 12);
db.prepare('UPDATE users SET login_password_hash = ?, enabled = 1 WHERE username = ?').run(adminResetHash, 'admin');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(ROOT, 'public')));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      'UserWallet-2026-Secure-Secret-8472',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getUser(id) {
  return db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(Number(id));
}

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  next();
}

function requireAdmin(req, res, next) {
  if (
    !req.session.userId ||
    req.session.role !== 'admin'
  ) {
    return res.redirect('/login');
  }

  next();
}

function page(title, body, script = '') {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} · User Wallet</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
${body}
${script}
</body>
</html>
`;
}

function loginPage(message = '') {
  return page(
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

      ${
        message
          ? `<div class="alert">${escapeHtml(message)}</div>`
          : ''
      }

      <form method="post" action="/login">

        <label>
          User ID
          <input
            name="username"
            placeholder="User ID"
            required
          >
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
          >
        </label>

        <button class="primary full">
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

      <div class="tile t0">Tropical beach</div>
      <div class="tile t1">Modern villa</div>
      <div class="tile t2">Luxury car</div>
      <div class="tile t3">Airplane</div>
      <div class="tile t4">Mountain lake</div>
      <div class="tile t5">City skyline</div>

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

function userDashboard(user, images) {

  const currency = user.currency
    ? `${escapeHtml(user.currency)} `
    : '';

  const balance =
    currency +
    Number(user.balance || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

  return page(
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
      ${escapeHtml(user.full_name)}

      <form method="post" action="/logout">
        <button class="logout">
          Logout
        </button>
      </form>
    </div>

  </header>

  <main class="dash">

    <section class="welcome">

      <div>
        <h1>
          Welcome, ${escapeHtml(user.full_name)} 👋
        </h1>

        <p>
          Here are your images
        </p>
      </div>

      <div class="bal">
        <span>BALANCE :</span>
        <strong>${balance}</strong>
      </div>

    </section>

    <section class="image-grid">

      ${
        images.length
          ? images
              .map(
                image => `
          <div class="image-card">
            <img
              src="/user-files/${encodeURIComponent(
                image.filename
              )}"
              alt="${escapeHtml(image.original_name)}"
            >
          </div>
        `
              )
              .join('')
          : `
          <div class="empty">
            No images have been assigned
            to your account yet.
          </div>
        `
      }

    </section>

    <section class="account">

      <div>
        <label>Account Number</label>

        <div class="value">
          <span>▣</span>
          ${escapeHtml(
            user.account_number || 'Not set'
          )}

          <button
            class="copy"
            data-copy="${escapeHtml(
              user.account_number || ''
            )}"
          >
            ⧉
          </button>
        </div>
      </div>

      <div>
        <label>Withdraw</label>

        <button class="primary withdraw">
          ▣ &nbsp; Withdraw
        </button>
      </div>

    </section>

  </main>

</div>

<div id="modal" class="modal">

  <div class="modal-card">

    <button
      class="x"
      onclick="closeModal()"
    >
      ×
    </button>

    <h3>Withdrawal</h3>

    <p id="modalText">
      Withdrawal request received.
    </p>

    <button
      class="primary"
      onclick="closeModal()"
    >
      OK
    </button>

  </div>

</div>
`,
    `
<script>

document
  .querySelectorAll('.copy')
  .forEach(button => {

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

const modal =
  document.getElementById('modal');

function closeModal() {
  modal.classList.remove('show');
}

const withdraw =
  document.querySelector('.withdraw');

if (withdraw) {

  withdraw.onclick = async () => {

    const response =
      await fetch('/withdraw', {
        method: 'POST'
      });

    const data =
      await response.json();

    document.getElementById(
      'modalText'
    ).textContent = data.message;

    modal.classList.add('show');

  };

}

</script>
`
  );
}

function adminPage(users) {

  return page(
    'Admin Panel',
    `
<div class="admin-layout">

  <aside class="admin-sidebar">

    <div class="brand">
      <span class="logo-mini">◉</span>
      <b>User Wallet Admin</b>
    </div>

    <nav class="admin-nav">
      <a href="/admin">Dashboard</a>
    </nav>

  </aside>

  <main class="admin-main">

    <header class="admin-header">

      <div>
        <h1>Admin Panel</h1>
        <p>
          Create unlimited users and manage
          each user's dashboard.
        </p>
      </div>

      <form method="post" action="/logout">
        <button class="secondary">
          Logout
        </button>
      </form>

    </header>

    <section class="stats-grid">

      <div class="stat-card">
        <span>Total Users</span>
        <strong>${users.length}</strong>
      </div>

    </section>

    <section class="form-card">

      <h2>Create User</h2>

      <form method="post" action="/admin/users">

        <div class="form-grid">

          <label>
            Username / User ID
            <input
              name="username"
              required
            >
          </label>

          <label>
            Full name
            <input
              name="full_name"
              required
            >
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
            <input
              name="dashboard_password"
            >
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

        <button class="primary">
          Create User
        </button>

      </form>

    </section>

    <h2>Users (${users.length})</h2>

    ${users
      .map(user => {

        const images = db
          .prepare(
            `
            SELECT *
            FROM images
            WHERE user_id = ?
            ORDER BY id DESC
            `
          )
          .all(user.id);

        return `
<article class="user-card">

  <div class="user-head">

    <div>
      <h3>
        ${escapeHtml(user.full_name)}
      </h3>

      <p>
        @${escapeHtml(user.username)}
        · ${escapeHtml(user.email)}
      </p>
    </div>

    <span class="status ${
      user.enabled ? 'on' : 'off'
    }">
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
          value="${escapeHtml(
            user.full_name
          )}"
        >
      </label>

      <label>
        Email
        <input
          name="email"
          value="${escapeHtml(
            user.email
          )}"
        >
      </label>

      <label>
        Account number
        <input
          name="account_number"
          value="${escapeHtml(
            user.account_number
          )}"
        >
      </label>

      <label>
        Balance
        <input
          name="balance"
          type="number"
          step="0.01"
          value="${escapeHtml(
            user.balance
          )}"
        >
      </label>

      <label>
        Currency / unit
        <input
          name="currency"
          value="${escapeHtml(
            user.currency
          )}"
        >
      </label>

      <label>
        Dashboard password
        <input
          name="dashboard_password"
          value="${escapeHtml(
            user.dashboard_password
          )}"
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
            ${
              user.enabled
                ? 'selected'
                : ''
            }
          >
            Active
          </option>

          <option
            value="0"
            ${
              !user.enabled
                ? 'selected'
                : ''
            }
          >
            Disabled
          </option>

        </select>

      </label>

    </div>

    <button class="primary">
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

      <button class="secondary">
        Upload Images
      </button>

    </form>

    <form
      method="post"
      action="/admin/users/${user.id}/delete"
      onsubmit="return confirm('Delete this user?')"
    >

      <button class="danger">
        Delete User
      </button>

    </form>

  </div>

  <div class="admin-images">

    ${images
      .map(
        image => `
      <div>

        <img
          src="/admin-files/${encodeURIComponent(
            image.filename
          )}"
        >

        <form
          method="post"
          action="/admin/images/${image.id}/delete"
        >

          <button class="tiny">
            ×
          </button>

        </form>

      </div>
    `
      )
      .join('')}

  </div>

</article>
`;

      })
      .join('')}

  </main>

</div>
`
  );
}

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },

  filename: function (req, file, cb) {

    const ext =
      path.extname(file.originalname)
        .toLowerCase();

    cb(
      null,
      crypto.randomUUID() + ext
    );

  }

});

const upload = multer({

  storage,

  limits: {
    files: 20,
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only JPG, PNG, WebP and GIF images are allowed.'
        )
      );
    }

  }

});

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
      loginPage(
        'Invalid User ID or password.'
      )
    );

  }

  if (!user.enabled) {

    return res.send(
      loginPage(
        'This account is disabled.'
      )
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

app.post('/logout', (req, res) => {

  req.session.destroy(() => {
    res.redirect('/login');
  });

});

app.get('/dashboard', requireLogin, (req, res) => {

  if (req.session.role === 'admin') {
    return res.redirect('/admin');
  }

  const user =
    getUser(req.session.userId);

  if (!user) {
    return res.redirect('/login');
  }

  const images =
    db.prepare(
      `
      SELECT *
      FROM images
      WHERE user_id = ?
      ORDER BY id DESC
      `
    ).all(user.id);

  res.send(
    userDashboard(user, images)
  );

});

app.get('/user-files/:filename', requireLogin, (req, res) => {

  const user =
    getUser(req.session.userId);

  if (!user || req.session.role === 'admin') {
    return res.status(403).send('Forbidden');
  }

  const image =
    db.prepare(
      `
      SELECT *
      FROM images
      WHERE filename = ?
      AND user_id = ?
      `
    ).get(
      req.params.filename,
      user.id
    );

  if (!image) {
    return res.status(404).send('File not found');
  }

  const filePath =
    path.join(
      UPLOAD_DIR,
      image.filename
    );

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.sendFile(
    path.resolve(filePath)
  );

});

app.get('/admin-files/:filename', requireAdmin, (req, res) => {

  const image =
    db.prepare(
      'SELECT * FROM images WHERE filename = ?'
    ).get(req.params.filename);

  if (!image) {
    return res.status(404).send('File not found');
  }

  const filePath =
    path.join(
      UPLOAD_DIR,
      image.filename
    );

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.sendFile(
    path.resolve(filePath)
  );

});

app.post('/withdraw', requireLogin, (req, res) => {

  res.json({
    ok: true,
    message:
      'Withdrawal request received. This demo does not transfer real funds.'
  });

});

app.get('/admin', requireAdmin, (req, res) => {

  const users =
    db.prepare(
      `
      SELECT *
      FROM users
      WHERE username != 'admin'
      ORDER BY id DESC
      `
    ).all();

  res.send(
    adminPage(users)
  );

});

app.post('/admin/users', requireAdmin, (req, res) => {

  try {

    const username =
      String(req.body.username || '').trim();

    const fullName =
      String(req.body.full_name || '').trim();

    const email =
      String(req.body.email || '').trim();

    const loginPassword =
      String(req.body.login_password || '');

    const dashboardPassword =
      String(req.body.dashboard_password || '');

    const accountNumber =
      String(req.body.account_number || '').trim();

    const balance =
      Number(req.body.balance || 0);

    const currency =
      String(req.body.currency || '').trim();

    if (!username || !fullName || !loginPassword) {
      return res
        .status(400)
        .send('Required fields are missing.');
    }

    const hash =
      bcrypt.hashSync(
        loginPassword,
        12
      );

    db.prepare(
      `
      INSERT INTO users
      (
        username,
        full_name,
        email,
        login_password_hash,
        dashboard_password,
        account_number,
        balance,
        currency,
        enabled
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `
    ).run(
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

    if (
      String(error.message).includes('UNIQUE')
    ) {
      return res
        .status(400)
        .send('Username already exists.');
    }

    console.error(error);

    res
      .status(400)
      .send('Could not create user.');

  }

});

app.post(
  '/admin/users/:id/update',
  requireAdmin,
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

    db.prepare(
      `
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
      `
    ).run(
      String(req.body.full_name || ''),
      String(req.body.email || ''),
      String(
        req.body.dashboard_password || ''
      ),
      String(
        req.body.account_number || ''
      ),
      Number(req.body.balance || 0),
      String(req.body.currency || ''),
      req.body.enabled === '1' ? 1 : 0,
      passwordHash,
      user.id
    );

    res.redirect('/admin');

  }
);

app.post(
  '/admin/users/:id/delete',
  requireAdmin,
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

    const images =
      db.prepare(
        'SELECT * FROM images WHERE user_id = ?'
      ).all(user.id);

    for (const image of images) {

      const filePath =
        path.join(
          UPLOAD_DIR,
          image.filename
        );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

    }

    db.prepare(
      'DELETE FROM images WHERE user_id = ?'
    ).run(user.id);

    db.prepare(
      `
      DELETE FROM users
      WHERE id = ?
      AND username != 'admin'
      `
    ).run(user.id);

    res.redirect('/admin');

  }
);

app.post(
  '/admin/users/:id/images',
  requireAdmin,
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
      db.prepare(
        `
        INSERT INTO images
        (user_id, filename, original_name)
        VALUES (?, ?, ?)
        `
      );

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

app.post(
  '/admin/images/:id/delete',
  requireAdmin,
  (req, res) => {

    const image =
      db.prepare(
        'SELECT * FROM images WHERE id = ?'
      ).get(req.params.id);

    if (image) {

      const filePath =
        path.join(
          UPLOAD_DIR,
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

app.use((error, req, res, next) => {

  console.error(error);

  res
    .status(400)
    .send(
      error.message || 'Request failed'
    );

});

app.listen(PORT, () => {

  console.log(
    `User Wallet running on port ${PORT}`
  );

});
