const { Query } = require("mongoose");
const handlers = require("./handlers");

const pagination = async ({
  res,
  table,
  model,
  filters = {},
  page = 1,
  limit = 10,
  sort = { createdAt: -1 },
  populate = null
}) => {
  try {
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;
    let data = [];
    let totalCount = 0;

    if (filters.location && filters.maxDistance) {
      const { location, maxDistance } = filters;

      const geoQuery = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: location },
            distanceField: "distance",
            maxDistance: maxDistance,
            spherical: true
          }
        }
      ];

      data = await model.aggregate([
        ...geoQuery,
        { $sort: sort },
        { $skip: skip },
        { $limit: pageSize }
      ]);

      totalCount = (await model.aggregate(geoQuery)).length;
    } else {
      const query = model.find(filters).skip(skip).limit(pageSize).sort(sort);

      if (populate) {
        query.populate(populate);
      }

      data = await query.exec();
      totalCount = await model.countDocuments(filters);
    }

    if (!data.length) {
      return handlers.response.unavailable({
        res,
        message: `No ${table.toLowerCase()} yet.`
      });
    }

    const responseData = {
      results: data,
      totalRecords: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: pageNumber,
      pageSize: pageSize
    };

    return handlers.response.success({
      res,
      message: `${table} retrieved successfully.`,
      data: responseData
    });
  } catch (error) {
    return handlers.response.error({
      res,
      message: "Failed to retrieve records."
    });
  }
};

module.exports = pagination;
