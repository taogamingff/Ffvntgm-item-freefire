export default async function handler(req, res) {
  try {
    const id = String(req.query?.id || "").trim();

    if (!/^\d{9}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "ID phải gồm đúng 9 chữ số"
      });
    }

    /*
      Nguồn dữ liệu Free Fire Item Database.
      Dữ liệu công khai có item ID và mapping CDN/icon.
    */

    const dataUrls = [
      "https://raw.githubusercontent.com/jinix6/ItemID/main/assets/itemData.json",
      "https://raw.githubusercontent.com/0xMe/ItemID2/main/assets/itemData.json"
    ];

    let itemData = null;

    for (const url of dataUrls) {
      try {
        const response = await fetch(url);

        if (!response.ok) continue;

        const json = await response.json();

        if (json) {
          itemData = json;
          break;
        }
      } catch (_) {}
    }

    if (!itemData) {
      return res.status(503).json({
        success: false,
        error: "Không tải được dữ liệu Free Fire Item"
      });
    }

    /*
      Tìm ID trong nhiều dạng JSON khác nhau.
    */

    let item = null;

    if (Array.isArray(itemData)) {

      item = itemData.find(x =>
        String(
          x.itemID ??
          x.itemId ??
          x.id ??
          x.ID ??
          ""
        ) === id
      );

    } else if (typeof itemData === "object") {

      if (itemData[id]) {
        item = itemData[id];
      }

      if (!item) {
        for (const value of Object.values(itemData)) {

          if (!value || typeof value !== "object") continue;

          const currentId = String(
            value.itemID ??
            value.itemId ??
            value.id ??
            value.ID ??
            ""
          );

          if (currentId === id) {
            item = value;
            break;
          }
        }
      }
    }

    /*
      Nếu tìm được URL ảnh trực tiếp trong dữ liệu
      thì trả ảnh đó.
    */

    if (item) {

      const possibleImages = [
        item.icon,
        item.iconUrl,
        item.iconURL,
        item.image,
        item.imageUrl,
        item.imageURL,
        item.cdn,
        item.url,
        item.iconName
      ];

      let imageUrl = possibleImages.find(
        x =>
          typeof x === "string" &&
          /^https?:\/\//i.test(x)
      );

      /*
        Nếu dữ liệu chỉ có tên icon,
        thử CDN của ff-resources.
      */

      if (!imageUrl) {

        const iconName =
          item.iconName ||
          item.icon ||
          item.image;

        if (
          typeof iconName === "string" &&
          iconName.length > 0 &&
          !iconName.startsWith("http")
        ) {

          imageUrl =
            `https://raw.githubusercontent.com/0xMe/ff-resources/main/assets/${iconName}.png`;
        }
      }

      if (imageUrl) {

        const imageResponse =
          await fetch(imageUrl);

        if (imageResponse.ok) {

          const contentType =
            imageResponse.headers.get(
              "content-type"
            ) || "image/png";

          const buffer =
            Buffer.from(
              await imageResponse.arrayBuffer()
            );

          res.setHeader(
            "Content-Type",
            contentType
          );

          res.setHeader(
            "Cache-Control",
            "public, max-age=86400"
          );

          return res.status(200).send(buffer);
        }
      }
    }

    /*
      Không tìm thấy ID.
    */

    return res.status(404).json({
      success: false,
      found: false,
      id,
      error: "Không tìm thấy ảnh cho Item ID này"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      error: "API Error",
      message: error.message
    });
  }
            }
