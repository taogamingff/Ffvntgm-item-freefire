import { list } from "@vercel/blob";

function getId(value) {
  if (!value) return "";

  let id = String(value).trim();

  if (id.startsWith("id=")) {
    id = id.substring(3);
  }

  return id.replace(/\D/g, "");
}

export default async function handler(req, res) {
  try {
    const id = getId(
      req.query?.id ||
      req.query?.item_id ||
      req.query?.itemId
    );

    if (!/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ITEM_ID",
        message: "ID vật phẩm phải gồm đúng 9 chữ số.",
        example: "/id=902052005"
      });
    }

    const result = await list({
      prefix: "database/items.json",
      limit: 1
    });

    let database = {};

    if (result.blobs.length > 0) {
      const databaseUrl = result.blobs[0].url;

      const response = await fetch(databaseUrl);

      if (response.ok) {
        database = await response.json();
      }
    }

    const item = database[id];

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "ITEM_NOT_FOUND",
        message: "ID vật phẩm chưa có trong kho dữ liệu FFVNTGM.",
        item_id: id,
        add_url: "/admin"
      });
    }

    const imageUrl =
      `${getBaseUrl(req)}/images/${id}`;

    return res.status(200).json({
      success: true,

      item: {
        id,
        name: item.name || `Free Fire Item ${id}`,
        type: item.type || "FREE_FIRE_ITEM",
        image: imageUrl
      },

      urls: {
        item: `${getBaseUrl(req)}/id=${id}`,
        api: `${getBaseUrl(req)}/api/item?id=${id}`,
        image: imageUrl
      },

      updated_at: item.updated_at || null
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Không thể đọc dữ liệu vật phẩm."
    });
  }
}

function getBaseUrl(req) {
  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host;

  const protocol =
    req.headers["x-forwarded-proto"] ||
    "https";

  return `${protocol}://${host}`;
}
