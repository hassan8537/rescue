const Product = require("../models/Product");
const User = require("../models/User");
const productSchema = require("../schemas/product");
const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");

class ProductService {
  constructor() {
    this.user = User;
    this.product = Product;
  }

  _buildProductPayload(body, media) {
    return {
      ...(body.title && { title: body.title }),
      ...(media?.length && { media: media.map((f) => f.path) }),
      ...(body.price && { price: body.price }),
      ...(body.quantity && { quantity: body.quantity }),
      ...(body.description && { description: body.description })
    };
  }

  async _toggleProductStatus(req, res, isActive) {
    try {
      const { user, params } = req;
      const product = await this.product.findOne({
        _id: params.productId,
        userId: user._id
      });

      if (!product) {
        return handlers.response.failed({ res, message: "Product not found" });
      }

      product.isActive = isActive;
      await product.save();

      return handlers.response.success({
        res,
        message: "Success",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async addProduct(req, res) {
    try {
      const { user, body, files } = req;
      const media = files?.["media"];
      if (user.role !== "shop-owner") {
        return handlers.response.failed({
          res,
          message: "Only shop owners are allowed to add products"
        });
      }

      const existing = await this.product.findOne({
        title: { $regex: `^${body.title}$`, $options: "i" }
      });

      if (existing) {
        return handlers.response.failed({
          res,
          message: "A product with the same title already exists"
        });
      }

      const payload = this._buildProductPayload(body, media);
      payload.userId = user._id;

      if (!Object.keys(payload).length) {
        return handlers.response.failed({
          res,
          message: "No valid fields provided to create"
        });
      }

      const product = await this.product.create(payload);
      return handlers.response.success({
        res,
        message: "Success",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async editProduct(req, res) {
    try {
      const { user, body, files, params } = req;
      const { productId } = params;

      if (user.role !== "shop-owner") {
        return handlers.response.failed({
          res,
          message: "Only shop owners are allowed to edit products"
        });
      }

      const product = await this.product.findOne({
        _id: productId,
        userId: user._id
      });

      if (!product) {
        return handlers.response.failed({ res, message: "Product not found" });
      }

      if (body.title) {
        const exists = await this.product.findOne({
          _id: { $ne: productId },
          title: { $regex: `^${body.title}$`, $options: "i" }
        });

        if (exists) {
          return handlers.response.failed({
            res,
            message: "Another product with the same title already exists"
          });
        }
      }

      const media = files?.["media"];
      const updatePayload = this._buildProductPayload(body, media);

      if (!Object.keys(updatePayload).length) {
        return handlers.response.failed({
          res,
          message: "No valid fields provided to update"
        });
      }

      Object.assign(product, updatePayload);
      await product.save();

      return handlers.response.success({
        res,
        message: "Success",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { user, params } = req;
      const product = await this.product.findOneAndDelete({
        _id: params.productId,
        userId: user._id
      });

      if (!product) {
        return handlers.response.failed({ res, message: "Invalid product ID" });
      }

      return handlers.response.success({
        res,
        message: "Success",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getProducts(req, res) {
    try {
      const user = req.user;

      const filters = {};

      if (user.role === "shop-owner") {
        filters.userId = user._id;
      }

      if (user.role === "mechanic") {
        filters.userId = user.shopOwnerId;
      }

      return await pagination({
        res,
        table: "Products",
        model: this.product,
        filters: filters,
        page: req.query.page,
        limit: req.query.limit,
        populate: productSchema.populate
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getProductById(req, res) {
    try {
      const product = await this.product
        .findById(req.params.productId)
        .populate(productSchema.populate);

      if (!product) {
        return handlers.response.failed({ res, message: "Invalid product ID" });
      }

      return handlers.response.success({
        res,
        message: "Success",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async deactivateProduct(req, res) {
    return this._toggleProductStatus(req, res, false);
  }

  async activateProduct(req, res) {
    return this._toggleProductStatus(req, res, true);
  }
}

module.exports = new ProductService();
