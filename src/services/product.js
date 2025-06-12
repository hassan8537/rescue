const Product = require("../models/Product");
const User = require("../models/User");
const productSchema = require("../schemas/product");
const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");

class Service {
  constructor() {
    this.user = User;
    this.product = Product;
  }

  async createProduct(req, res) {
    try {
      const user = req.user;
      const body = req.body;

      console.log("req.body:", req.body);
      console.log("req.files:", req.files);
      console.log("User role:", user.role);

      const media = req.files?.["media"];
      const allowedRole = "shop-owner";

      if (user.role !== allowedRole) {
        return handlers.response.failed({
          res,
          message: "Only shop owners are allowed to add products"
        });
      }

      const existingProduct = await this.product.findOne({
        title: { $regex: `^${body.title}$`, $options: "i" }
      });

      if (existingProduct) {
        return handlers.response.failed({
          res,
          message: "A product with the same title already exists"
        });
      }

      const createPayload = {
        ...(user._id && { userId: user._id }),
        ...(body.title && { title: body.title }),
        ...(media?.length > 0 && {
          media: media.map((file) => file?.path)
        }),
        ...(body.price && { price: body.price }),
        ...(body.quantity && { quantity: body.quantity }),
        ...(body.description && { description: body.description })
      };

      if (Object.keys(createPayload).length === 0) {
        return handlers.response.failed({
          res,
          message: "No valid fields provided to create"
        });
      }

      const newProduct = await this.product.create(createPayload);

      return handlers.response.success({
        res,
        message: "Product created successfully",
        data: newProduct
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async editProduct(req, res) {
    try {
      const { user, body, params, files } = req;
      const { productId } = params;

      console.log("req.body:", body);
      console.log("req.files:", files);
      console.log("User role:", user.role);

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
        return handlers.response.failed({
          res,
          message: "Product not found"
        });
      }

      if (body.title) {
        const existingProduct = await this.product.findOne({
          _id: { $ne: productId },
          title: { $regex: `^${body.title}$`, $options: "i" }
        });

        if (existingProduct) {
          return handlers.response.failed({
            res,
            message: "Another product with the same title already exists"
          });
        }
      }

      const media = files?.["media"];

      const editPayload = {
        ...(body.title && { title: body.title }),
        ...(media?.length > 0 && { media: media.map((file) => file.path) }),
        ...(body.price && { price: body.price }),
        ...(body.quantity && { quantity: body.quantity }),
        ...(body.description && { description: body.description })
      };

      if (Object.keys(editPayload).length === 0) {
        return handlers.response.failed({
          res,
          message: "No valid fields provided to update"
        });
      }

      Object.assign(product, editPayload);

      await product.save();

      return handlers.response.success({
        res,
        message: "Product updated successfully",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { user: currentUser, params } = req;
      const { productId } = params;

      const product = await this.product.findOneAndDelete({
        _id: productId,
        userId: currentUser._id
      });

      if (!product) {
        return handlers.response.failed({
          res,
          message: "Product not found or already deleted"
        });
      }

      return handlers.response.success({
        res,
        message: "Product deleted successfully",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async getProducts(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const filters = {};

      return await pagination({
        response: res,
        table: "Products",
        model: this.product,
        filters,
        page,
        limit,
        sort,
        populate: productSchema.populate
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async deactivateProduct(req, res) {
    try {
      const { user: currentUser, params } = req;
      const { productId } = params;

      const product = await this.product.findOne({
        _id: productId,
        userId: currentUser._id
      });

      if (!product) {
        return handlers.response.failed({
          res,
          message: "Product not found"
        });
      }

      product.isActive = false;
      await product.save();

      return handlers.response.success({
        res,
        message: "Product deactivated",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async activateProduct(req, res) {
    try {
      const { user: currentUser, params } = req;
      const { productId } = params;

      const product = await this.product.findOne({
        _id: productId,
        userId: currentUser._id
      });

      if (!product) {
        return handlers.response.failed({
          res,
          message: "Product not found"
        });
      }

      product.isActive = true;
      await product.save();

      return handlers.response.success({
        res,
        message: "Product activated",
        data: product
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }
}

module.exports = new Service();
