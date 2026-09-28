const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");

// Convert slug to readable name
function formatName(value) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Map DummyJSON categories to your store categories
const categoryMap = {
  beauty: "Beauty",
  fragrances: "Fragrances",
  furniture: "Furniture",
  groceries: "Groceries",
  "home-decoration": "Home Decoration",
  "kitchen-accessories": "Kitchen Accessories",
  laptops: "Laptops",
  "mens-shirts": "Mens Shirts",
  "mens-shoes": "Mens Shoes",
  "mens-watches": "Mens Watches",
  "mobile-accessories": "Mobile Accessories",

  // Extra categories mapped into your main store categories
  "skin-care": "Beauty",
  tablets: "Electronics",
  smartphones: "Electronics",
  "womens-bags": "Fashion",
  "womens-dresses": "Fashion",
  "womens-jewellery": "Fashion",
  "womens-shoes": "Fashion",
  "tops": "Fashion",
  "sunglasses": "Fashion",
  "sports-accessories": "Sports",
  "vehicle": "Electronics"
};

// Find or create category
async function getCategory(categoryName) {
  let category = await Category.findOne({
    name: categoryName
  });

  if (!category) {
    category = await Category.create({
      name: categoryName,
      description: `${categoryName} products`
    });

    console.log(`Created category: ${categoryName}`);
  }

  return category._id;
}

// Find or create brand
async function getBrand(brandName) {
  if (!brandName) {
    return null;
  }

  const name = formatName(brandName);

  let brand = await Brand.findOne({
    name
  });

  if (!brand) {
    brand = await Brand.create({
      name,
      description: `${name} products`
    });

    console.log(`Created brand: ${name}`);
  }

  return brand._id;
}

async function importProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Get ALL available DummyJSON products
    const response = await fetch(
      "https://dummyjson.com/products?limit=0"
    );

    if (!response.ok) {
      throw new Error("Failed to download products");
    }

    const data = await response.json();

    console.log(`Downloaded ${data.products.length} products`);

    // Delete existing products
    await Product.deleteMany({});

    console.log("Old products removed");

    const products = [];

    for (const item of data.products) {

      // Convert DummyJSON category
      const storeCategory =
        categoryMap[item.category] ||
        "Electronics";

      // Get MongoDB category ID
      const categoryId =
        await getCategory(storeCategory);

      // Get MongoDB brand ID
      const brandId =
        await getBrand(item.brand);

      const discountPrice = Math.round(
        item.price *
        (1 - (item.discountPercentage || 0) / 100)
      );

      const product = {
        name: item.title,

        description: item.description,

        price: item.price,

        discountPrice,

        category: categoryId,

        brand: brandId,

        // Keep online images
        images: [
          ...(item.images || []),
          item.thumbnail
        ].filter(Boolean),

        stock: item.stock || 10,

        sku: `NM-${item.id}`,

        ratingsAverage: item.rating || 0,

        ratingsCount:
          Math.floor(Math.random() * 500) + 20,

        isFeatured:
          (item.rating || 0) >= 4.5,

        isActive: true,

        tags: [
          storeCategory,
          item.category,
          item.brand || ""
        ].filter(Boolean)
      };

      products.push(product);
    }

    await Product.insertMany(products);

    console.log("");
    console.log("======================================");
    console.log(
      `SUCCESS: ${products.length} products imported`
    );
    console.log("======================================");
    console.log("");
    console.log("All products use online images.");
    console.log("Categories mapped automatically.");
    console.log("Brands created automatically.");
    console.log("");

    process.exit(0);

  } catch (error) {
    console.error("");
    console.error("IMPORT ERROR:");
    console.error(error);
    console.error("");

    process.exit(1);
  }
}

importProducts();