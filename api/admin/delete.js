import {
  del,
  list,
  put
} from "@vercel/blob";

function auth(req) {
  return (
    req.headers["x-admin-password"] &&
    req.headers["x-admin-password"] ===
      process.env.ADMIN_PASSWORD
  );
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method Not Allowed"
      });
    }

    if (!auth(req)) {
      return res.status(401).json({
        success: false,
        message: "Sai mật khẩu Admin."
      });
    }

    const id =
      String(req.body?.id || "")
        .replace(/\D/g, "");

    if (!/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ."
      });
    }

    // Xóa tất cả ảnh của ID
    const files =
      await list({
        prefix: `items/${id}.`,
        limit: 100
      });

    for (const file of files.blobs) {
      await del(file.url);
    }

    // Đọc database
    let database = {};

    const db =
      await list({
        prefix: "database/items.json",
        limit: 1
      });

    if (db.blobs.length) {
      const response =
        await fetch(db.blobs[0].url);

      if (response.ok) {
        database =
          await response.json();
      }
    }

    if (!database[id]) {
      return res.status(404).json({
        success: false,
        message:
          "ID không tồn tại."
      });
    }

    delete database[id];

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
        `Đã xóa vật phẩm ${id}.`
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ."
    });
  }
}
