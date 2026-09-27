export default async function handler(req, res) {

  res.setHeader(
    "Content-Type",
    "text/html; charset=utf-8"
  );

  res.status(200).send(`
<!DOCTYPE html>
<html lang="vi">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>FFVNTGM ITEM ADMIN</title>

<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  min-height:100vh;
  padding:20px;
  background:
    radial-gradient(
      circle at top,
      #402000,
      #090909 45%,
      #020202
    );
  color:#fff;
  font-family:Arial,sans-serif;
}

.container{
  max-width:600px;
  margin:auto;
  padding:25px;
  border-radius:24px;
  background:rgba(20,20,20,.85);
  border:1px solid rgba(255,130,0,.3);
  box-shadow:0 20px 70px #000;
}

h1{
  text-align:center;
  margin-top:0;
}

.subtitle{
  text-align:center;
  color:#aaa;
  margin-bottom:25px;
}

label{
  display:block;
  margin:15px 0 7px;
  color:#bbb;
}

input,select{
  width:100%;
  padding:15px;
  border-radius:12px;
  border:1px solid #444;
  background:#111;
  color:#fff;
  outline:none;
}

input:focus,
select:focus{
  border-color:#ff8500;
}

button{
  width:100%;
  margin-top:18px;
  padding:15px;
  border:0;
  border-radius:13px;
  background:linear-gradient(
    135deg,
    #ffb000,
    #ff5a00
  );
  color:#fff;
  font-weight:bold;
  cursor:pointer;
}

.delete{
  background:#8d1717;
}

.result{
  margin-top:20px;
  padding:15px;
  border-radius:12px;
  background:#111;
  white-space:pre-wrap;
  word-break:break-word;
}

.preview{
  max-width:220px;
  max-height:220px;
  display:block;
  margin:20px auto;
  object-fit:contain;
}

</style>

</head>

<body>

<div class="container">

<h1>🔥 FFVNTGM ITEM ADMIN</h1>

<div class="subtitle">
QUẢN LÝ ID VẬT PHẨM FREE FIRE
</div>

<label>Mật khẩu Admin</label>

<input
  id="password"
  type="password"
  placeholder="Nhập mật khẩu Admin"
/>

<label>ID vật phẩm — 9 số</label>

<input
  id="id"
  inputmode="numeric"
  maxlength="9"
  placeholder="902052005"
/>

<label>Tên vật phẩm</label>

<input
  id="name"
  placeholder="Ví dụ: Bundle Free Fire"
/>

<label>Loại vật phẩm</label>

<select id="type">

<option value="FREE_FIRE_ITEM">
FREE_FIRE_ITEM
</option>

<option value="BUNDLE">
BUNDLE
</option>

<option value="CHARACTER">
CHARACTER
</option>

<option value="PET">
PET
</option>

<option value="WEAPON">
WEAPON
</option>

<option value="EMOTE">
EMOTE
</option>

<option value="PARACHUTE">
PARACHUTE
</option>

<option value="OTHER">
OTHER
</option>

</select>

<label>Hình ảnh</label>

<input
  id="image"
  type="file"
  accept="image/png,image/jpeg,image/webp,image/gif"
/>

<img
  id="preview"
  class="preview"
  style="display:none"
/>

<button onclick="addItem()">
➕ THÊM / CẬP NHẬT VẬT PHẨM
</button>

<button
  class="delete"
  onclick="deleteItem()"
>
🗑️ XÓA VẬT PHẨM
</button>

<div
  id="result"
  class="result"
>
Chưa có thao tác.
</div>

</div>

<script>

const idInput =
  document.getElementById("id");

const imageInput =
  document.getElementById("image");

idInput.addEventListener(
  "input",
  () => {
    idInput.value =
      idInput.value
        .replace(/\\D/g,"")
        .slice(0,9);
  }
);

imageInput.addEventListener(
  "change",
  () => {

    const file =
      imageInput.files[0];

    if(!file) return;

    const url =
      URL.createObjectURL(file);

    const preview =
      document.getElementById(
        "preview"
      );

    preview.src = url;
    preview.style.display =
      "block";
  }
);

function password(){
  return document
    .getElementById("password")
    .value;
}

function show(data){
  document
    .getElementById("result")
    .textContent =
      JSON.stringify(
        data,
        null,
        2
      );
}

async function addItem(){

  const id =
    idInput.value.trim();

  if(!/^\\d{9}$/.test(id)){
    show({
      success:false,
      message:
        "ID phải đúng 9 chữ số."
    });
    return;
  }

  const file =
    imageInput.files[0];

  if(!file){
    show({
      success:false,
      message:
        "Hãy chọn ảnh."
    });
    return;
  }

  const form =
    new FormData();

  form.append("id",id);

  form.append(
    "name",
    document
      .getElementById("name")
      .value
  );

  form.append(
    "type",
    document
      .getElementById("type")
      .value
  );

  form.append(
    "image",
    file
  );

  try{

    const response =
      await fetch(
        "/api/admin/add",
        {
          method:"POST",
          headers:{
            "x-admin-password":
              password()
          },
          body:form
        }
      );

    const data =
      await response.json();

    show(data);

  }catch(error){

    show({
      success:false,
      message:
        "Không kết nối được API.",
      error:
        error.message
    });

  }
}

async function deleteItem(){

  const id =
    idInput.value.trim();

  if(!/^\\d{9}$/.test(id)){
    show({
      success:false,
      message:
        "ID phải đúng 9 chữ số."
    });
    return;
