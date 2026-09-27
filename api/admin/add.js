import {
  put,
  list
} from "@vercel/blob";

function checkAuth(req) {
  const password =
    req.headers["x-admin-password"];

  return (
    password &&
    password === process.env.ADMIN_PASSWORD
  );
}

function validId(id) {
  return /^\d{9}$/.test(String(id));
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method Not Allowed"
      });
    }

    if (!checkAuth(req)) {
      return res.status(401).json({
        success: false,
        message: "Sai mật khẩu Admin."
      });
    }

    const form = await req.formData();

    const id = String(
      form.get("id") || ""
    ).trim();

    const name = String(
      form.get("name") || ""
    ).trim();

    const type = String(
      form.get("type") || "FREE_FIRE_ITEM"
    ).trim();

    const file = form.get("image");

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID vật phẩm phải đúng 9 chữ số."
      });
    }

    if (!file || typeof file.arrayBuffer !== "function") {
      return res.status(400).json({
        success: false,
        message: "Chưa chọn hình ảnh."
      });
    }

    if (!file.type.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "File phải là hình ảnh."
      });
    }

    if (file.size > 20 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Ảnh tối đa 20MB."
      });
    }

    const extension =
      getExtension(file.type);

    const imagePath =
      `items/${id}.${extension}`;

    await put(
      imagePath,
      file,
      {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type
      }
    );

    // ==========================
    // ĐỌC DATABASE
    // ==========================

    let database = {};

    const current =
      await list({
        prefix: "database/items.json",
        limit: 1
      });

    if (current.blobs.length) {
      const response =
        await fetch(
          current.blobs[0].url
        );

      if (response.ok) {
        database =
          await response.json();
      }
    }

    // ==========================
    // THÊM / CẬP NHẬT
    // ==========================

    database[id] = {
      id,
      name:
        name ||
        `Free Fire Item ${id}`,

      type,

      image:
        `/images/${id}`,

      updated_at:
        new Date().toISOString()
    };

    // ==========================
    // LƯU DATABASE
    // ==========================

    await put(
      "database/items.json",
      JSON.stringify(database, null, 2),
      {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json"
      }
    );

    return res.status(200).json({
      success: true,

      message:
        "Đã thêm vật phẩm thành công.",

      item: {
        id,
        name:
          database[id].name,

        type,

        image:
          `/images/${id}`,

        api:
          `/api/item?id=${id}`,

        page:
          `/id=${id}`
      }
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Không thể thêm vật phẩm.",
      error: error.message
    });
  }
}

function getExtension(type) {
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
  };

  return map[type] || "png";
  }
