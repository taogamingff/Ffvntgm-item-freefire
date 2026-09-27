export default async function handler(req, res) {
  try {
    // ==============================
    // LẤY ID TỪ NHIỀU KIỂU URL
    // ==============================

    let rawId =
      req.query?.id ||
      req.query?.item_id ||
      req.query?.itemId ||
      "";

    rawId = String(rawId).trim();

    // Hỗ trợ trường hợp URL bị truyền nguyên dạng:
    // /id=123456789
    if (rawId.startsWith("id=")) {
      rawId = rawId.substring(3);
    }

    // Chỉ lấy chữ số
    const id = rawId.replace(/\D/g, "");

    // ==============================
    // KIỂM TRA ID 9 SỐ
    // ==============================

    if (!/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ITEM_ID",
        message: "ID vật phẩm Free Fire phải gồm đúng 9 chữ số.",
        received: rawId,
        example: "/id=123456789"
      });
    }

    // ==============================
    // URL ẢNH
    // ==============================

    const imageUrl =
      `https://iconapi.wasmer.app/${encodeURIComponent(id)}`;

    // ==============================
    // KIỂM TRA ẢNH
    // ==============================

    let imageAvailable = false;
    let contentType = null;

    try {
      const response = await fetch(imageUrl, {
        method: "HEAD"
      });

      imageAvailable = response.ok;

      contentType =
        response.headers.get("content-type") || null;
    } catch (error) {
      imageAvailable = false;
    }

    // ==============================
    // TRẢ JSON
    // ==============================

    return res.status(200).json({
      success: true,

      item: {
        id: id,
        type: "FREE_FIRE_ITEM"
      },

      image: {
        url: imageUrl,
        available: imageAvailable,
        content_type: contentType
      },

      urls: {
        api: `/api/item?id=${id}`,
        item: `/id=${id}`,
        image: imageUrl
      },

      html: `<img src="${imageUrl}" alt="Free Fire Item ${id}" />`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Không thể xử lý ID vật phẩm.",
      details: error.message
    });
  }
        }
