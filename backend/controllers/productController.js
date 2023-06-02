const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

// Create Prouct
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, cardNumber, weight, quantity, price, description } = req.body;

  //   Validation
  if (!name || !category || !cardNumber || !weight || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  // Handle Image upload
  let fileData = {};
  // Set your Cloudinary credentials (key and secret)
  cloudinary.config({
    cloud_name: 'dhfswf7lz',
    api_key: '382291649831429',
    api_secret: 'qvAiNli23-jGdtr4l6ZPQPt-rdw'
  });

  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Inventron",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create Product
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    cardNumber,
    weight,
    quantity,
    available : quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).json(product);
});

// Get all Products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(products);
});

// Get single product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  res.status(200).json(product);
});

// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  await product.remove();
  res.status(200).json({ message: "Product deleted." });
});

// Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, weight, cardNumber, price, description } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update Product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      available : quantity,
      cardNumber,
      weight,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);
});

const updateQuantity = asyncHandler(async (req, res) => {
  const cards = {
    "17003E845DF0" : "0004097117",
    "17003E35415D" : "0004076865",
    "18002B5F1D71" : "0002842397",
  }
  let { cardNumber, weight } = req.body;
  console.log("Weight ", weight);
  if(weight < 0){
    res.status(200).send("Weight cannot be negative!!");
    return ;
  }
  const filteredCardNumber = cards[cardNumber];

  const product = await Product.findOne({ cardNumber: filteredCardNumber });
  
  if (product) {
    let receivedWeight = parseFloat(weight).toFixed(2);
    const recordWeight = parseInt(product.weight);
    receivedWeight = Math.floor(receivedWeight / recordWeight) * recordWeight;

    console.log("Corrected weight ", receivedWeight);

    const updatedQuantity = receivedWeight / recordWeight;

    console.log("quantity", product.available, " ", updatedQuantity);
    
    if(product.available === "0"){
      res.status(200).send("Product Quantity becomes zero!!");
      return ;
    }
    product.available -= updatedQuantity;

    await product.save();
    console.log(`Record found. Updated quantity: ${product.available}`);
  } else {
    console.log('Card number not found in the database');
  }
  res.sendStatus(200);
});


module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  updateQuantity
};
