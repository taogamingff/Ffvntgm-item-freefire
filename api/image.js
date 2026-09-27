const ITEM_DATA_URL =
  "https://raw.githubusercontent.com/0xMe/ItemID2/main/assets/itemData.json";

const CDN_DATA_URL =
  "https://raw.githubusercontent.com/0xMe/ItemID2/main/assets/cdn.json";

const ICON_LIST_URL =
  "https://raw.githubusercontent.com/0xMe/ItemID2/main/pngs/300x300/list.json";

const FF_RESOURCES_BASE =
  "https://cdn.jsdelivr.net/gh/0xMe/ff-resources@main";

async function getJSON(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FFVNTGM-Item-API"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.json();
}

function findItem(data, id) {
  if (Array.isArray(data)) {
    return data.find(item =>
      String(
        item?.itemID ??
        item?.itemId ??
        item?.id ??
        ""
      ) === id
    );
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  // Trường hợp object có key chính là Item ID
  if (data[id]) {
    return data[id];
  }

  // Trường hợp database là object chứa nhiều item
  for (const item of Object.values(data)) {
    if (!item || typeof item !== "object") {
      continue;
    }

    if (
      String(
        item.itemID ??
        item.itemId ??
        item.id ??
        ""
      ) === id
    ) {
      return item;
    }
  }

  return null;
}

function getIcon(item) {
  if (!item) return null;

  return (
    item.icon ??
    item.iconName ??
    item.Icon ??
    item.IconName ??
    null
  );
}

function searchCDN(cdn, id, icon) {
  if (!cdn) return null;

  if (Array.isArray(cdn)) {
    for (const entry of cdn) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const entryId = String(
        entry.itemID ??
        entry.itemId ??
        entry.id ??
        ""
      );

      const entryIcon = String(
        entry.icon ??
        entry.iconName ??
        entry.name ??
        ""
      );

      if (
        entryId === id ||
        (icon && entryIcon === icon)
      ) {
        return (
          entry.url ??
          entry.image ??
          entry.imageUrl ??
          entry.cdn ??
          null
        );
      }
    }

    return null;
  }

  if (typeof cdn === "object") {
    if (typeof cdn[id] === "string") {
      return cdn[id];
    }

    if (
      icon &&
      typeof cdn[icon] === "string"
    ) {
      return cdn[icon];
    }

    if (cdn[id]?.url) {
      return cdn[id].url;
    }

    if (icon && cdn[icon]?.url) {
      return cdn[icon].url;
    }
  }

  return null;
}

function cleanIconName(icon) {
  if (!icon) return null;

  let value = String(icon).trim();

  // Nếu icon đã là URL
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Bỏ extension nếu database đã có
  value = value.replace(/\.(png|jpg|jpeg|webp)$/i, "");

  // Bỏ slash đầu
  value = value.replace(/^\/+/, "");

  return value;
}

function buildCandidates(id, icon, cdnUrl) {
  const candidates = [];

  if (
    cdnUrl &&
    /^https?:\/\//i.test(cdnUrl)
  ) {
    candidates.push(cdnUrl);
  }

  if (
    icon &&
    /^https?:\/\//i.test(icon)
  ) {
    candidates.push(icon);
  }

  const iconName = cleanIconName(icon);

  if (iconName) {
    /*
     * ff-resources có nhiều nhóm tài nguyên.
     * Thử các đường dẫn thực tế mà ItemID2 sử dụng.
     */
    candidates.push(
      `${FF_RESOURCES_BASE}/pngs/300x300/${iconName}.png`
    );

    candidates.push(
      `${FF_RESOURCES_BASE}/pngs/300x300/${iconName}`
    );

    candidates.push(
      `${FF_RESOURCES_BASE}/pngs/${iconName}.png`
    );

    candidates.push(
      `${FF_RESOURCES_BASE}/icons/${iconName}.png`
    );
  }

  /*
   * Fallback chỉ khi icon trong database chính là ID.
   */
  candidates.push(
    `${FF_RESOURCES_BASE}/pngs/300x300/${id}.png`
  );

  return [...new Set(candidates)];
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FFVNTGM-Item-API"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    return null;
  }

  const type =
    response.headers.get("content-type") || "";

  if (!type.toLowerCase().startsWith("image/")) {
    return null;
  }

  return {
    buffer: Buffer.from(
      await response.arrayBuffer()
    ),
    type
  };
}

export default async function handler(req, res) {
  const id = String(
    req.query?.id || ""
  ).trim();

  if (!/^\d{9}$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: "INVALID_ID",
      message:
        "Item ID phải gồm đúng 9 chữ số.",
      id
    });
  }

  try {
    /*
     * Tải database chính.
     */
    const itemData =
      await getJSON(ITEM_DATA_URL);

    const item =
      findItem(itemData, id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "ITEM_NOT_FOUND",
        id,
        message:
          "Không có Item ID này trong ItemID2."
      });
    }

    const icon =
      getIcon(item);

    /*
     * CDN mapping là nguồn chính cho
     * những item không có ảnh trực tiếp.
     */
    let cdnData = null;

    try {
      cdnData =
        await getJSON(CDN_DATA_URL);
    } catch (_) {
      cdnData = null;
    }

    const cdnUrl =
      searchCDN(
        cdnData,
        id,
        icon
      );

    /*
     * Tạo danh sách URL ảnh dựa trên
     * dữ liệu thực tế, không redirect.
     */
    const candidates =
      buildCandidates(
        id,
        icon,
        cdnUrl
      );

    /*
     * Thử từng ảnh.
     */
    for (const imageUrl of candidates) {
      try {
        const image =
          await downloadImage(
            imageUrl
          );

        if (!image) {
          continue;
        }

        /*
         * QUAN TRỌNG:
         * Không redirect.
         *
         * Vercel tải ảnh về rồi trả
         * trực tiếp cho trình duyệt.
         *
         * URL vẫn là:
         * /images/902052005.png
         */

        res.setHeader(
          "Content-Type",
          image.type
        );

        res.setHeader(
          "Cache-Control",
          "public, max-age=31536000, immutable"
        );

        res.setHeader(
          "X-FF-Item-ID",
          id
        );

        res.setHeader(
          "X-FF-Item-Source",
          "ItemID2 / ff-resources"
        );

        return res
          .status(200)
          .send(image.buffer);

      } catch (error) {
        console.error(
          "IMAGE SOURCE ERROR:",
          imageUrl,
          error.message
        );
      }
    }

    /*
     * Không có ảnh.
     */
    return res.status(404).json({
      success: false,
      error: "IMAGE_NOT_FOUND",
      id,
      icon,
      message:
        "Đã tìm thấy Item ID nhưng ff-resources không trả về ảnh tương ứng.",
      checkedSources: candidates.length
    });

  } catch (error) {
    console.error(
      "FFVNTGM API ERROR:",
      error
    );

    return res.status(503).json({
      success: false,
      error: "SOURCE_UNAVAILABLE",
      message:
        "Không thể tải dữ liệu ItemID2/ff-resources.",
      detail:
        error?.message || "Unknown error"
    });
  }
        }
