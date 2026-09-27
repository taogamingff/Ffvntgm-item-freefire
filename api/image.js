const IMAGE_SOURCES = [
  "https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/{id}.png",
  "https://raw.githubusercontent.com/ShahGCreator/icon/main/PNG/{id}.png",
  "https://cdn.jsdelivr.net/gh/XD-jeef/FF-icon@main/PNG/{id}.png"
];

async function checkImage(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "FFVNTGM-Item-API/1.0"
      }
    });

    if (!response.ok) return false;

    const type =
      response.headers.get("content-type") || "";

    return type.toLowerCase().startsWith("image/");
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const id = String(req.query?.id || "").trim();

  if (!/^\d{9}$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: "INVALID_ID",
      message: "Item ID phải gồm đúng 9 chữ số."
    });
  }

  try {
    for (const template of IMAGE_SOURCES) {
      const imageUrl =
        template.replace("{id}", id);

      const exists =
        await checkImage(imageUrl);

      if (exists) {
        res.setHeader(
          "Cache-Control",
          "public, max-age=86400, s-maxage=86400"
        );

        return res.redirect(302, imageUrl);
      }
    }

    return res.status(404).json({
      success: false,
      error: "IMAGE_NOT_FOUND",
      id,
      message:
        "Không tìm thấy icon cho Item ID này trong các nguồn ảnh."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "API_ERROR",
      message:
        "Không thể xử lý yêu cầu.",
      detail:
        error?.message || "Unknown error"
    });
  }
}
