*{
  box-sizing:border-box;
  margin:0;
  padding:0;
}

html,body{
  min-height:100%;
}

body{
  font-family:Inter,Arial,Helvetica,sans-serif;
  color:#10275a;
  background:#eef4fb;
}

button,input,select{
  font:inherit;
}

button{
  cursor:pointer;
}

a{
  text-decoration:none;
}

/* =========================
   LOGIN
========================= */

.login-layout{
  min-height:100vh;
  display:grid;
  grid-template-columns:1.15fr .85fr;
  background:#eef5fc;
}

.login-hero{
  position:relative;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:50px;
  overflow:hidden;
  background:
    linear-gradient(135deg,rgba(5,54,112,.82),rgba(15,137,226,.48)),
    linear-gradient(135deg,#0755a5,#35a9ed);
}

.login-hero::before{
  content:"";
  position:absolute;
  width:520px;
  height:520px;
  border-radius:50%;
  background:rgba(255,255,255,.08);
  top:-180px;
  left:-150px;
}

.login-hero::after{
  content:"";
  position:absolute;
  width:420px;
  height:420px;
  border-radius:50%;
  background:rgba(255,255,255,.07);
  bottom:-180px;
  right:-100px;
}

.brand-lockup{
  position:relative;
  z-index:2;
  color:#fff;
  text-align:center;
}

.logo-mark{
  width:82px;
  height:82px;
  margin:0 auto 18px;
  border-radius:24px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#fff;
  color:#0868d8;
  font-size:38px;
  font-weight:900;
  box-shadow:0 18px 40px rgba(0,0,0,.2);
}

.brand-name{
  font-size:34px;
  font-weight:900;
  letter-spacing:-.7px;
}

.brand-tagline{
  margin-top:8px;
  font-size:15px;
  opacity:.9;
}

.login-card{
  align-self:center;
  width:min(460px,calc(100% - 50px));
  margin:auto;
  padding:38px;
  background:#fff;
  border-radius:26px;
  box-shadow:0 25px 70px rgba(14,55,95,.16);
}

.login-card h1{
  margin-bottom:8px;
  font-size:31px;
  color:#10275a;
}

.login-card .subtitle{
  margin-bottom:26px;
  color:#72839b;
}

.login-card label{
  display:block;
  margin-bottom:8px;
  font-size:14px;
  font-weight:800;
  color:#243d62;
}

.login-card input{
  width:100%;
  height:52px;
  margin-bottom:18px;
  padding:0 15px;
  border:1px solid #d4e0ed;
  border-radius:12px;
  outline:none;
  background:#f8fbff;
  color:#17355f;
}

.login-card input:focus{
  border-color:#1685e8;
  box-shadow:0 0 0 4px rgba(22,133,232,.12);
}

.primary,
.login-card button{
  width:100%;
  min-height:52px;
  border:0;
  border-radius:12px;
  background:linear-gradient(135deg,#0868d8,#2498f3);
  color:#fff;
  font-weight:800;
  box-shadow:0 10px 24px rgba(18,111,218,.24);
}

.primary:hover,
.login-card button:hover{
  filter:brightness(1.04);
}

.alert{
  margin-bottom:18px;
  padding:12px 14px;
  border-radius:11px;
  background:#fff0f0;
  border:1px solid #ffd0cc;
  color:#b42318;
}

/* Login demo/preview */

.preview{
  margin-top:28px;
  padding:20px;
  border-radius:18px;
  background:#f5f9fe;
  border:1px solid #e1eaf4;
}

.preview-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:14px;
}

.welcome{
  font-weight:800;
  color:#123b78;
}

.bal{
  font-size:20px;
  font-weight:900;
  color:#0868d8;
}

.demo-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
}

