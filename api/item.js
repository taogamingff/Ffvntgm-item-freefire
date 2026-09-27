import { list } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    const id = String(
      req.query?.id ||
      req.query?.item ||
      req.query?.item_id ||
      ""
    ).trim();

    if (!/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "ID Free Fire phải gồm đúng 9 chữ số",
        example: "/id=902052005"
      });
    }

    const result = await list({
      prefix: `items/${id}.`,
      limit: 20
    });

    const file = result.blobs?.find(blob =>
      /^items\/\d{9}\.(png|jpg|jpeg|webp)$/i.test(blob.pathname)
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        id,
        found: false,
        message: "Chưa có ảnh cho ID vật phẩm này.",
        image: null
      });
    }

    const ext =
      file.pathname.split(".").pop()?.toLowerCase() || "png";

    const imageUrl =
      `https://ffvntgm-item-freefire.vercel.app/images/${id}.${ext}`;

    return res.status(200).json({
      success: true,
      found: true,
      id,
      image: imageUrl,
      filename: file.pathname.split("/").pop(),
      source: "FFVNTGM Item Database"
    });

  } catch (error) {
    console.error("ITEM ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Không thể đọc dữ liệu vật phẩm",
      message: error?.message || "Unknown error"
    });
  }
}
