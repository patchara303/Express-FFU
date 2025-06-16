const Product = require("../models/Product");
const Category = require("../models/Category");
const Promotion = require("../models/Promotion");
const { v4: uuidv4 } = require("uuid");

// 📌 Add a product
const addProduct = async (req, res) => {
  try {
    const { categoryId, productName, productCode, description, price, stockQuantity, grades, units } = req.body;
    const imageUrls = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    if (req.user.role !== "seller") {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์เพิ่มสินค้า" });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ error: "❌ ไม่พบ Category ในระบบ" });
    }

    const finalProductCode = productCode || uuidv4();

    const newProduct = new Product({
      productCode: finalProductCode,
      categoryId,
      userId: req.user.id,
      productName,
      description,
      price,
      stockQuantity,
      grades: grades || ["A+", "B+", "C+", "D+"], // Default grades if not provided
      units: units || ["กิโลกรัม", "ตัน"], // Default units if not provided
      imageUrls,
      sold: 0, // Initialize sold
    });

    await newProduct.save();
    res.status(201).json({ message: "✅ เพิ่มสินค้าเรียบร้อย", product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("categoryId", "name")
      .populate("promotionId", "promotionName discountPercentage startDate endDate isActive")
      .populate("userId", "username role");
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("categoryId", "name")
      .populate("promotionId", "promotionName discountPercentage startDate endDate isActive")
      .populate("userId", "username role")
      .populate("reviews.userId", "username");

    if (!product) return res.status(404).json({ error: "ไม่พบสินค้า" });

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get popular products
const getPopularProducts = async (req, res) => {
  try {
    const { limit = 5, categoryId } = req.query;
    const query = categoryId ? { categoryId } : {};

    const products = await Product.aggregate([
      { $match: query },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
        },
      },
      { $sort: { averageRating: -1, createdAt: -1 } },
      // Ensure uniqueness by productCode
      {
        $group: {
          _id: "$productCode",
          doc: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$doc" },
      },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "promotions",
          localField: "promotionId",
          foreignField: "_id",
          as: "promotionId",
        },
      },
      { $unwind: { path: "$promotionId", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productCode: 1,
          productName: 1,
          price: 1,
          stockQuantity: 1,
          imageUrls: 1,
          sold: 1,
          grades: 1,
          units: 1,
          promotionId: {
            promotionName: 1,
            discountPercentage: 1,
            startDate: 1,
            endDate: 1,
            isActive: 1,
          },
        },
      },
    ]);

    res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching popular products:', err);
    res.status(500).json({ error: "Server error", data: [] });
  }
};

// 📌 Get promotional products
const getPromotionalProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const now = new Date();

    const products = await Product.aggregate([
      {
        $lookup: {
          from: "promotions",
          localField: "promotionId",
          foreignField: "_id",
          as: "promotionId",
        },
      },
      { $unwind: { path: "$promotionId", preserveNullAndEmptyArrays: false } },
      {
        $match: {
          "promotionId.isActive": true,
          "promotionId.startDate": { $lte: now },
          "promotionId.endDate": { $gte: now },
        },
      },
      { $limit: parseInt(limit) },
      {
        $project: {
          productCode: 1,
          productName: 1,
          price: 1,
          stockQuantity: 1,
          imageUrls: 1,
          sold: 1,
          grades: 1,
          units: 1,
          promotionId: {
            promotionName: 1,
            discountPercentage: 1,
            startDate: 1,
            endDate: 1,
            isActive: 1,
          },
        },
      },
    ]);

    res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching promotional products:', err);
    res.status(500).json({ error: "Server error", data: [] });
  }
};

