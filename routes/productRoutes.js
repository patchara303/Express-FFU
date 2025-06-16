const express = require("express");
const {
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
} = require("../controllers/productController");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 การจัดการสินค้า
router.post("/", protect, authorizeRoles("seller"), uploadMiddleware.array("image"), addProduct);
router.get("/", getAllProducts);
router.get("/popular", getPopularProducts);
router.get("/promotional", getPromotionalProducts);
router.get("/:id", getProductById);
router.put("/:id", protect, authorizeRoles("seller"), uploadMiddleware.array("image"), updateProduct);
router.delete("/:id", protect, authorizeRoles("seller"), deleteProduct);

// 📌 การจัดการโปรโมชั่น
router.post("/:productId/promotion", protect, authorizeRoles("seller"), addPromotionToProduct);
router.put("/:productId/promotion", protect, authorizeRoles("seller"), updatePromotionOfProduct);
router.delete("/:productId/promotion", protect, authorizeRoles("seller"), removePromotionFromProduct);

// 📌 การจัดการรีวิว
router.post("/:productId/reviews", protect, addReviewToProduct);
router.put("/:productId/reviews/:reviewId", protect, updateReviewOnProduct);
router.get("/:productId/reviews", getReviewsFromProduct);
router.delete("/:productId/reviews/:reviewId", protect, deleteReviewFromProduct);

module.exports = router;