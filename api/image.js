const SOURCES = [
  {
    data: "https://raw.githubusercontent.com/0xMe/ItemID2/main/assets/itemData.json",
    cdn: "https://raw.githubusercontent.com/0xMe/ItemID2/main/assets/cdn.json"
  },
  {
    data: "https://raw.githubusercontent.com/jinix6/ItemID/main/assets/itemData.json",
    cdn: "https://raw.githubusercontent.com/jinix6/ItemID/main/assets/cdn.json"
  }
];

const CACHE = new Map();

async function getJSON(url) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": "FFVNTGM-Item-API/1.0"
    }
  });

  if (!r.ok) {
    throw new Error(`HTTP ${r.status}`);
  }

  return await r.json();
}

function findItem(data, id) {
  if (Array.isArray(data)) {
    return data.find(item => {
      if (!item || typeof item !== "object") return false;

      return String(
        item.itemID ??
        item.itemId ??
        item.id ??
        item.ID ??
        item["2"] ??
        ""
      ) === id;
    });
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  if (data[id]) {
    return data[id];
  }

  for (const item of Object.values(data)) {
    if (!item || typeof item !== "object") continue;

    const itemId = String(
      item.itemID ??
      item.itemId ??
      item.id ??
      item.ID ??
      item["2"] ??
      ""
    );

    if (itemId === id) {
      return item;
    }
  }

  return null;
}

function getIconName(item) {
  if (!item) return null;

  return (
    item.iconName ??
    item.icon ??
    item.IconName ??
    item["1"] ??
    null
  );
}

function findCDN(cdn, iconName, id) {
  if (!cdn) return null;

  if (Array.isArray(cdn)) {
    for (const item of cdn) {
      if (!item || typeof item !== "object") continue;

      const itemId = String(
        item.itemID ??
        item.itemId ??
        item.id ??
        item.ID ??
        ""
      );

      const icon = String(
        item.iconName ??
        item.icon ??
        item.name ??
        ""
      );

      if (itemId === id || icon === iconName) {
        return (
          item.url ??
          item.image ??
          item.imageUrl ??
          item.cdn ??
          null
        );
      }
    }
  }

  if (typeof cdn === "object") {
    if (cdn[id]) {
      return cdn[id];
    }

    if (iconName && cdn[iconName]) {
      return cdn[iconName];
    }

    for (const [key, value] of Object.entries(cdn)) {
      if (key === id || key === iconName) {
        if (typeof value === "string") {
          return value;
        }

        if (value && typeof value === "object") {
          return (
            value.url ??
            value.image ??
            value.imageUrl ??
            value.cdn ??
            null
          );
        }
      }
    }
  }

  return null;
}

function buildImageCandidates(id, item, cdn) {
  const candidates = [];

  const direct = [
    item?.image,
    item?.imageUrl,
    item?.imageURL,
    item?.iconUrl,
    item?.iconURL,
    item?.url,
    item?.cdn
  ];

  for (const url of direct) {
    if (
      typeof url === "string" &&
      /^https?:\/\//i.test(url)
    ) {
      candidates.push(url);
    }
  }

  const iconName = getIconName(item);

  const cdnUrl = findCDN(
    cdn,
    iconName,
    id
  );

  if (
    typeof cdnUrl === "string" &&
    /^https?:\/\//i.test(cdnUrl)
  ) {
    candidates.push(cdnUrl);
  }

  if (iconName) {
    candidates.push(
      `https://raw.githubusercontent.com/0xMe/ff-resources/main/assets/${iconName}.png`
    );

    candidates.push(
      `https://raw.githubusercontent.com/0xMe/ff-resources/main/icons/${iconName}.png`
    );
  }

  return [...new Set(candidates)];
}

async function getWorkingImage(candidates) {
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "FFVNTGM-Item-API/1.0"
        }
      });

      if (
        response.ok &&
        (
          response.headers.get("content-type") || ""
        ).toLowerCase().startsWith("image/")
      ) {
        return url;
      }
    } catch (_) {}
  }

  return null;
}

export default async function handler(req, res) {
  const id = String(
    req.query?.id || ""
  ).trim();

  if (!/^\d{9}$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: "INVALID_ID",
      message: "ID phải gồm đúng 9 chữ số.",
      example:
        "/images/902052005.png"
    });
  }

  try {
    if (CACHE.has(id)) {
      const cached = CACHE.get(id);

      if (cached.type === "image") {
        return redirectToImage(
          res,
          cached.url
        );
      }
    }

    let foundItem = null;
    let foundCDN = null;

    for (const source of SOURCES) {
      try {
        const data =
          await getJSON(source.data);

        const item =
          findItem(data, id);

        if (item) {
          foundItem = item;

          try {
            foundCDN =
              await getJSON(source.cdn);
          } catch (_) {
            foundCDN = null;
          }

          break;
        }
      } catch (_) {
        continue;
      }
    }

    if (!foundItem) {
      return res.status(404).json({
        success: false,
        error: "ITEM_NOT_FOUND",
        id,
        message:
          "ID chưa có trong dữ liệu Item Database."
      });
    }

    const candidates =
      buildImageCandidates(
        id,
        foundItem,
        foundCDN
      );

    const image =
      await getWorkingImage(candidates);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: "IMAGE_NOT_FOUND",
        id,
        iconName:
          getIconName(foundItem),
        message:
          "Đã tìm thấy Item ID nhưng chưa tìm được URL ảnh hoạt động."
      });
    }

    CACHE.set(id, {
      type: "image",
      url: image
    });

    return redirectToImage(
      res,
      image
    );

  } catch (error) {
    console.error(
      "FFVNTGM ITEM ERROR:",
      error
    );

    return res.status(503).json({
      success: false,
      error: "SOURCE_UNAVAILABLE",
      message:
        "Nguồn dữ liệu Item đang tạm thời không khả dụng.",
      detail:
        error?.message || "Unknown error"
    });
  }
}

function redirectToImage(res, url) {
  res.setHeader(
    "Cache-Control",
    "public, max-age=86400, s-maxage=86400"
  );

  res.setHeader(
    "Location",
    url
  );

  return res.status(302).end();
          }
