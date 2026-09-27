const IMAGE_SOURCES = [
  "https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/{id}.png",
  "https://raw.githubusercontent.com/ShahGCreator/icon/main/PNG/{id}.png",
  "https://cdn.jsdelivr.net/gh/XD-jeef/FF-icon@main/PNG/{id}.png"
];

export default async function handler(req, res) {
  const id = String(req.query?.id || "").trim();

  // Chỉ nhận đúng 9 số
  if (!/^\d{9}$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: "INVALID_ID",
      message: "ID vật phẩm phải gồm đúng 9 chữ số."
    });
  }

  for (const template of IMAGE_SOURCES) {
    const sourceUrl = template.replace("{id}", id);

    try {
      const response = await fetch(sourceUrl, {
        headers: {
          "User-Agent": "FFVNTGM-Item-API"
        }
      });

      if (!response.ok) {
        continue;
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.startsWith("image/")) {
        continue;
      }

      const buffer = Buffer.from(
        await response.arrayBuffer()
      );

      // QUAN TRỌNG:
      // Trả ảnh trực tiếp từ server của bạn,
      // KHÔNG redirect sang CDN.
      res.setHeader(
        "Content-Type",
        contentType
      );

      res.setHeader(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );

      res.setHeader(
        "Content-Length",
        buffer.length
      );

      return res.status(200).send(buffer);

    } catch (error) {
      console.error(
        "Source error:",
        sourceUrl,
        error.message
      );
    }
  }

  return res.status(404).json({
    success: false,
    error: "IMAGE_NOT_FOUND",
    id,
    message: "Không tìm thấy ảnh cho Item ID này."
  });
}
