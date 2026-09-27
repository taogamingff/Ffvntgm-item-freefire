import { get, put } from "@vercel/blob";

const SOURCE_URL =
  "https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG";

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    // =========================
    // KIỂM TRA ID
    // =========================

    if (!id || !/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "ID phải gồm đúng 9 chữ số",
        example:
          "/images/902052005.png"
      });
    }

    const pathname = `images/${id}.png`;

    // =========================
    // 1. KIỂM TRA ẢNH ĐÃ LƯU
    // =========================

    try {
      const saved = await get(pathname, {
        access: "public"
      });

      if (
        saved &&
        saved.statusCode === 200 &&
        saved.stream
      ) {
        res.statusCode = 200;

        res.setHeader(
          "Content-Type",
          saved.blob.contentType || "image/png"
        );

        res.setHeader(
          "Cache-Control",
          "public, max-age=31536000, immutable"
        );

        res.setHeader(
          "X-FFVNTGM-Storage",
          "BLOB"
        );

        for await (const chunk of saved.stream) {
          res.write(Buffer.from(chunk));
        }

        return res.end();
      }
    } catch (error) {
      // Chưa có ảnh → tải từ nguồn
    }

    // =========================
    // 2. TẢI ẢNH NGUỒN
    // =========================

    const sourceUrl =
      `${SOURCE_URL}/${id}.png`;

    const response = await fetch(
      sourceUrl,
      {
        headers: {
          "User-Agent":
            "FFVNTGM-Item-API/1.0"
        }
      }
    );

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy ảnh vật phẩm",
        id
      });
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "image/png";

    if (!contentType.startsWith("image/")) {
      return res.status(404).json({
        success: false,
        error: "Nguồn không trả về hình ảnh",
        id
      });
    }

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    if (!buffer.length) {
      return res.status(404).json({
        success: false,
        error: "Ảnh rỗng",
        id
      });
    }

    // =========================
    // 3. TỰ ĐỘNG LƯU VÀO BLOB
    // =========================

    await put(
      pathname,
      buffer,
      {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/png",
        cacheControlMaxAge: 31536000
      }
    );

    // =========================
    // 4. TRẢ ẢNH NGAY
    // =========================

    res.statusCode = 200;

    res.setHeader(
      "Content-Type",
      "image/png"
    );

    res.setHeader(
      "Content-Length",
      buffer.length
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "X-FFVNTGM-Storage",
      "BLOB-SAVED"
    );

    return res.send(buffer);

  } catch (error) {
    console.error(
      "FFVNTGM IMAGE API ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ",
      message: error.message
    });
  }
}