// 📌 Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, description, price, stockQuantity, unit, grades, units, categoryId } = req.body;
    const newImageUrls = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "ไม่พบสินค้า" });

    if (req.user.role !== "seller" || product.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์แก้ไขสินค้านี้" });
    }

    const updates = {
      productName: productName || product.productName,
      description: description || product.description,
      price: price || product.price,
      stockQuantity: stockQuantity || product.stockQuantity,
      unit: unit || product.unit,
      grades: grades || product.grades,
      units: units || product.units,
      categoryId: categoryId || product.categoryId,
      imageUrls: newImageUrls.length > 0 ? newImageUrls : product.imageUrls,
    };

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });

    res.status(200).json({ message: "แก้ไขสินค้าเรียบร้อย", product: updatedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "ไม่พบสินค้า" });

    if (req.user.role !== "seller" || product.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบสินค้านี้" });
    }

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "ลบสินค้าเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Add promotion to product
const addPromotionToProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { promotionName, description, discountPercentage, startDate, endDate } = req.body;

    if (!promotionName || !discountPercentage || !startDate || !endDate) {
      return res.status(400).json({ error: "❌ กรุณากรอกข้อมูลโปรโมชั่นให้ครบถ้วน" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "❌ ไม่พบสินค้า" });

    if (req.user.role !== "seller" || product.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์เพิ่มโปรโมชั่นให้สินค้านี้" });
    }

    const existingPromotion = await Promotion.findById(product.promotionId);
    if (existingPromotion) {
      return res.status(400).json({ error: "❌ สินค้านี้มีโปรโมชันอยู่แล้ว" });
    }

    const promotion = new Promotion({
      promotionName,
      description,
      discountPercentage,
      startDate,
      endDate,
    });

    await promotion.save();

    product.promotionId = promotion._id;
    await product.save();

    res.status(200).json({ message: "✅ เพิ่มโปรโมชั่นให้สินค้าสำเร็จ", product, promotion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Update promotion
const updatePromotionOfProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { promotionName, description, discountPercentage, startDate, endDate } = req.body;

    if (!promotionName || !discountPercentage || !startDate || !endDate) {
      return res.status(400).json({ error: "❌ กรุณากรอกข้อมูลโปรโมชั่นให้ครบถ้วน" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "❌ ไม่พบสินค้า" });

    if (req.user.role !== "seller" || product.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์แก้ไขโปรโมชั่นของสินค้านี้" });
    }

    const promotion = await Promotion.findById(product.promotionId);
    if (!promotion) return res.status(404).json({ error: "❌ ไม่พบโปรโมชั่นของสินค้านี้" });

    promotion.promotionName = promotionName;
    promotion.description = description;
    promotion.discountPercentage = discountPercentage;
    promotion.startDate = startDate;
    promotion.endDate = endDate;
    await promotion.save();

    res.status(200).json({ message: "✅ แก้ไขโปรโมชั่นสำเร็จ", promotion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Remove promotion
const removePromotionFromProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "❌ ไม่พบสินค้า" });

    if (req.user.role !== "seller" || product.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์ลบโปรโมชั่น" });
    }

    const promotion = await Promotion.findById(product.promotionId);
    if (!promotion) return res.status(404).json({ error: "❌ สินค้านี้ไม่มีโปรโมชั่น" });

    product.promotionId = null;
    await product.save();
    await Promotion.findByIdAndDelete(promotion._id);

    res.status(200).json({ message: "✅ ลบโปรโมชั่นสำเร็จ", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Add review
const addReviewToProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ error: "❌ กรุณาระบุคะแนน (rating)" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "❌ ไม่พบสินค้า" });
    }

    const review = {
      userId: req.user.id,
      rating,
      comment,
    };

    product.reviews.push(review);
    await product.save();

    res.status(201).json({ message: "✅ เพิ่มรีวิวสำเร็จ", reviews: product.reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Update review
const updateReviewOnProduct = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "❌ ไม่พบสินค้า" });
    }

    const review = product.reviews.find((rev) => rev._id.toString() === reviewId);
    if (!review) {
      return res.status(404).json({ error: "❌ ไม่พบรีวิวที่ต้องการแก้ไข" });
    }

    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์แก้ไขรีวิวนี้" });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await product.save();

    res.status(200).json({ message: "✅ แก้ไขรีวิวสำเร็จ", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get reviews
const getReviewsFromProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("reviews.userId", "username");
    if (!product) {
      return res.status(404).json({ error: "ไม่พบสินค้า" });
    }

    res.status(200).json(product.reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Delete review
const deleteReviewFromProduct = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "❌ ไม่พบสินค้า" });
    }

    if (!product.reviews || product.reviews.length === 0) {
      return res.status(404).json({ error: "❌ สินค้านี้ยังไม่มีรีวิว" });
    }

    const review = product.reviews.find((rev) => rev._id.toString() === reviewId);
    if (!review) {
      return res.status(404).json({ error: "❌ ไม่พบรีวิว" });
    }

    if (!review.userId || review.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์ลบรีวิวของผู้อื่น" });
    }

    product.reviews = product.reviews.filter((rev) => rev._id.toString() !== reviewId);
    await product.save();

    res.status(200).json({ message: "✅ ลบรีวิวสำเร็จ", reviews: product.reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getProductById,
  getPopularProducts,
  getPromotionalProducts,
  updateProduct,
  deleteProduct,
  addPromotionToProduct,
  updatePromotionOfProduct,
  removePromotionFromProduct,
  addReviewToProduct,
  updateReviewOnProduct,
  getReviewsFromProduct,
  deleteReviewFromProduct,
};