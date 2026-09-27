import { list } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    const id = String(req.query?.id || "").trim();
    const ext = String(req.query?.ext || "png").toLowerCase();

    if (!/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "ID phải gồm đúng 9 chữ số"
      });
    }

    const allowed = ["png", "jpg", "jpeg", "webp"];

    if (!allowed.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: "Định dạng ảnh không được hỗ trợ"
      });
    }

    const result = await list({
      prefix: `items/${id}.`,
      limit: 20
    });

    const file = result.blobs?.find(blob => {
      const name = blob.pathname.toLowerCase();
      return (
        name === `items/${id}.${ext}` ||
        name === `items/${id}.png` ||
        name === `items/${id}.jpg` ||
        name === `items/${id}.jpeg` ||
        name === `items/${id}.webp`
      );
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy ảnh vật phẩm",
        id,
        image: null
      });
    }

    const response = await fetch(file.url);

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: "Không thể tải ảnh từ Blob"
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    const contentType =
      file.pathname.endsWith(".png")
        ? "image/png"
        : file.pathname.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );

    return res.status(200).send(buffer);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ",
      message: error?.message || "Unknown error"
    });
  }
}
