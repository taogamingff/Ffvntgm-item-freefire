import { list } from "@vercel/blob";

function getId(value) {
  if (!value) return "";

  return String(value)
    .replace(/\D/g, "");
}

export default async function handler(req, res) {
  try {
    const id = getId(req.query?.id);

    if (!/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "ID phải gồm đúng 9 chữ số."
      });
    }

    const result = await list({
      prefix: `items/${id}.`,
      limit: 10
    });

    if (!result.blobs.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hình ảnh vật phẩm."
      });
    }

    const blob = result.blobs[0];

    const response = await fetch(blob.url);

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        message: "Không thể tải hình ảnh."
      });
    }

    const contentType =
      response.headers.get("content-type") ||
      "image/png";

    const arrayBuffer =
      await response.arrayBuffer();

    res.setHeader(
      "Content-Type",
      contentType
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );

    return res.status(200).send(
      Buffer.from(arrayBuffer)
    );

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ."
    });
  }
}
