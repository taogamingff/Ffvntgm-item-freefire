export default async function handler(req, res) {
  try {
    const { id } = req.query;

    // Chỉ chấp nhận ID 9 chữ số
    if (!id || !/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "ID phải gồm đúng 9 chữ số",
        example: "/images/902052005.png"
      });
    }

    /*
     * Nguồn dữ liệu Free Fire Items Library.
     * API cố gắng lấy ảnh theo ID từ thư viện.
     */
    const sources = [
      `https://ff-item.netlify.app/Items/${id}.png`,
      `https://ff-item.netlify.app/items/${id}.png`,
      `https://ff-item.netlify.app/assets/${id}.png`,
      `https://ff-item.netlify.app/images/${id}.png`
    ];

    for (const source of sources) {
      try {
        const response = await fetch(source, {
          headers: {
            "User-Agent": "FFVNTGM-Item-API/1.0"
          }
        });

        if (!response.ok) continue;

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.startsWith("image/")) continue;

        const buffer = Buffer.from(await response.arrayBuffer());

        if (!buffer.length) continue;

        res.setHeader(
          "Content-Type",
          contentType.includes("webp")
            ? "image/webp"
            : contentType.includes("jpeg")
              ? "image/jpeg"
              : "image/png"
        );

        res.setHeader(
          "Cache-Control",
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
        );

        res.setHeader("Access-Control-Allow-Origin", "*");

        return res.status(200).send(buffer);
      } catch {
        // thử nguồn tiếp theo
      }
    }

    return res.status(404).json({
      success: false,
      error: "Không tìm thấy ảnh của Item ID",
      id
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ",
      message: error.message
    });
  }
}