.tile{
  height:70px;
  border-radius:10px;
  background:linear-gradient(135deg,#d9ecff,#8bc8fa);
}

.demo-bottom{
  margin-top:12px;
  padding:13px;
  border-radius:10px;
  background:#fff;
  font-size:13px;
  font-weight:700;
  color:#53667f;
}

/* =========================
   USER DASHBOARD
========================= */

.app{
  min-height:100vh;
  background:#eef4fb;
}

.topbar{
  height:72px;
  padding:0 32px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  background:#fff;
  box-shadow:0 4px 20px rgba(15,50,90,.08);
}

.brand{
  display:flex;
  align-items:center;
  gap:11px;
  color:#1256a0;
  font-size:21px;
  font-weight:900;
}

.logo-mini{
  width:42px;
  height:42px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:12px;
  background:linear-gradient(135deg,#0868d8,#31a4f5);
  color:#fff;
  font-size:20px;
  font-weight:900;
}

.top-user{
  display:flex;
  align-items:center;
  gap:12px;
}

.avatar{
  width:40px;
  height:40px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#e2f0ff;
  color:#0868d8;
  font-weight:900;
}

.logout{
  padding:9px 15px;
  border-radius:9px;
  background:#fff1f1;
  color:#b42318;
  font-weight:800;
}

.dash{
  width:min(1180px,calc(100% - 40px));
  margin:28px auto 60px;
}

.dash .welcome{
  padding:30px;
  margin-bottom:22px;
  border-radius:22px;
  color:#fff;
  background:linear-gradient(135deg,#0759b7,#2399f4);
  box-shadow:0 18px 40px rgba(15,91,175,.20);
}

.dash .welcome h1{
  margin-bottom:8px;
  font-size:30px;
}

.dash .welcome p{
  opacity:.9;
}

.dash .bal{
  margin-bottom:22px;
  padding:25px;
  border-radius:20px;
  background:#fff;
  box-shadow:0 8px 28px rgba(20,60,100,.08);
}

.dash .bal strong{
  display:block;
  margin-top:6px;
  font-size:34px;
  color:#0868d8;
}

/* Images */

.image-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
  margin-bottom:25px;
}

.image-card{
  overflow:hidden;
  border-radius:17px;
  background:#fff;
  border:1px solid #e0e9f3;
  box-shadow:0 8px 25px rgba(20,60,100,.07);
}

.image-card img{
  width:100%;
  height:240px;
  display:block;
  object-fit:cover;
  background:#f4f8fc;
}

.image-card .caption{
  padding:12px 14px;
  color:#50627a;
  font-size:13px;
  font-weight:700;
}

.empty{
  padding:35px;
  text-align:center;
  border-radius:17px;
  background:#fff;
  color:#71809a;
}

/* Account */

.account{
  padding:25px;
  border-radius:20px;
  background:#fff;
  box-shadow:0 8px 28px rgba(20,60,100,.08);
}

.account h2{
  margin-bottom:18px;
  color:#123b78;
}

.value{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  padding:16px;
  border-radius:12px;
  background:#f5f9fe;
  border:1px solid #e1eaf4;
  font-size:18px;
  font-weight:800;
  color:#173d70;
  word-break:break-word;
}

.copy{
  border:0;
  padding:9px 14px;
  border-radius:9px;
  background:#e3f1ff;
  color:#0868d8;
  font-weight:800;
}

.withdraw{
  width:100%;
  margin-top:18px;
  min-height:52px;
  border:0;
  border-radius:12px;
  background:linear-gradient(135deg,#0868d8,#2498f3);
  color:#fff;
  font-weight:900;
  box-shadow:0 10px 22px rgba(18,111,218,.22);
}

.withdraw:hover{
  filter:brightness(1.05);
}

/* Modal */

.modal{
  position:fixed;
  inset:0;
  z-index:100;
  display:none;
  align-items:center;
  justify-content:center;
  padding:20px;
  background:rgba(5,25,55,.58);
}

.modal.show{
  display:flex;
}

.modal-card{
  position:relative;
  width:min(440px,100%);
  padding:30px;
  border-radius:22px;
  background:#fff;
  box-shadow:0 25px 70px rgba(0,0,0,.25);
}

.modal-card h2{
  margin-bottom:12px;
  color:#123b78;
}

.modal-card p{
  color:#667991;
}

.x{
  position:absolute;
  top:13px;
  right:15px;
  width:34px;
  height:34px;
  border:0;
  border-radius:50%;
  background:#eef4fb;
  color:#315276;
  font-size:20px;
}

/* =========================
   ADMIN
========================= */

.admin-layout{
  min-height:100vh;
  display:grid;
  grid-template-columns:250px 1fr;
  background:#f3f7fc;
}

.admin-sidebar{
  padding:25px 18px;
  background:#092f63;
  color:#fff;
}

.admin-sidebar h2{
  margin-bottom:25px;
  font-size:22px;
}

.admin-nav{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.admin-nav a{
  padding:12px 14px;
  border-radius:10px;
  color:#dcecff;
}

.admin-nav a:hover{
  background:rgba(255,255,255,.12);
}

.admin-main{
  padding:28px;
}

.admin-header{
  padding:22px;
  margin-bottom:22px;
  border-radius:18px;
  background:#fff;
  box-shadow:0 7px 25px rgba(20,60,100,.08);
}

.stats-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
  margin-bottom:22px;
}

.stat-card{
  padding:22px;
  border-radius:17px;
  background:#fff;
  box-shadow:0 7px 25px rgba(20,60,100,.07);
}

.stat-card strong{
  display:block;
  margin-top:8px;
  font-size:28px;
  color:#1267c9;
}

.admin-table-wrap{
  padding:20px;
  overflow-x:auto;
  border-radius:18px;
  background:#fff;
}

table{
  width:100%;
  border-collapse:collapse;
}

th,td{
  padding:13px 10px;
  border-bottom:1px solid #e8eef5;
  text-align:left;
}

th{
  color:#315276;
  background:#f7faff;
}

/* =========================
   RESPONSIVE
========================= */

@media(max-width:900px){

  .login-layout{
    grid-template-columns:1fr;
  }

  .login-hero{
    min-height:260px;
    padding:35px 20px;
  }

  .brand-name{
    font-size:28px;
  }

  .login-card{
    margin:30px auto;
  }

  .image-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .stats-grid{
    grid-template-columns:1fr;
  }

  .admin-layout{
    grid-template-columns:1fr;
  }

  .admin-sidebar{
    min-height:auto;
  }

  .admin-nav{
    flex-direction:row;
    flex-wrap:wrap;
  }
}

@media(max-width:600px){

  .login-hero{
    min-height:220px;
  }

  .logo-mark{
    width:65px;
    height:65px;
    font-size:30px;
  }

  .brand-name{
    font-size:24px;
  }

  .login-card{
    width:calc(100% - 24px);
    padding:26px 20px;
  }

  .login-card h1{
    font-size:26px;
  }

  .topbar{
    height:auto;
    min-height:70px;
    padding:12px 15px;
  }

  .top-user{
    gap:7px;
  }

  .dash{
    width:calc(100% - 20px);
    margin-top:18px;
  }

  .dash .welcome{
    padding:23px;
  }

  .dash .welcome h1{
    font-size:24px;
  }

  .image-grid{
    grid-template-columns:1fr;
  }

  .image-card img{
    height:230px;
  }

  .value{
    flex-direction:column;
    align-items:flex-start;
  }

  .admin-main{
    padding:18px;
  }
}
