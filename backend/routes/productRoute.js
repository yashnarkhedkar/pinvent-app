const express = require("express");
const router = express.Router();
const protect = require("../middleWare/authMiddleware");
const {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  updateQuantity,
  getUsersWithZeroQuantityProducts
} = require("../controllers/productController");
const { upload } = require("../utils/fileUpload");

router.post("/", protect, upload.single("image"), createProduct);
router.post("/update", updateQuantity);
router.patch("/:id", protect, upload.single("image"), updateProduct);
router.get("/", protect, getProducts);
router.get("/:id", protect, getProduct);
router.delete("/:id", protect, deleteProduct);
router.get("/scheduler/outofstock", getUsersWithZeroQuantityProducts);

module.exports = router;
