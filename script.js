/* =====================================================================
   JBN F-STORE  —  script.js
   All of the website's behavior lives in this one file.

   HOW THIS FILE IS ORGANIZED
     1.  Settings          (store info, demo admin account)
     2.  Menu data         (categories, add-ons, default products)
     3.  Storage helpers   (localStorage / sessionStorage)
     4.  Small utilities   (escape text, money, dates)
     5.  Form validation
     6.  Accounts          (register, log in, log out, profile)
     7.  Page router + access control (who may open which page)
     8.  Product cards + product details window
     9.  Shopping cart
    10.  Menu page         (search + category filter)
    11.  Home page
    12.  User dashboard
    13.  Admin dashboard   (products + users)
    14.  Contact / feedback form
    15.  Click handling + start-up

   IMPORTANT - READ BEFORE PRESENTING
   This is a FRONT-END ONLY demo. Accounts, products and the cart are saved
   in the browser's localStorage, so they exist only in this one browser.
   localStorage is NOT secure: anyone can open DevTools and read or change
   it, so this is NOT real authentication. A real login system with
   protected admin access needs a backend server and a database.

   DEMO ADMIN ACCOUNT (created automatically the first time the site opens)
     Email:    admin@jbnfstore.com
     Password: Admin@123
   ===================================================================== */

"use strict";

/* =====================================================================
   1. SETTINGS
   ===================================================================== */

// Shown in the footer and on the Contact page (edit them here only once).
const STORE_INFO = {
  address: "Juban, Irosin, Sorsogon, PH",
  phone: "(082) 123-4567",
  email: "hello@jbnfstore.com",
  hours: "Daily, 8:00 AM – 11:00 PM"
};

// The one built-in administrator account (demo only - see note above).
const DEFAULT_ADMIN = {
  name: "JBN Administrator",
  email: "admin@gmail.com",
  password: "admin123"
};

const DEFAULT_STOCK = 50;   // starting quantity for the original menu items
const LOW_STOCK_LIMIT = 10; // "Only N left" appears at or below this number
const DELIVERY_FEE = 49;    // shown in the cart summary


/* =====================================================================
   2. MENU DATA  (taken from your original data.js)
   DEFAULT_PRODUCTS is only the STARTING menu. The first time the site opens
   it is copied into localStorage; after that the admin dashboard edits the
   saved copy. "Reset Menu" in the admin dashboard copies this list back.
   Every product has the same shape:
     { id, name, category, categoryLabel, description, image, rating,
       basePrice, badges[], variantGroups[], addonGroup, ingredients[] }
   (quantity is added automatically - see DEFAULT_STOCK in section 1)
   ===================================================================== */

/* ---------- Popular categories shown on the homepage & used
   as the menu page filter chips ---------- */
const CATEGORIES = [
  { key: "burgers", label: "Burgers", icon: "🍔", image: "images/classic-cheeseburger.jpg" },
  { key: "chicken", label: "Chicken", icon: "🍗", image: "images/crispy-fried-chicken.jpg" },
  { key: "meals", label: "Rice Meals", icon: "🍚", image: "images/rice-chicken-bbq.jpg" },
  { key: "pizza", label: "Pizza", icon: "🍕", image: "images/pizza-pepperoni.jpg" },
  { key: "pasta", label: "Pasta", icon: "🍝", image: "images/pasta-carbonara.jpg" },
  { key: "snacks", label: "Snacks", icon: "🍟", image: "images/fries-classic.jpg" },
  { key: "drinks", label: "Drinks", icon: "🥤", image: "images/milktea-taro.jpg" },
  { key: "desserts", label: "Desserts", icon: "🍨", image: "images/icecream-chocolate.jpg" },
  { key: "combos", label: "Combo Meals", icon: "🍱", image: "images/combo-family-meal-bundle.jpg" }
];

/* Filter chip order for the Menu page (includes "All") */
const MENU_FILTERS = [
  { key: "all", label: "All" },
  { key: "burgers", label: "Burgers" },
  { key: "chicken", label: "Chicken" },
  { key: "meals", label: "Meals" },
  { key: "pizza", label: "Pizza" },
  { key: "pasta", label: "Pasta" },
  { key: "snacks", label: "Snacks" },
  { key: "drinks", label: "Drinks" },
  { key: "desserts", label: "Desserts" },
  { key: "combos", label: "Combos" }
];

/* ---------- Shared add-on groups (reused across products) ---------- */
const ADDONS_BURGER = {
  label: "Add-ons",
  choices: [
    { id: "extra-cheese", name: "Extra Cheese", price: 20 },
    { id: "extra-patty", name: "Extra Patty", price: 40 },
    { id: "bacon", name: "Bacon", price: 30 },
    { id: "extra-sauce", name: "Extra Sauce", price: 10 }
  ]
};

const ADDONS_RICE = {
  label: "Add-ons",
  choices: [
    { id: "extra-rice", name: "Extra Rice", price: 20 },
    { id: "extra-egg", name: "Extra Egg", price: 15 },
    { id: "extra-sauce", name: "Extra Sauce", price: 10 }
  ]
};

const ADDONS_PIZZA = {
  label: "Add-ons",
  choices: [
    { id: "extra-cheese", name: "Extra Cheese", price: 40 },
    { id: "extra-pepperoni", name: "Extra Pepperoni", price: 50 },
    { id: "extra-bacon", name: "Extra Bacon", price: 50 }
  ]
};

const ADDONS_PASTA = {
  label: "Add-ons",
  choices: [
    { id: "extra-cheese", name: "Extra Cheese", price: 25 },
    { id: "extra-meatballs", name: "Extra Meatballs", price: 40 },
    { id: "garlic-bread", name: "Garlic Bread", price: 35 }
  ]
};

const ADDONS_MILKTEA = {
  label: "Add-ons",
  choices: [
    { id: "pearl", name: "Pearl", price: 15 },
    { id: "pudding", name: "Pudding", price: 15 },
    { id: "jelly", name: "Jelly", price: 15 },
    { id: "extra-cream", name: "Extra Cream", price: 15 }
  ]
};

/* ============================================================
   PRODUCTS
   ============================================================ */
const DEFAULT_PRODUCTS = [

  /* ============================ BURGERS ============================ */
  {
    id: "classic-cheeseburger",
    name: "Classic Cheeseburger",
    category: "burgers",
    categoryLabel: "Burgers",
    description: "A juicy beef patty, melted cheddar, crisp lettuce, tomato and pickles on a toasted sesame bun.",
    image: "images/classic-cheeseburger.jpg",
    rating: 4.8,
    basePrice: 99,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 99 },
          { id: "fries", name: "With Fries", price: 129 },
          { id: "meal", name: "Burger Meal", price: 159 }
        ]
      }
    ],
    addonGroup: ADDONS_BURGER,
    ingredients: ["Beef patty", "Cheddar cheese", "Lettuce", "Tomato", "Sesame bun"]
  },
  {
    id: "bacon-cheeseburger",
    name: "Bacon Cheeseburger",
    category: "burgers",
    categoryLabel: "Burgers",
    description: "Smoky bacon strips stacked over a beef patty and melted cheese, finished with our signature sauce.",
    image: "images/bacon-cheeseburger.jpg",
    rating: 4.9,
    basePrice: 129,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 129 },
          { id: "fries", name: "With Fries", price: 159 },
          { id: "meal", name: "Burger Meal", price: 189 }
        ]
      }
    ],
    addonGroup: ADDONS_BURGER,
    ingredients: ["Beef patty", "Bacon", "Cheddar cheese", "Onion", "Signature sauce"]
  },
  {
    id: "crispy-chicken-burger",
    name: "Crispy Chicken Burger",
    category: "burgers",
    categoryLabel: "Burgers",
    description: "A golden crispy chicken fillet with tangy slaw and creamy mayo on a soft brioche bun.",
    image: "images/crispy-chicken-burger.jpg",
    rating: 4.7,
    basePrice: 109,
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 109 },
          { id: "fries", name: "With Fries", price: 139 },
          { id: "meal", name: "Burger Meal", price: 169 }
        ]
      }
    ],
    addonGroup: {
      label: "Add-ons",
      choices: [
        { id: "extra-cheese", name: "Extra Cheese", price: 20 },
        { id: "extra-fillet", name: "Extra Chicken Fillet", price: 45 },
        { id: "bacon", name: "Bacon", price: 30 },
        { id: "extra-sauce", name: "Extra Sauce", price: 10 }
      ]
    },
    ingredients: ["Crispy chicken fillet", "Slaw", "Mayo", "Brioche bun"]
  },
  {
    id: "double-beef-burger",
    name: "Double Beef Burger",
    category: "burgers",
    categoryLabel: "Burgers",
    description: "Two grilled beef patties, double cheese and crunchy slaw for the ultimate hearty bite.",
    image: "images/double-beef-burger.jpg",
    rating: 4.9,
    basePrice: 149,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 149 },
          { id: "fries", name: "With Fries", price: 179 },
          { id: "meal", name: "Burger Meal", price: 209 }
        ]
      }
    ],
    addonGroup: ADDONS_BURGER,
    ingredients: ["Two beef patties", "Double cheese", "Slaw", "Pretzel bun"]
  },
  {
    id: "spicy-chicken-burger",
    name: "Spicy Chicken Burger",
    category: "burgers",
    categoryLabel: "Burgers",
    description: "Double crispy chicken glazed in a sweet-spicy chili sauce, layered with tangy slaw.",
    image: "images/spicy-chicken-burger.jpg",
    rating: 4.8,
    basePrice: 119,
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 119 },
          { id: "fries", name: "With Fries", price: 149 },
          { id: "meal", name: "Burger Meal", price: 179 }
        ]
      }
    ],
    addonGroup: {
      label: "Add-ons",
      choices: [
        { id: "extra-cheese", name: "Extra Cheese", price: 20 },
        { id: "extra-fillet", name: "Extra Chicken Fillet", price: 45 },
        { id: "bacon", name: "Bacon", price: 30 },
        { id: "extra-sauce", name: "Extra Chili Sauce", price: 10 }
      ]
    },
    ingredients: ["Double crispy chicken", "Chili glaze", "Slaw", "Sesame bun"]
  },

  /* ============================ CHICKEN ============================ */
  {
    id: "crispy-fried-chicken",
    name: "Crispy Fried Chicken",
    category: "chicken",
    categoryLabel: "Chicken",
    description: "Our signature fried chicken, hand-breaded and fried to a crunch, juicy on the inside.",
    image: "images/crispy-fried-chicken.jpg",
    rating: 4.9,
    basePrice: 89,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "1pc", name: "1 Piece", price: 89 },
          { id: "2pcs", name: "2 Pieces", price: 159 },
          { id: "3pcs", name: "3 Pieces", price: 219 },
          { id: "1pc-rice", name: "1 pc + Rice", price: 109 },
          { id: "2pcs-rice", name: "2 pcs + Rice", price: 189 },
          { id: "2pcs-rice-drink", name: "2 pcs + Rice + Drink", price: 219 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "original", name: "Original", price: 0 },
          { id: "spicy", name: "Spicy", price: 0 },
          { id: "garlic-parmesan", name: "Garlic Parmesan", price: 0 },
          { id: "bbq", name: "BBQ", price: 0 }
        ]
      }
    ],
    addonGroup: {
      label: "Add-ons",
      choices: [
        { id: "extra-rice", name: "Extra Rice", price: 20 },
        { id: "extra-gravy", name: "Extra Gravy", price: 15 },
        { id: "add-drink", name: "Add a Drink", price: 35 }
      ]
    },
    ingredients: ["Bone-in chicken", "Seasoned breading", "House spice blend"]
  },
  {
    id: "chicken-wings",
    name: "Chicken Wings",
    category: "chicken",
    categoryLabel: "Chicken",
    description: "Crispy fried wings tossed in your favorite sauce, served glistening and sticky-good.",
    image: "images/wings-honey-garlic.jpg",
    rating: 4.8,
    basePrice: 179,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "6pcs", name: "6 pcs", price: 179 },
          { id: "10pcs", name: "10 pcs", price: 279 },
          { id: "15pcs", name: "15 pcs", price: 399 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "original", name: "Original", price: 0, image: "images/wings-original.jpg" },
          { id: "buffalo", name: "Buffalo", price: 0, image: "images/wings-spicy.jpg" },
          { id: "bbq", name: "BBQ", price: 0, image: "images/wings-bbq.jpg" },
          { id: "honey-garlic", name: "Honey Garlic", price: 0, image: "images/wings-honey-garlic.jpg" },
          { id: "garlic-parmesan", name: "Garlic Parmesan", price: 0, image: "images/wings-garlic-parmesan.jpg" },
          { id: "spicy-korean", name: "Spicy Korean", price: 0, image: "images/tenders-spicy-korean.jpg" }
        ]
      }
    ],
    addonGroup: {
      label: "Add-ons",
      choices: [
        { id: "extra-sauce", name: "Extra Sauce", price: 15 },
        { id: "extra-dip", name: "Extra Dip", price: 15 }
      ]
    },
    ingredients: ["Chicken wings", "House breading", "Signature wing sauce"]
  },
  {
    id: "chicken-tenders",
    name: "Chicken Tenders",
    category: "chicken",
    categoryLabel: "Chicken",
    description: "Tender chicken strips, breaded and fried golden, tossed in your choice of flavor.",
    image: "images/tenders-honey-garlic.jpg",
    rating: 4.7,
    basePrice: 149,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "6pcs", name: "6 pcs", price: 149 },
          { id: "10pcs", name: "10 pcs", price: 219 },
          { id: "15pcs", name: "15 pcs", price: 299 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "original", name: "Original", price: 0, image: "images/tenders-original.jpg" },
          { id: "bbq", name: "BBQ", price: 0, image: "images/tenders-bbq.jpg" },
          { id: "spicy", name: "Spicy", price: 0, image: "images/tenders-spicy.jpg" },
          { id: "honey-garlic", name: "Honey Garlic", price: 0, image: "images/tenders-honey-garlic.jpg" },
          { id: "garlic-parmesan", name: "Garlic Parmesan", price: 0, image: "images/tenders-garlic-parmesan.jpg" },
          { id: "spicy-korean", name: "Spicy Korean", price: 0, image: "images/tenders-spicy-korean.jpg" }
        ]
      }
    ],
    addonGroup: {
      label: "Add-ons",
      choices: [
        { id: "extra-dip", name: "Extra Dip", price: 15 },
        { id: "extra-rice", name: "Extra Rice", price: 20 }
      ]
    },
    ingredients: ["Chicken tenderloin", "Crispy breading", "Signature sauce"]
  },

  /* ========================= RICE MEALS ========================= */
  {
    id: "chicken-bbq-rice-meal",
    name: "Chicken BBQ Rice Meal",
    category: "meals",
    categoryLabel: "Rice Meals",
    description: "Grilled BBQ chicken over garlic rice with a side of sweet glaze and toasted sesame.",
    image: "images/rice-chicken-bbq.jpg",
    rating: 4.8,
    basePrice: 139,
    badges: ["bestseller"],
    variantGroups: [],
    addonGroup: ADDONS_RICE,
    ingredients: ["Grilled chicken", "BBQ glaze", "Garlic rice", "Sesame seeds"]
  },
  {
    id: "crispy-chicken-rice-meal",
    name: "Crispy Chicken Rice Meal",
    category: "meals",
    categoryLabel: "Rice Meals",
    description: "Crispy fried chicken bites drizzled in savory sauce, served over a bed of steamed rice.",
    image: "images/rice-crispy-chicken.jpg",
    rating: 4.7,
    basePrice: 129,
    variantGroups: [],
    addonGroup: ADDONS_RICE,
    ingredients: ["Crispy chicken bites", "Savory glaze", "Steamed rice", "Scallions"]
  },
  {
    id: "burger-steak-rice-meal",
    name: "Burger Steak Rice Meal",
    category: "meals",
    categoryLabel: "Rice Meals",
    description: "Two juicy beef patties smothered in rich mushroom gravy over steaming rice.",
    image: "images/rice-burger-steak.jpg",
    rating: 4.8,
    basePrice: 149,
    badges: ["bestseller"],
    variantGroups: [],
    addonGroup: ADDONS_RICE,
    ingredients: ["Beef patties", "Mushroom gravy", "Steamed rice", "Crispy chicken bites"]
  },
  {
    id: "chicken-teriyaki-rice-meal",
    name: "Chicken Teriyaki Rice Meal",
    category: "meals",
    categoryLabel: "Rice Meals",
    description: "Tender teriyaki chicken strips glazed in a sweet soy sauce over garlic rice.",
    image: "images/rice-chicken-teriyaki.jpg",
    rating: 4.7,
    basePrice: 159,
    variantGroups: [],
    addonGroup: ADDONS_RICE,
    ingredients: ["Teriyaki chicken", "Sweet soy glaze", "Garlic rice", "Sesame seeds"]
  },
  {
    id: "beef-tapa-rice-meal",
    name: "Beef Tapa Rice Meal",
    category: "meals",
    categoryLabel: "Rice Meals",
    description: "Classic marinated beef tapa pan-fried and served with garlic rice and a fried egg.",
    image: null,
    placeholderIcon: "🥩",
    rating: 4.6,
    basePrice: 169,
    variantGroups: [],
    addonGroup: ADDONS_RICE,
    ingredients: ["Marinated beef tapa", "Garlic rice", "Fried egg"]
  },

  /* ============================= PIZZA ============================= */
  {
    id: "pepperoni-pizza",
    name: "Pepperoni Pizza",
    category: "pizza",
    categoryLabel: "Pizza",
    description: "Classic pepperoni piled high on a wood-fired crust with bubbling mozzarella.",
    image: "images/pizza-pepperoni.jpg",
    rating: 4.9,
    basePrice: 229,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "small", name: "Small", price: 229 },
          { id: "medium", name: "Medium", price: 339 },
          { id: "large", name: "Large", price: 459 }
        ]
      }
    ],
    addonGroup: ADDONS_PIZZA,
    ingredients: ["Pepperoni", "Mozzarella", "Tomato sauce", "Wood-fired crust"]
  },
  {
    id: "hawaiian-pizza",
    name: "Hawaiian Pizza",
    category: "pizza",
    categoryLabel: "Pizza",
    description: "Sweet pineapple and savory ham on a cheesy tomato base — the classic sweet-savory combo.",
    image: "images/pizza-hawaiian.jpg",
    rating: 4.6,
    basePrice: 229,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "small", name: "Small", price: 229 },
          { id: "medium", name: "Medium", price: 339 },
          { id: "large", name: "Large", price: 459 }
        ]
      }
    ],
    addonGroup: ADDONS_PIZZA,
    ingredients: ["Ham", "Pineapple", "Mozzarella", "Tomato sauce"]
  },
  {
    id: "cheese-pizza",
    name: "Cheese Pizza",
    category: "pizza",
    categoryLabel: "Pizza",
    description: "A simple, comforting classic — melted mozzarella over a herbed tomato base.",
    image: "images/pizza-cheese.jpg",
    rating: 4.7,
    basePrice: 199,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "small", name: "Small", price: 199 },
          { id: "medium", name: "Medium", price: 299 },
          { id: "large", name: "Large", price: 399 }
        ]
      }
    ],
    addonGroup: ADDONS_PIZZA,
    ingredients: ["Mozzarella", "Tomato sauce", "Italian herbs"]
  },
  {
    id: "bacon-cheese-pizza",
    name: "Bacon & Cheese Pizza",
    category: "pizza",
    categoryLabel: "Pizza",
    description: "Crispy bacon bits and a double blend of cheeses over a creamy garlic base.",
    image: "images/pizza-bacon-cheese.jpg",
    rating: 4.8,
    basePrice: 239,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "small", name: "Small", price: 239 },
          { id: "medium", name: "Medium", price: 349 },
          { id: "large", name: "Large", price: 469 }
        ]
      }
    ],
    addonGroup: ADDONS_PIZZA,
    ingredients: ["Bacon", "Cheddar & mozzarella blend", "Garlic cream base"]
  },
  {
    id: "bbq-chicken-pizza",
    name: "BBQ Chicken Pizza",
    category: "pizza",
    categoryLabel: "Pizza",
    description: "Smoky shredded BBQ chicken, red onion and cilantro over a tangy barbecue base.",
    image: "images/pizza-bbq-chicken.jpg",
    rating: 4.8,
    basePrice: 239,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "small", name: "Small", price: 239 },
          { id: "medium", name: "Medium", price: 349 },
          { id: "large", name: "Large", price: 469 }
        ]
      }
    ],
    addonGroup: ADDONS_PIZZA,
    ingredients: ["BBQ chicken", "Red onion", "Cilantro", "BBQ base"]
  },
  {
    id: "meat-lovers-pizza",
    name: "Meat Lovers Pizza",
    category: "pizza",
    categoryLabel: "Pizza",
    description: "Loaded with pepperoni, ham, sausage and bacon for the ultimate carnivore's pizza.",
    image: "images/pizza-meat-lovers.jpg",
    rating: 4.9,
    basePrice: 259,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "small", name: "Small", price: 259 },
          { id: "medium", name: "Medium", price: 379 },
          { id: "large", name: "Large", price: 499 }
        ]
      }
    ],
    addonGroup: ADDONS_PIZZA,
    ingredients: ["Pepperoni", "Ham", "Sausage", "Bacon", "Mozzarella"]
  },

  /* ============================= PASTA ============================= */
  {
    id: "classic-spaghetti",
    name: "Classic Spaghetti",
    category: "pasta",
    categoryLabel: "Pasta",
    description: "Slow-simmered tomato meat sauce over spaghetti, topped with grated cheese and meatballs.",
    image: "images/pasta-spaghetti.jpg",
    rating: 4.8,
    basePrice: 119,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 119 },
          { id: "drink", name: "With Drink", price: 149 },
          { id: "complete", name: "Complete Meal", price: 179 }
        ]
      }
    ],
    addonGroup: ADDONS_PASTA,
    ingredients: ["Spaghetti", "Tomato meat sauce", "Meatballs", "Parmesan"]
  },
  {
    id: "carbonara",
    name: "Carbonara",
    category: "pasta",
    categoryLabel: "Pasta",
    description: "Creamy white sauce pasta with crispy bacon bits and a generous dusting of parmesan.",
    image: "images/pasta-carbonara.jpg",
    rating: 4.9,
    basePrice: 139,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 139 },
          { id: "drink", name: "With Drink", price: 169 },
          { id: "complete", name: "Complete Meal", price: 199 }
        ]
      }
    ],
    addonGroup: ADDONS_PASTA,
    ingredients: ["Spaghetti", "Creamy white sauce", "Bacon bits", "Parmesan"]
  },
  {
    id: "baked-macaroni",
    name: "Baked Macaroni",
    category: "pasta",
    categoryLabel: "Pasta",
    description: "Oven-baked macaroni in a rich cheesy meat sauce, finished bubbling hot with herbs.",
    image: "images/pasta-baked-macaroni.jpg",
    rating: 4.7,
    basePrice: 129,
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 129 },
          { id: "drink", name: "With Drink", price: 159 },
          { id: "complete", name: "Complete Meal", price: 189 }
        ]
      }
    ],
    addonGroup: ADDONS_PASTA,
    ingredients: ["Macaroni", "Cheesy meat sauce", "Baked cheese topping"]
  },
  {
    id: "pesto-pasta",
    name: "Pesto Pasta",
    category: "pasta",
    categoryLabel: "Pasta",
    description: "Chef's special — spaghetti tossed in fresh basil pesto with herb-crusted chicken bites and pine nuts.",
    image: "images/pasta-pesto.jpg",
    rating: 4.8,
    basePrice: 149,
    badges: ["new"],
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "solo", name: "Solo", price: 149 },
          { id: "drink", name: "With Drink", price: 179 },
          { id: "complete", name: "Complete Meal", price: 209 }
        ]
      }
    ],
    addonGroup: ADDONS_PASTA,
    ingredients: ["Spaghetti", "Basil pesto", "Chicken bites", "Pine nuts", "Parmesan"]
  },

  /* ============================ SNACKS ============================ */
  {
    id: "french-fries",
    name: "French Fries",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Golden crispy fries, salted to perfection and available in your favorite seasoning.",
    image: "images/fries-classic.jpg",
    rating: 4.7,
    basePrice: 49,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "small", name: "Small", price: 49 },
          { id: "medium", name: "Medium", price: 69 },
          { id: "large", name: "Large", price: 89 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "original", name: "Original", price: 0 },
          { id: "cheese", name: "Cheese", price: 0 },
          { id: "bbq", name: "BBQ", price: 0 },
          { id: "sour-cream", name: "Sour Cream", price: 0 }
        ]
      }
    ],
    addonGroup: { label: "Add-ons", choices: [{ id: "extra-dip", name: "Extra Dip", price: 15 }] },
    ingredients: ["Potatoes", "Seasoning blend"]
  },
  {
    id: "cheese-fries",
    name: "Cheese Fries",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Crispy fries smothered in warm, melty cheese sauce and a sprinkle of chives.",
    image: "images/fries-cheese.jpg",
    rating: 4.8,
    basePrice: 69,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "small", name: "Small", price: 69 },
          { id: "medium", name: "Medium", price: 89 },
          { id: "large", name: "Large", price: 109 }
        ]
      }
    ],
    addonGroup: {
      label: "Add-ons",
      choices: [
        { id: "extra-cheese-sauce", name: "Extra Cheese Sauce", price: 25 },
        { id: "bacon-bits", name: "Bacon Bits", price: 30 }
      ]
    },
    ingredients: ["Potatoes", "Cheese sauce", "Chives"]
  },
  {
    id: "nachos",
    name: "Nachos",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Crunchy tortilla chips ready for dipping, served regular or fully loaded.",
    image: "images/nachos.jpg",
    rating: 4.6,
    basePrice: 99,
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "regular", name: "Regular", price: 99 },
          { id: "loaded", name: "Loaded", price: 139 }
        ]
      }
    ],
    addonGroup: {
      label: "Add-ons",
      choices: [
        { id: "extra-cheese-sauce", name: "Extra Cheese Sauce", price: 25 },
        { id: "jalapenos", name: "Jalapeños", price: 15 },
        { id: "sour-cream", name: "Sour Cream", price: 20 }
      ]
    },
    ingredients: ["Tortilla chips", "Cheese sauce", "Salsa"]
  },
  {
    id: "mozzarella-sticks",
    name: "Mozzarella Sticks",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Breaded mozzarella fried until golden — pull-apart cheesy goodness in every bite.",
    image: "images/mozzarella-sticks.jpg",
    rating: 4.8,
    basePrice: 99,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "6pcs", name: "6 pcs", price: 99 },
          { id: "12pcs", name: "12 pcs", price: 179 }
        ]
      }
    ],
    addonGroup: { label: "Add-ons", choices: [{ id: "extra-marinara", name: "Extra Marinara", price: 15 }] },
    ingredients: ["Mozzarella cheese", "Breadcrumb coating", "Marinara dip"]
  },
  {
    id: "onion-rings",
    name: "Onion Rings",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Thick-cut onions in a crispy batter, fried until golden and irresistibly crunchy.",
    image: "images/onion-rings.jpg",
    rating: 4.6,
    basePrice: 89,
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "regular", name: "Regular", price: 89 },
          { id: "large", name: "Large", price: 129 }
        ]
      }
    ],
    addonGroup: { label: "Add-ons", choices: [{ id: "extra-dip", name: "Extra Dip", price: 15 }] },
    ingredients: ["Onions", "Crispy batter"]
  },
  {
    id: "chicken-nuggets",
    name: "Chicken Nuggets",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Bite-sized crispy chicken nuggets, perfect for sharing and dipping.",
    image: "images/chicken-nuggets.jpg",
    rating: 4.7,
    basePrice: 89,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "6pcs", name: "6 pcs", price: 89 },
          { id: "10pcs", name: "10 pcs", price: 129 },
          { id: "15pcs", name: "15 pcs", price: 169 }
        ]
      },
      {
        key: "sauce", label: "Sauce", type: "single", required: true,
        choices: [
          { id: "bbq", name: "BBQ", price: 0 },
          { id: "cheese", name: "Cheese", price: 0 },
          { id: "sweet-sour", name: "Sweet & Sour", price: 0 },
          { id: "spicy", name: "Spicy", price: 0 }
        ]
      }
    ],
    addonGroup: { label: "Add-ons", choices: [{ id: "extra-sauce", name: "Extra Sauce Cup", price: 15 }] },
    ingredients: ["Chicken breast", "Crispy breading"]
  },

  /* ============================= DRINKS ============================= */
  {
    id: "milk-tea",
    name: "Milk Tea",
    category: "drinks",
    categoryLabel: "Drinks",
    description: "Creamy milk tea shaken fresh, available in a variety of flavors with your favorite toppings.",
    image: "images/milktea-taro.jpg",
    rating: 4.9,
    basePrice: 89,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "regular", name: "Regular", price: 89 },
          { id: "large", name: "Large", price: 109 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "classic", name: "Classic", price: 0, image: "images/milktea-chocolate.jpg" },
          { id: "chocolate", name: "Chocolate", price: 0, image: "images/milktea-chocolate.jpg" },
          { id: "matcha", name: "Matcha", price: 0, image: "images/milktea-matcha.jpg" },
          { id: "taro", name: "Taro", price: 0, image: "images/milktea-taro.jpg" },
          { id: "wintermelon", name: "Wintermelon", price: 0, image: "images/milktea-matcha.jpg" },
          { id: "strawberry", name: "Strawberry", price: 0, image: "images/milktea-strawberry.jpg" },
          { id: "cookies-cream", name: "Cookies & Cream", price: 0, image: "images/milktea-cookies-cream.jpg" }
        ]
      }
    ],
    addonGroup: ADDONS_MILKTEA,
    ingredients: ["Black tea", "Fresh milk", "Brown sugar syrup"]
  },
  {
    id: "iced-coffee",
    name: "Iced Coffee",
    category: "drinks",
    categoryLabel: "Drinks",
    description: "Bold brewed coffee over ice with fresh milk, available in smooth flavored blends.",
    image: "images/coffee-caramel.jpg",
    rating: 4.7,
    basePrice: 79,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "regular", name: "Regular", price: 79 },
          { id: "large", name: "Large", price: 99 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "original", name: "Original", price: 0, image: "images/coffee-caramel.jpg" },
          { id: "caramel", name: "Caramel", price: 0, image: "images/coffee-caramel.jpg" },
          { id: "vanilla", name: "Vanilla", price: 0, image: "images/coffee-caramel.jpg" },
          { id: "mocha", name: "Mocha", price: 0, image: "images/coffee-caramel.jpg" },
          { id: "hazelnut", name: "Hazelnut", price: 0, image: "images/coffee-caramel.jpg" }
        ]
      }
    ],
    addonGroup: ADDONS_MILKTEA,
    ingredients: ["Brewed coffee", "Fresh milk", "Flavored syrup"]
  },
  {
    id: "lemonade",
    name: "Iced Lemonade",
    category: "drinks",
    categoryLabel: "Drinks",
    description: "Refreshing house-made lemonade layered with real fruit for a fizzy, fruity kick.",
    image: "images/lemonade-strawberry.jpg",
    rating: 4.8,
    basePrice: 69,
    badges: ["new"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "regular", name: "Regular", price: 69 },
          { id: "large", name: "Large", price: 89 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "original", name: "Original", price: 0, image: "images/lemonade-strawberry.jpg" },
          { id: "strawberry", name: "Strawberry", price: 0, image: "images/lemonade-strawberry.jpg" },
          { id: "blueberry", name: "Blueberry", price: 0, image: "images/lemonade-blueberry.jpg" },
          { id: "passion-fruit", name: "Passion Fruit", price: 0, image: "images/lemonade-passionfruit.jpg" }
        ]
      }
    ],
    addonGroup: { label: "Add-ons", choices: [{ id: "extra-fruit", name: "Extra Fruit Topping", price: 20 }] },
    ingredients: ["Fresh lemon", "Real fruit", "Soda water"]
  },
  {
    id: "coke",
    name: "Coke",
    category: "drinks",
    categoryLabel: "Drinks",
    description: "Ice-cold Coca-Cola, the classic pair for any JBN F-Store meal.",
    image: "images/soda-coke.jpg",
    rating: 4.7,
    basePrice: 39,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "regular", name: "Regular", price: 39 },
          { id: "large", name: "Large", price: 59 }
        ]
      }
    ],
    addonGroup: null,
    ingredients: ["Carbonated soft drink"]
  },
  {
    id: "sprite",
    name: "Sprite",
    category: "drinks",
    categoryLabel: "Drinks",
    description: "Crisp, refreshing lemon-lime soda served ice-cold.",
    image: "images/soda-sprite.jpg",
    rating: 4.6,
    basePrice: 39,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "regular", name: "Regular", price: 39 },
          { id: "large", name: "Large", price: 59 }
        ]
      }
    ],
    addonGroup: null,
    ingredients: ["Carbonated soft drink"]
  },
  {
    id: "royal",
    name: "Royal",
    category: "drinks",
    categoryLabel: "Drinks",
    description: "The classic Filipino orange soda — sweet, fizzy and nostalgic.",
    image: "images/soda-royal.jpg",
    rating: 4.6,
    basePrice: 39,
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "regular", name: "Regular", price: 39 },
          { id: "large", name: "Large", price: 59 }
        ]
      }
    ],
    addonGroup: null,
    ingredients: ["Carbonated soft drink"]
  },

  /* ============================ DESSERTS ============================ */
  {
    id: "ice-cream",
    name: "Ice Cream",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Creamy scooped ice cream in classic and fruity flavors, the perfect way to end your meal.",
    image: "images/icecream-chocolate.jpg",
    rating: 4.8,
    basePrice: 59,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "single", name: "Single Scoop", price: 59 },
          { id: "double", name: "Double Scoop", price: 99 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "chocolate", name: "Chocolate", price: 0, image: "images/icecream-chocolate.jpg" },
          { id: "vanilla", name: "Vanilla", price: 0, image: "images/icecream-vanilla.jpg" },
          { id: "strawberry", name: "Strawberry", price: 0, image: "images/icecream-strawberry.jpg" },
          { id: "cookies-cream", name: "Cookies & Cream", price: 0, image: "images/icecream-cookies-cream.jpg" },
          { id: "mango", name: "Mango", price: 0, image: "images/icecream-mango.jpg" }
        ]
      }
    ],
    addonGroup: null,
    ingredients: ["Fresh cream", "Milk", "Natural flavoring"]
  },
  {
    id: "donuts",
    name: "Donuts",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Soft, fluffy donuts finished with glossy glaze and toppings — grab one or a full box.",
    image: "images/donut-chocolate.jpg",
    rating: 4.7,
    basePrice: 45,
    variantGroups: [
      {
        key: "option", label: "Choose your order", type: "single", required: true,
        choices: [
          { id: "single", name: "Single Donut", price: 45 },
          { id: "box6", name: "Box of 6", price: 240 }
        ]
      },
      {
        key: "flavor", label: "Flavor", type: "single", required: true,
        choices: [
          { id: "chocolate", name: "Chocolate", price: 0, image: "images/donut-chocolate.jpg" },
          { id: "strawberry", name: "Strawberry", price: 0, image: "images/donut-strawberry.jpg" },
          { id: "glazed", name: "Glazed", price: 0, image: "images/donut-glazed.jpg" },
          { id: "cookies-cream", name: "Cookies & Cream", price: 0, image: "images/donut-cookies-cream.jpg" }
        ]
      }
    ],
    addonGroup: null,
    ingredients: ["Soft dough", "Glaze", "Toppings"]
  },
  {
    id: "chocolate-cake",
    name: "Chocolate Cake",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Rich, layered chocolate cake with silky ganache — a decadent treat for chocolate lovers.",
    image: "images/chocolate-cake.jpg",
    rating: 4.9,
    basePrice: 89,
    badges: ["bestseller"],
    variantGroups: [
      {
        key: "size", label: "Size", type: "single", required: true,
        choices: [
          { id: "slice", name: "Slice", price: 89 },
          { id: "whole", name: "Whole Cake", price: 699 }
        ]
      }
    ],
    addonGroup: {
      label: "Add-ons",
      choices: [
        { id: "extra-berries", name: "Extra Berries", price: 25 },
        { id: "whipped-cream", name: "Whipped Cream", price: 20 }
      ]
    },
    ingredients: ["Layered chocolate sponge", "Chocolate ganache", "Raspberries"]
  },

  /* ============================ COMBO MEALS ============================ */
  {
    id: "burger-combo",
    name: "Burger Combo",
    category: "combos",
    categoryLabel: "Combo Meals",
    description: "Burger + Medium Fries + Regular Drink — the everyday classic combo.",
    image: "images/combo-burger-combo.jpg",
    rating: 4.8,
    basePrice: 179,
    badges: ["bestseller"],
    variantGroups: [],
    addonGroup: null,
    ingredients: ["Cheeseburger", "Medium fries", "Regular drink"]
  },
  {
    id: "chicken-combo",
    name: "Chicken Combo",
    category: "combos",
    categoryLabel: "Combo Meals",
    description: "2 pcs Fried Chicken + Rice + Regular Drink — hearty and satisfying.",
    image: "images/combo-chicken-combo.jpg",
    rating: 4.8,
    basePrice: 199,
    badges: ["bestseller"],
    variantGroups: [],
    addonGroup: null,
    ingredients: ["2 pcs fried chicken", "Rice", "Regular drink"]
  },
  {
    id: "pizza-meal",
    name: "Pizza Meal",
    category: "combos",
    categoryLabel: "Combo Meals",
    description: "Large Pizza + 2 Drinks + Garlic Bread — perfect for sharing.",
    image: "images/combo-pizza-meal.jpg",
    rating: 4.8,
    basePrice: 549,
    variantGroups: [],
    addonGroup: null,
    ingredients: ["Large pizza", "2 regular drinks", "Garlic bread"]
  },
  {
    id: "family-chicken-meal",
    name: "Family Chicken Meal",
    category: "combos",
    categoryLabel: "Combo Meals",
    description: "6 pcs Fried Chicken + 3 Rice + Large Fries + 4 Drinks — feeds the whole family.",
    image: "images/combo-family-chicken-meal.jpg",
    rating: 4.9,
    basePrice: 699,
    badges: ["bestseller"],
    variantGroups: [],
    addonGroup: null,
    ingredients: ["6 pcs fried chicken", "3 rice", "Large fries", "4 regular drinks"]
  },
  {
    id: "burger-family-bundle",
    name: "Burger Family Bundle",
    category: "combos",
    categoryLabel: "Combo Meals",
    description: "4 Burgers + Large Fries + 4 Drinks — everyone gets their own burger.",
    image: "images/combo-burger-family-bundle.jpg",
    rating: 4.8,
    basePrice: 749,
    variantGroups: [],
    addonGroup: null,
    ingredients: ["4 cheeseburgers", "Large fries", "4 regular drinks"]
  },
  {
    id: "family-meal-bundle",
    name: "Family Meal Bundle",
    category: "combos",
    categoryLabel: "Combo Meals",
    description: "A generous mix of crispy chicken, fries, fresh salad and drinks — feeds 4 to 6.",
    image: "images/combo-family-meal-bundle.jpg",
    rating: 4.9,
    basePrice: 899,
    badges: ["bestseller"],
    variantGroups: [],
    addonGroup: null,
    ingredients: ["Crispy chicken tenders", "Large fries", "Fresh salad", "4 drinks"]
  },
  {
    id: "barkada-snack-box",
    name: "Barkada Snack Box",
    category: "combos",
    categoryLabel: "Combo Meals",
    description: "Fried chicken, fries, fresh salad and a drink, boxed up and ready for the barkada.",
    image: "images/combo-barkada-snack-box.jpg",
    rating: 4.8,
    basePrice: 649,
    variantGroups: [],
    addonGroup: null,
    ingredients: ["Fried chicken pieces", "Fries", "Fresh salad", "Drink"]
  }
];

/* ---------- Why Choose Us content ---------- */
const WHY_CHOOSE = [
  { icon: "🌿", title: "Fresh & Delicious", text: "Every dish is prepared fresh to order, never sitting around waiting." },
  { icon: "💰", title: "Affordable Prices", text: "Generous portions and honest pricing, made for everyday cravings." },
  { icon: "⭐", title: "Quality Ingredients", text: "We only use ingredients we'd be happy to serve our own family." },
  { icon: "⚡", title: "Easy Ordering", text: "Browse, customize and order in just a few taps — no hassle." }
];

/* =====================================================================
   3. STORAGE HELPERS
   localStorage  = survives closing the browser (users, products, cart)
   sessionStorage = cleared when the tab closes (who is logged in)
   ===================================================================== */
const STORAGE_KEYS = {
  users: "jbn_users_v1",
  products: "jbn_products_v1",
  cart: "jbn_cart_v2",
  session: "jbn_session_v1"
};

function readStorage(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

// Returns true when saved, false when the browser refuses (storage full/blocked).
function writeStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

/* =====================================================================
   4. SMALL UTILITIES
   ===================================================================== */
const $ = (id) => document.getElementById(id);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// Makes text safe to put inside innerHTML. Product names and user names are
// typed by people, so they must NEVER be inserted into the page unescaped.
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function money(amount) {
  const value = Number(amount) || 0;
  return "₱" + value.toLocaleString("en-PH", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function formatDate(isoString) {
  const date = new Date(isoString);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function makeId(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function round2(number) {
  return Math.round(number * 100) / 100;
}

function firstName(fullName) {
  return String(fullName || "").trim().split(/\s+/)[0] || "there";
}

/* Toast = the small message that pops up at the bottom of the screen. */
function showToast(message, type) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    wrap.setAttribute("aria-live", "polite");
    document.body.appendChild(wrap);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (type === "error" ? " error" : "");
  toast.innerHTML = `<span class="check">${type === "error" ? "!" : "✓"}</span><span>${esc(message)}</span>`;
  wrap.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* Lock the page scroll while any pop-up / drawer is open. */
function updateScrollLock() {
  const somethingOpen = document.querySelector(
    ".modal-overlay.open, .cart-drawer.open, .mobile-nav.open"
  );
  document.body.style.overflow = somethingOpen ? "hidden" : "";
}

/* =====================================================================
   5. FORM VALIDATION
   Each validate...() function returns "" when OK, or an error message.
   ===================================================================== */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Letters (including Ñ, é, etc.), spaces, apostrophes, hyphens and periods. No digits.
const NAME_PATTERN = /^\p{L}[\p{L} .'-]*$/u;

function validateName(value) {
  const name = value.trim();
  if (!name) return "Please enter your full name.";
  if (name.length < 2) return "Name must be at least 2 characters.";
  if (name.length > 50) return "Name must be 50 characters or fewer.";
  if (!NAME_PATTERN.test(name)) return "Name can only have letters, spaces, apostrophes, hyphens and periods (no numbers).";
  return "";
}

function validateEmail(value) {
  const email = value.trim();
  if (!email) return "Please enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "Please enter a valid email, like name@example.com.";
  return "";
}

function validatePassword(value) {
  if (!value) return "Please enter a password.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 64) return "Password must be 64 characters or fewer.";
  if (!/[A-Z]/.test(value)) return "Password needs at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password needs at least one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Password needs at least one number.";
  return "";
}

/* Show / clear the red message under a form field. */
function setFieldError(input, message) {
  const field = input.closest(".field");
  if (!field) return;
  field.classList.toggle("error", Boolean(message));
  const out = field.querySelector(".field-error");
  if (out) out.textContent = message || "";
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field").forEach((field) => {
    field.classList.remove("error");
    const out = field.querySelector(".field-error");
    if (out) out.textContent = "";
  });
}

/* checks = [{ input, error }, ...]  ->  true only if every error is "" */
function applyChecks(checks) {
  let firstBad = null;
  checks.forEach(({ input, error }) => {
    setFieldError(input, error);
    if (error && !firstBad) firstBad = input;
  });
  if (firstBad) firstBad.focus();
  return !firstBad;
}

/* The coloured message box under a form (type: "success" or "error"). */
function showStatus(box, message, type) {
  box.textContent = message || "";
  box.classList.remove("show", "error-status");
  if (message) {
    box.classList.add("show");
    if (type === "error") box.classList.add("error-status");
  }
}

/* =====================================================================
   6. ACCOUNTS  (register, log in, log out, profile)
   ===================================================================== */

/* A tiny text hash (cyrb53). It only keeps passwords from being stored as
   plain readable text. It is NOT strong security - real websites hash
   passwords on the server with bcrypt or argon2. */
function simpleHash(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function hashPassword(password, salt) {
  return simpleHash(salt + "|" + password);
}

function getUsers() {
  const users = readStorage(localStorage, STORAGE_KEYS.users, []);
  return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
  return writeStorage(localStorage, STORAGE_KEYS.users, users);
}

function buildUser({ name, email, password, role }) {
  const salt = Math.random().toString(36).slice(2, 12);
  return {
    id: makeId("u"),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    salt,
    passwordHash: hashPassword(password, salt),
    role,
    createdAt: new Date().toISOString()
  };
}

/* Makes sure the built-in admin exists AND matches DEFAULT_ADMIN (section 1).
   So when you edit the admin name / email / password in the code, just refresh
   the page: the saved admin account is updated automatically. */
function ensureDefaultAdmin() {
  const users = getUsers();
  const wantedEmail = DEFAULT_ADMIN.email.toLowerCase();
  // The built-in admin = the one marked builtin (or the first admin from an older version).
  let admin = users.find((u) => u.builtin) || users.find((u) => u.role === "admin");

  if (!admin) {
    users.push({ ...buildUser({ ...DEFAULT_ADMIN, role: "admin" }), builtin: true });
    saveUsers(users);
    return;
  }

  // Don't take over an email that a normal user already registered with.
  const emailTaken = users.some((u) => u !== admin && u.email === wantedEmail);
  let changed = false;
  if (!admin.builtin) { admin.builtin = true; changed = true; }
  if (admin.name !== DEFAULT_ADMIN.name) { admin.name = DEFAULT_ADMIN.name; changed = true; }
  if (!emailTaken && admin.email !== wantedEmail) { admin.email = wantedEmail; changed = true; }
  if (admin.passwordHash !== hashPassword(DEFAULT_ADMIN.password, admin.salt)) {
    admin.passwordHash = hashPassword(DEFAULT_ADMIN.password, admin.salt);
    changed = true;
  }
  if (changed) saveUsers(users);
}

function findUserByEmail(email, users) {
  const wanted = email.trim().toLowerCase();
  return (users || getUsers()).find((user) => user.email === wanted) || null;
}

/* Public registration ALWAYS creates a normal "user".
   The form has no role field, and this function never accepts one. */
function registerUser(name, email, password) {
  const users = getUsers();
  if (findUserByEmail(email, users)) {
    return { ok: false, error: "That email is already registered. Try logging in instead." };
  }
  users.push(buildUser({ name, email, password, role: "user" }));
  if (!saveUsers(users)) {
    return { ok: false, error: "Could not save your account (browser storage is full or blocked)." };
  }
  return { ok: true };
}

/* Returns the user if the email + password match, otherwise null. */
function checkLogin(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  return user.passwordHash === hashPassword(password, user.salt) ? user : null;
}

function startSession(user) {
  writeStorage(sessionStorage, STORAGE_KEYS.session, user.id);
}

/* The logged-in user is looked up from the saved users list every time,
   so the role always comes from the stored account. */
function getCurrentUser() {
  const id = readStorage(sessionStorage, STORAGE_KEYS.session, null);
  if (!id) return null;
  return getUsers().find((user) => user.id === id) || null;
}

function isAdmin() {
  const user = getCurrentUser();
  return Boolean(user && user.role === "admin");
}

/* Called before every admin action (add / edit / delete ...). */
function requireAdmin() {
  if (isAdmin()) return true;
  showToast("Access denied: administrators only.", "error");
  navigate(getCurrentUser() ? "home" : "login");
  return false;
}

function logout() {
  sessionStorage.removeItem(STORAGE_KEYS.session);
  clearPrivateViews();
  updateAuthUI();
  navigate("home");
  showToast("You have been logged out.");
}

/* Show / hide menu items depending on who is logged in.
   An element with data-show="guest user admin" is visible only for
   those kinds of visitors. */
function updateAuthUI() {
  const user = getCurrentUser();
  const who = user ? user.role : "guest";
  document.body.dataset.auth = who;
  $$("[data-show]").forEach((el) => {
    el.hidden = !el.dataset.show.split(" ").includes(who);
  });
  $$("[data-user-name]").forEach((el) => {
    el.textContent = user ? firstName(user.name) : "";
  });
}

/* Empty the dashboards so private data does not stay in the page after logout. */
function clearPrivateViews() {
  ["adminStats", "adminProductRows", "adminUserRows", "dashBestSellers"].forEach((id) => {
    const el = $(id);
    if (el) el.innerHTML = "";
  });
  ["profileForm", "passwordForm"].forEach((id) => {
    const form = $(id);
    if (form) form.reset();
  });
}

/* =====================================================================
   7. PAGE ROUTER + ACCESS CONTROL
   The whole site is one HTML page. Each "page" is a <section data-view>.
   The address bar hash (#menu, #admin ...) decides which one is visible.
   ===================================================================== */
const VIEWS = ["home", "menu", "about", "contact", "login", "register", "dashboard", "admin"];

const PAGE_TITLES = {
  home: "JBN F-Store | Delicious Food. Made for Every Craving.",
  menu: "Menu | JBN F-Store",
  about: "About Us | JBN F-Store",
  contact: "Contact & Feedback | JBN F-Store",
  login: "Log In | JBN F-Store",
  register: "Create Account | JBN F-Store",
  dashboard: "My Account | JBN F-Store",
  admin: "Admin Dashboard | JBN F-Store"
};

function routeFromHash() {
  const name = location.hash.replace(/^#\/?/, "");
  return VIEWS.includes(name) ? name : "home";
}

/* Go to a page. (If we are already there, just refresh it.) */
function navigate(route) {
  if (location.hash === "#" + route) handleRoute();
  else location.hash = route;
}

/* ACCESS CONTROL: decides where a visitor is really allowed to go.
   - Not logged in: ONLY the log in and register pages (they come first).
   - Logged in: the main site; the admin dashboard only for admins. */
function resolveRoute(requested, user) {
  if (!user) {
    if (requested === "login" || requested === "register") return { route: requested };
    return {
      route: "login",
      message: requested === "admin" ? "Please log in with an administrator account." : ""
    };
  }
  if (requested === "admin" && user.role !== "admin") {
    return { route: "home", message: "Access denied: the admin dashboard is for administrators only." };
  }
  if (requested === "dashboard" && user.role === "admin") return { route: "admin" };
  if (requested === "login" || requested === "register") {
    return { route: user.role === "admin" ? "admin" : "home" }; // already logged in
  }
  return { route: requested };
}

function handleRoute() {
  const requested = routeFromHash();
  const result = resolveRoute(requested, getCurrentUser());
  if (result.message) showToast(result.message, "error");
  if (result.route !== requested) {
    location.hash = result.route; // fires "hashchange" again with the allowed page
    return;
  }
  showView(result.route);
}

function showView(name) {
  $$(".view").forEach((view) => { view.hidden = view.dataset.view !== name; });
  document.body.dataset.page = name;
  document.title = PAGE_TITLES[name] || PAGE_TITLES.home;
  $$("[data-route]").forEach((link) => link.classList.toggle("active", link.dataset.route === name));
  closeMobileNav();
  window.scrollTo(0, 0);

  if (name === "menu") applyMenuFilters();
  if (name === "dashboard") renderUserDashboard();
  if (name === "admin") renderAdminDashboard();
  if (name === "contact") prefillContactForm();
}

/* Mobile (hamburger) menu */
function toggleMobileNav() {
  $("hamburgerBtn").classList.toggle("open");
  $("mobileNav").classList.toggle("open");
  updateScrollLock();
}

function closeMobileNav() {
  $("hamburgerBtn").classList.remove("open");
  $("mobileNav").classList.remove("open");
  updateScrollLock();
}


/* =====================================================================
   8. PRODUCTS  (loading, saving, cards, details window)
   `products` is the live list the whole site uses. The first time the site
   opens it is copied from DEFAULT_PRODUCTS (section 2) into localStorage.
   After that, admin changes are saved there.
   ===================================================================== */
let products = [];

// Every image already in the images/ folder (used by the admin image picker).
const IMAGE_LIBRARY = (function buildImageLibrary() {
  const found = new Set();
  CATEGORIES.forEach((c) => c.image && found.add(c.image));
  DEFAULT_PRODUCTS.forEach((p) => {
    if (p.image) found.add(p.image);
    (p.variantGroups || []).forEach((g) => g.choices.forEach((c) => c.image && found.add(c.image)));
  });
  return Array.from(found).sort();
})();

/* Only allow images from our own folder or an image the admin uploaded. */
function safeImage(src) {
  if (typeof src !== "string") return null;
  if (/^images\/[\w\-.]+\.(jpe?g|png|webp|gif)$/i.test(src)) return src;
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src)) return src;
  return null;
}

/* Fills in anything missing so one odd record can never break the pages. */
function normalizeProduct(raw) {
  const category = CATEGORIES.find((c) => c.key === raw.category);
  return {
    ...raw,
    id: String(raw.id),
    name: String(raw.name),
    description: String(raw.description || ""),
    categoryLabel: category ? category.label : (raw.categoryLabel || "Other"),
    image: safeImage(raw.image),
    placeholderIcon: raw.placeholderIcon || (category ? category.icon : "🍽️"),
    rating: Number(raw.rating) || 0,
    basePrice: Number(raw.basePrice) || 0,
    quantity: Number.isInteger(raw.quantity) && raw.quantity >= 0 ? raw.quantity : DEFAULT_STOCK,
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    variantGroups: Array.isArray(raw.variantGroups) ? raw.variantGroups : [],
    addonGroup: raw.addonGroup || null
  };
}

function freshDefaultProducts() {
  return DEFAULT_PRODUCTS.map((p) =>
    normalizeProduct({ ...JSON.parse(JSON.stringify(p)), quantity: DEFAULT_STOCK })
  );
}

function loadProducts() {
  const saved = readStorage(localStorage, STORAGE_KEYS.products, null);
  if (Array.isArray(saved)) {
    return saved.filter((p) => p && p.id && p.name).map(normalizeProduct);
  }
  const defaults = freshDefaultProducts();
  writeStorage(localStorage, STORAGE_KEYS.products, defaults);
  return defaults;
}

/* Saves a new products list. Returns false (and changes nothing) if saving fails. */
function commitProducts(nextProducts) {
  if (!writeStorage(localStorage, STORAGE_KEYS.products, nextProducts)) return false;
  products = nextProducts;
  return true;
}

function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

function hasVariants(product) {
  return product.variantGroups.length > 0;
}

function stockInfo(product) {
  if (product.quantity <= 0) return { text: "Sold out", css: "out" };
  if (product.quantity <= LOW_STOCK_LIMIT) return { text: `Only ${product.quantity} left`, css: "low" };
  return { text: `${product.quantity} in stock`, css: "ok" };
}

function renderStars(rating) {
  const rounded = Math.round(rating);
  let stars = "";
  for (let i = 1; i <= 5; i++) stars += i <= rounded ? "★" : "☆";
  return stars;
}

function fromPriceLabel(product) {
  const hasRange = hasVariants(product) && product.variantGroups[0].choices.length > 1;
  return hasRange ? `<small>From</small>${money(product.basePrice)}` : money(product.basePrice);
}

function badgeHTML(product) {
  if (product.quantity <= 0) return `<span class="stamp stamp--dark">Sold out</span>`;
  return product.badges.map((badge) => {
    if (badge === "bestseller") return `<span class="stamp stamp--red">🔥 Best Seller</span>`;
    if (badge === "new") return `<span class="stamp">✨ New</span>`;
    return "";
  }).join("");
}

function thumbHTML(product) {
  if (product.image) {
    return `<img src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy">`;
  }
  return `<div class="placeholder-icon">${esc(product.placeholderIcon)}</div>`;
}

function productCardHTML(product) {
  const stock = stockInfo(product);
  const soldOut = product.quantity <= 0;
  const rating = product.rating > 0
    ? `<span class="rating-group"><span class="stars">${renderStars(product.rating)}</span><span>${product.rating.toFixed(1)}</span></span>`
    : `<span class="rating-group"></span>`;
  return `
    <article class="product-card${soldOut ? " is-soldout" : ""}">
      <div class="product-thumb">
        ${thumbHTML(product)}
        <div class="product-badges">${badgeHTML(product)}</div>
        <span class="product-cat-pill">${esc(product.categoryLabel)}</span>
      </div>
      <div class="product-body">
        <h3>${esc(product.name)}</h3>
        <p class="product-desc">${esc(product.description)}</p>
        <div class="product-rating">${rating}<span class="stock stock--${stock.css}">${stock.text}</span></div>
        <div class="product-foot">
          <div>
            <div class="product-price">${fromPriceLabel(product)}</div>
            <button type="button" class="view-link" data-action="view-product" data-id="${esc(product.id)}">View Details <span class="arrow">→</span></button>
          </div>
          <button type="button" class="add-btn" data-action="quick-add" data-id="${esc(product.id)}"
            aria-label="Add ${esc(product.name)} to cart" ${soldOut ? "disabled" : ""}>+</button>
        </div>
      </div>
    </article>`;
}

function renderProductGrid(containerId, list) {
  const el = $(containerId);
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state empty-state--wide"><div class="emoji">🍽️</div><p>No dishes found. Try a different search or category.</p></div>`;
    return;
  }
  el.innerHTML = list.map(productCardHTML).join("");
}

/* Price of one item for a given set of choices (used by the details window
   and by the cart, so both always agree). */
function calcUnitPrice(product, selectionIds, addonIds) {
  let total = 0;
  if (hasVariants(product)) {
    product.variantGroups.forEach((group) => {
      const choice = group.choices.find((c) => c.id === selectionIds[group.key]);
      if (choice) total += choice.price;
    });
  } else {
    total += product.basePrice;
  }
  if (product.addonGroup) {
    product.addonGroup.choices.forEach((addon) => {
      if (addonIds.includes(addon.id)) total += addon.price;
    });
  }
  return total;
}

/* ---------- Product details window (the pop-up with size/add-on choices) ---------- */
let modalState = null;

function openProductModal(productId) {
  const product = getProductById(productId);
  if (!product) return;
  modalState = { product, selections: {}, addons: new Set(), qty: 1, activeImage: product.image };
  product.variantGroups.forEach((group) => {
    modalState.selections[group.key] = group.choices[0].id;
    if (group.choices[0].image) modalState.activeImage = group.choices[0].image;
  });
  renderModal();
  $("modalOverlay").classList.add("open");
  updateScrollLock();
}

function closeProductModal() {
  $("modalOverlay").classList.remove("open");
  modalState = null;
  updateScrollLock();
}

function renderModal() {
  const { product, selections, addons } = modalState;
  const stock = stockInfo(product);
  const available = availableToAdd(product);
  modalState.qty = Math.max(1, Math.min(modalState.qty, Math.max(available, 1)));

  $("modalImage").innerHTML = modalState.activeImage
    ? `<img src="${esc(modalState.activeImage)}" alt="${esc(product.name)}">`
    : `<div class="placeholder-icon big">${esc(product.placeholderIcon)}</div>`;
  $("modalTitle").textContent = product.name;
  $("modalRating").innerHTML =
    (product.rating > 0 ? `${renderStars(product.rating)} ${product.rating.toFixed(1)} · ` : "") +
    `<span class="stock stock--${stock.css}">${stock.text}</span>`;
  $("modalDesc").textContent = product.description;

  let html = "";
  product.variantGroups.forEach((group) => {
    html += `<div class="option-group">
      <span class="option-group-label">${esc(group.label)}</span>
      <div class="option-list">
        ${group.choices.map((choice) => `
          <button type="button" class="option-row ${selections[group.key] === choice.id ? "selected" : ""}"
            data-action="modal-variant" data-key="${esc(group.key)}" data-id="${esc(choice.id)}">
            <span class="left"><span class="radio"></span><span>${esc(choice.name)}</span></span>
            <span class="price">${choice.price > 0 ? "+" + money(choice.price) : money(choice.price)}</span>
          </button>`).join("")}
      </div>
    </div>`;
  });
  if (product.addonGroup && product.addonGroup.choices.length) {
    html += `<div class="option-group">
      <span class="option-group-label">${esc(product.addonGroup.label)}</span>
      <div class="option-list">
        ${product.addonGroup.choices.map((addon) => `
          <button type="button" class="option-row ${addons.has(addon.id) ? "selected" : ""}"
            data-action="modal-addon" data-id="${esc(addon.id)}">
            <span class="left"><span class="checkbox"></span><span>${esc(addon.name)}</span></span>
            <span class="price">+${money(addon.price)}</span>
          </button>`).join("")}
      </div>
    </div>`;
  }
  $("modalOptions").innerHTML = html;

  $("modalQty").textContent = modalState.qty;
  $("modalAddToCart").disabled = available <= 0;
  $("modalStockNote").textContent =
    product.quantity <= 0 ? "This item is sold out."
      : available <= 0 ? "All available stock is already in your cart."
      : "";
  updateModalTotal();
}

function selectVariant(groupKey, choiceId) {
  const group = modalState.product.variantGroups.find((g) => g.key === groupKey);
  const choice = group && group.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  modalState.selections[groupKey] = choiceId;
  if (choice.image) modalState.activeImage = choice.image;
  renderModal();
}

function toggleAddon(addonId) {
  if (modalState.addons.has(addonId)) modalState.addons.delete(addonId);
  else modalState.addons.add(addonId);
  renderModal();
}

function changeModalQty(delta) {
  const available = availableToAdd(modalState.product);
  const next = modalState.qty + delta;
  if (delta > 0 && next > available) {
    showToast(`Only ${available} available.`, "error");
    return;
  }
  modalState.qty = Math.max(1, next);
  $("modalQty").textContent = modalState.qty;
  updateModalTotal();
}

function updateModalTotal() {
  const { product, selections, addons, qty } = modalState;
  const totalEl = $("modalTotal");
  totalEl.textContent = money(calcUnitPrice(product, selections, Array.from(addons)) * qty);
  totalEl.classList.remove("pulse");
  void totalEl.offsetWidth; // restart the little animation
  totalEl.classList.add("pulse");
}

function addModalItemToCart() {
  const { product, selections, addons, qty } = modalState;
  const added = addToCart({
    productId: product.id,
    selectionIds: { ...selections },
    addonIds: Array.from(addons),
    qty
  });
  if (added) closeProductModal();
}

/* =====================================================================
   9. SHOPPING CART
   The cart only remembers WHAT was chosen (product + options + quantity).
   Name, image and price are looked up from the product list every time,
   so when the admin changes a price the cart updates automatically.
   ===================================================================== */
function loadCart() {
  const cart = readStorage(localStorage, STORAGE_KEYS.cart, []);
  return Array.isArray(cart) ? cart : [];
}

function saveCart(cart) {
  writeStorage(localStorage, STORAGE_KEYS.cart, cart);
}

function cartQtyForProduct(productId, cart) {
  return (cart || loadCart())
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + line.qty, 0);
}

/* How many more of this product can still be added (stock minus cart). */
function availableToAdd(product, cart) {
  return product.quantity - cartQtyForProduct(product.id, cart);
}

function lineSignature(productId, selectionIds, addonIds) {
  const keys = Object.keys(selectionIds).sort().map((k) => k + "=" + selectionIds[k]).join(",");
  return productId + "|" + keys + "|" + [...addonIds].sort().join(",");
}

/* Everything the cart drawer needs to show one line. */
function describeLine(line) {
  const product = getProductById(line.productId);
  if (!product) return null;
  let image = product.image;
  const selections = [];
  product.variantGroups.forEach((group) => {
    const choice = group.choices.find((c) => c.id === line.selectionIds[group.key]);
    if (choice) {
      selections.push(`${group.label}: ${choice.name}`);
      if (choice.image) image = choice.image;
    }
  });
  const addons = product.addonGroup
    ? product.addonGroup.choices.filter((a) => line.addonIds.includes(a.id))
    : [];
  return { product, image, selections, addons, unitPrice: calcUnitPrice(product, line.selectionIds, line.addonIds) };
}

function addToCart({ productId, selectionIds, addonIds, qty }) {
  const product = getProductById(productId);
  if (!product) return false;
  const cart = loadCart();
  const available = availableToAdd(product, cart);

  if (available <= 0) {
    showToast(product.quantity <= 0 ? `${product.name} is sold out.` : `All ${product.quantity} available ${product.name} are already in your cart.`, "error");
    return false;
  }
  if (qty > available) {
    showToast(`Only ${available} more ${product.name} available.`, "error");
    return false;
  }

  // Same product + same choices -> just increase the quantity.
  const signature = lineSignature(productId, selectionIds, addonIds);
  const existing = cart.find((line) => lineSignature(line.productId, line.selectionIds, line.addonIds) === signature);
  if (existing) existing.qty += qty;
  else cart.push({ cartId: makeId("c"), productId, selectionIds, addonIds, qty });

  saveCart(cart);
  refreshCartUI();
  showToast(`Added ${product.name} to cart`);
  return true;
}

function removeCartItem(cartId) {
  saveCart(loadCart().filter((line) => line.cartId !== cartId));
  refreshCartUI();
}

function changeCartQty(cartId, delta) {
  const cart = loadCart();
  const line = cart.find((l) => l.cartId === cartId);
  if (!line) return;
  const product = getProductById(line.productId);
  if (!product) return;
  if (delta > 0 && availableToAdd(product, cart) <= 0) {
    showToast(`Only ${product.quantity} ${product.name} available.`, "error");
    return;
  }
  line.qty += delta;
  saveCart(line.qty <= 0 ? cart.filter((l) => l.cartId !== cartId) : cart);
  refreshCartUI();
}

/* Removes cart lines whose product was deleted and trims quantities that are
   higher than the current stock (runs at start-up and after admin changes). */
function cleanCart() {
  const remaining = {};
  const cleaned = [];
  loadCart().forEach((line) => {
    const product = getProductById(line.productId);
    if (!product) return;
    const selectionIds = line.selectionIds || {};
    const choicesStillExist = product.variantGroups.every((g) => g.choices.some((c) => c.id === selectionIds[g.key]));
    if (!choicesStillExist) return;
    if (remaining[product.id] === undefined) remaining[product.id] = product.quantity;
    const qty = Math.min(Math.floor(Number(line.qty) || 0), remaining[product.id]);
    if (qty <= 0) return;
    remaining[product.id] -= qty;
    cleaned.push({
      cartId: line.cartId || makeId("c"),
      productId: product.id,
      selectionIds,
      addonIds: Array.isArray(line.addonIds) ? line.addonIds : [],
      qty
    });
  });
  saveCart(cleaned);
}

function cartTotals() {
  const lines = loadCart().map((line) => ({ line, view: describeLine(line) })).filter((x) => x.view);
  const count = lines.reduce((sum, x) => sum + x.line.qty, 0);
  const subtotal = lines.reduce((sum, x) => sum + x.view.unitPrice * x.line.qty, 0);
  return { lines, count, subtotal };
}

function updateCartBadge() {
  const { count } = cartTotals();
  $$("[data-cart-count]").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  });
  const dashCount = $("dashCartCount");
  if (dashCount) dashCount.textContent = count;
}

function refreshCartUI() {
  updateCartBadge();
  renderCartDrawer();
}

function renderCartDrawer() {
  const itemsWrap = $("cartItems");
  const summaryWrap = $("cartSummary");
  $("checkoutNote").classList.remove("show");
  const { lines, subtotal } = cartTotals();

  if (!lines.length) {
    itemsWrap.innerHTML = `
      <div class="cart-empty">
        <div class="emoji">🛒</div>
        <p>Your cart is empty.<br>Add something delicious!</p>
      </div>`;
    summaryWrap.innerHTML = "";
    return;
  }

  itemsWrap.innerHTML = lines.map(({ line, view }) => {
    const thumb = view.image
      ? `<img src="${esc(view.image)}" alt="${esc(view.product.name)}">`
      : `<div class="placeholder-icon">${esc(view.product.placeholderIcon)}</div>`;
    const addonsLine = view.addons.length ? "Add-ons: " + view.addons.map((a) => esc(a.name)).join(", ") : "";
    return `
      <div class="cart-item">
        ${thumb}
        <div class="cart-item-info">
          <h4>${esc(view.product.name)}</h4>
          <div class="cart-item-meta">
            ${view.selections.length ? `<div>${view.selections.map(esc).join(" · ")}</div>` : ""}
            ${addonsLine ? `<div>${addonsLine}</div>` : ""}
          </div>
          <div class="cart-item-foot">
            <div class="cart-qty">
              <button type="button" aria-label="Decrease quantity" data-action="cart-qty" data-cart-id="${esc(line.cartId)}" data-delta="-1">−</button>
              <span>${line.qty}</span>
              <button type="button" aria-label="Increase quantity" data-action="cart-qty" data-cart-id="${esc(line.cartId)}" data-delta="1">+</button>
            </div>
            <div class="cart-item-price">${money(view.unitPrice * line.qty)}</div>
          </div>
          <button type="button" class="cart-remove" data-action="cart-remove" data-cart-id="${esc(line.cartId)}">Remove</button>
        </div>
      </div>`;
  }).join("");

  summaryWrap.innerHTML = `
    <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="summary-row"><span>Delivery Fee</span><span>${money(DELIVERY_FEE)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${money(subtotal + DELIVERY_FEE)}</span></div>
    <button type="button" class="btn btn-primary btn-block checkout-btn" data-action="checkout">Checkout</button>`;
}

function openCart() {
  renderCartDrawer();
  $("cartOverlay").classList.add("open");
  $("cartDrawer").classList.add("open");
  updateScrollLock();
}

function closeCart() {
  $("cartOverlay").classList.remove("open");
  $("cartDrawer").classList.remove("open");
  updateScrollLock();
}

/* =====================================================================
   10. MENU PAGE  (search + category filter)
   ===================================================================== */
const menuState = { category: "all", query: "" };

function buildMenuFilters() {
  $("filterRow").innerHTML = MENU_FILTERS.map((filter) =>
    `<button type="button" class="chip ${filter.key === menuState.category ? "active" : ""}" data-action="menu-filter" data-key="${filter.key}">${esc(filter.label)}</button>`
  ).join("");
}

function setMenuCategory(key, clearSearch) {
  if (!MENU_FILTERS.some((f) => f.key === key)) key = "all";
  menuState.category = key;
  if (clearSearch) {
    menuState.query = "";
    $("menuSearch").value = "";
  }
  $$("#filterRow .chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.key === key));
  applyMenuFilters();
}

function applyMenuFilters() {
  let results = products.slice();
  if (menuState.category !== "all") {
    results = results.filter((p) => p.category === menuState.category);
  }
  if (menuState.query) {
    results = results.filter((p) =>
      p.name.toLowerCase().includes(menuState.query) ||
      p.description.toLowerCase().includes(menuState.query) ||
      p.categoryLabel.toLowerCase().includes(menuState.query)
    );
  }
  renderProductGrid("menuGrid", results);
  $("menuResultsCount").textContent = `${results.length} dish${results.length === 1 ? "" : "es"} found`;
}

/* =====================================================================
   11. HOME PAGE
   ===================================================================== */
function renderHome() {
  $("categoryRail").innerHTML = CATEGORIES.map((c) => `
    <a class="category-card" href="#menu" data-category="${c.key}">
      <div class="category-thumb"><img src="${c.image}" alt="${esc(c.label)}" loading="lazy"></div>
      <span>${c.icon} ${esc(c.label)}</span>
    </a>`).join("");

  renderProductGrid("bestSellersGrid", products.filter((p) => p.badges.includes("bestseller")).slice(0, 8));
  renderProductGrid("combosGrid", products.filter((p) => p.category === "combos"));

  $("whyGrid").innerHTML = WHY_CHOOSE.map((w) => `
    <div class="why-card">
      <div class="why-icon">${w.icon}</div>
      <h3>${esc(w.title)}</h3>
      <p>${esc(w.text)}</p>
    </div>`).join("");

  $$("[data-stat='dishes']").forEach((el) => { el.textContent = products.length; });
  $$("[data-stat='categories']").forEach((el) => { el.textContent = CATEGORIES.length; });
}

/* =====================================================================
   12. USER DASHBOARD
   ===================================================================== */
function renderUserDashboard() {
  const user = getCurrentUser();
  if (!user || user.role === "admin") return;
  $("dashWelcome").textContent = `Welcome back, ${firstName(user.name)}!`;
  $("dashMemberSince").textContent = formatDate(user.createdAt);
  $("dashEmail").textContent = user.email;
  $("profileName").value = user.name;
  $("profileEmail").value = user.email;
  updateCartBadge();
  renderProductGrid("dashBestSellers", products.filter((p) => p.badges.includes("bestseller")).slice(0, 4));
}

function handleProfileSubmit(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) { navigate("login"); return; }
  const form = event.target;
  const nameInput = $("profileName");
  const emailInput = $("profileEmail");
  const status = $("profileStatus");
  showStatus(status, "");

  const users = getUsers();
  const newEmail = emailInput.value.trim().toLowerCase();
  const emailTaken = users.some((u) => u.id !== user.id && u.email === newEmail);
  const ok = applyChecks([
    { input: nameInput, error: validateName(nameInput.value) },
    { input: emailInput, error: validateEmail(emailInput.value) || (emailTaken ? "That email is already used by another account." : "") }
  ]);
  if (!ok) { showStatus(status, "Please fix the highlighted fields.", "error"); return; }

  const stored = users.find((u) => u.id === user.id);
  stored.name = nameInput.value.trim();
  stored.email = newEmail; // the role is never changed here
  if (!saveUsers(users)) {
    showStatus(status, "Could not save changes (browser storage is full or blocked).", "error");
    return;
  }
  clearFieldErrors(form);
  updateAuthUI();
  renderUserDashboard();
  showStatus(status, "✓ Profile updated.", "success");
}

function handlePasswordSubmit(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) { navigate("login"); return; }
  const form = event.target;
  const currentInput = $("currentPassword");
  const newInput = $("newPassword");
  const confirmInput = $("confirmNewPassword");
  const status = $("passwordStatus");
  showStatus(status, "");

  const currentError = !currentInput.value ? "Please enter your current password."
    : (checkLogin(user.email, currentInput.value) ? "" : "Current password is incorrect.");
  const newError = validatePassword(newInput.value);
  const confirmError = !confirmInput.value ? "Please confirm your new password."
    : (confirmInput.value !== newInput.value ? "Passwords do not match." : "");
  if (!applyChecks([
    { input: currentInput, error: currentError },
    { input: newInput, error: newError },
    { input: confirmInput, error: confirmError }
  ])) {
    showStatus(status, "Please fix the highlighted fields.", "error");
    return;
  }

  const users = getUsers();
  const stored = users.find((u) => u.id === user.id);
  stored.salt = Math.random().toString(36).slice(2, 12);
  stored.passwordHash = hashPassword(newInput.value, stored.salt);
  if (!saveUsers(users)) {
    showStatus(status, "Could not save your new password (browser storage is full or blocked).", "error");
    return;
  }
  form.reset();
  clearFieldErrors(form);
  showStatus(status, "✓ Password changed.", "success");
}

/* =====================================================================
   13. ADMIN DASHBOARD  (products + users)
   Every function that changes data starts with requireAdmin().
   ===================================================================== */
const adminState = { tab: "products", productQuery: "", productCategory: "all", userQuery: "", userRole: "all" };

function renderAdminDashboard() {
  if (!isAdmin()) return;
  const user = getCurrentUser();
  $("adminWelcome").textContent = `Signed in as ${user.name} (${user.email})`;
  renderAdminStats();
  showAdminTab(adminState.tab);
  renderAdminProducts();
  renderAdminUsers();
}

function renderAdminStats() {
  const users = getUsers();
  const admins = users.filter((u) => u.role === "admin").length;
  const customers = users.length - admins;
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= LOW_STOCK_LIMIT).length;
  const soldOut = products.filter((p) => p.quantity <= 0).length;
  const cards = [
    { icon: "🍽️", value: products.length, label: "Products on the menu" },
    { icon: "👥", value: users.length, label: "Registered accounts", sub: `${customers} user${customers === 1 ? "" : "s"} · ${admins} admin${admins === 1 ? "" : "s"}` },
    { icon: "⚠️", value: lowStock, label: "Low stock", sub: `${LOW_STOCK_LIMIT} or fewer left` },
    { icon: "🚫", value: soldOut, label: "Sold out" }
  ];
  $("adminStats").innerHTML = cards.map((card) => `
    <div class="stat-card">
      <div class="stat-icon">${card.icon}</div>
      <div>
        <strong>${card.value}</strong>
        <span>${esc(card.label)}</span>
        ${card.sub ? `<small>${esc(card.sub)}</small>` : ""}
      </div>
    </div>`).join("");
}

function showAdminTab(tab) {
  adminState.tab = tab;
  $("adminProductsPanel").hidden = tab !== "products";
  $("adminUsersPanel").hidden = tab !== "users";
  $$("[data-action='admin-tab']").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
}

function renderAdminProducts() {
  if (!isAdmin()) return;
  const query = adminState.productQuery;
  const list = products.filter((p) =>
    (adminState.productCategory === "all" || p.category === adminState.productCategory) &&
    (!query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.categoryLabel.toLowerCase().includes(query))
  );
  $("adminProductCount").textContent = `Showing ${list.length} of ${products.length} products`;

  if (!list.length) {
    $("adminProductRows").innerHTML = `<tr><td colspan="5" class="table-empty">No products match your search.</td></tr>`;
    return;
  }
  $("adminProductRows").innerHTML = list.map((p) => {
    const stock = stockInfo(p);
    const thumb = p.image
      ? `<img src="${esc(p.image)}" alt="" loading="lazy">`
      : `<div class="placeholder-icon">${esc(p.placeholderIcon)}</div>`;
    return `
      <tr>
        <td data-label="Product"><div class="prod-cell">${thumb}<div><strong>${esc(p.name)}</strong><small>${esc(p.description)}</small></div></div></td>
        <td data-label="Category">${esc(p.categoryLabel)}</td>
        <td data-label="Price">${hasVariants(p) ? "<small class='from'>From</small> " : ""}${money(p.basePrice)}</td>
        <td data-label="Quantity"><span class="stock stock--${stock.css}">${p.quantity}</span></td>
        <td data-label="Actions">
          <div class="row-actions">
            <button type="button" class="btn btn-outline btn-sm" data-action="admin-edit" data-id="${esc(p.id)}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" data-action="admin-delete" data-id="${esc(p.id)}">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

function renderAdminUsers() {
  if (!isAdmin()) return;
  const me = getCurrentUser();
  const query = adminState.userQuery;
  const users = getUsers()
    .filter((u) =>
      (adminState.userRole === "all" || u.role === adminState.userRole) &&
      (!query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  $("adminUserCount").textContent = `Showing ${users.length} of ${getUsers().length} accounts`;

  if (!users.length) {
    $("adminUserRows").innerHTML = `<tr><td colspan="4" class="table-empty">No accounts match your search.</td></tr>`;
    return;
  }
  $("adminUserRows").innerHTML = users.map((u) => `
    <tr>
      <td data-label="Name"><strong>${esc(u.name)}</strong>${u.id === me.id ? ' <span class="you-tag">You</span>' : ""}</td>
      <td data-label="Email">${esc(u.email)}</td>
      <td data-label="Registered">${formatDate(u.createdAt)}</td>
      <td data-label="Role"><span class="role-badge role-badge--${u.role === "admin" ? "admin" : "user"}">${u.role === "admin" ? "Admin" : "User"}</span></td>
    </tr>`).join("");
}

/* Fill the category drop-downs (admin filter + product form). Runs once. */
function buildAdminSelects() {
  const options = CATEGORIES.map((c) => `<option value="${c.key}">${esc(c.label)}</option>`).join("");
  $("adminProductCategory").innerHTML = `<option value="all">All categories</option>` + options;
  $("pfCategory").innerHTML = `<option value="">Choose a category…</option>` + options;
  $("pfImageSelect").innerHTML =
    `<option value="">No image (show category icon)</option>` +
    `<option value="__custom__" id="pfCustomOption" hidden>Uploaded image</option>` +
    IMAGE_LIBRARY.map((path) => {
      const label = path.replace("images/", "").replace(/\.\w+$/, "").replace(/-/g, " ");
      return `<option value="${esc(path)}">${esc(label)}</option>`;
    }).join("");
}

/* ---------- Add / Edit product form ---------- */
let formState = { editingId: null, image: null };

function openProductForm(productId) {
  if (!requireAdmin()) return;
  const product = productId ? getProductById(productId) : null;
  if (productId && !product) return;
  formState = { editingId: product ? product.id : null, image: product ? product.image : null };

  const form = $("productForm");
  form.reset();
  clearFieldErrors(form);
  showStatus($("productFormStatus"), "");
  $("formTitle").textContent = product ? "Edit Product" : "Add Product";
  $("formSaveBtn").textContent = product ? "Save Changes" : "Add Product";
  $("pfName").value = product ? product.name : "";
  $("pfCategory").value = product ? product.category : "";
  $("pfPrice").value = product ? product.basePrice : "";
  $("pfQuantity").value = product ? product.quantity : "";
  $("pfDescription").value = product ? product.description : "";
  $("pfPriceNote").hidden = !(product && hasVariants(product));
  syncImageControls();

  $("formOverlay").classList.add("open");
  updateScrollLock();
  $("pfName").focus();
}

function closeProductForm() {
  $("formOverlay").classList.remove("open");
  updateScrollLock();
}

/* Keep the image drop-down + preview in step with formState.image. */
function syncImageControls() {
  const image = formState.image;
  const select = $("pfImageSelect");
  if (!image) select.value = "";
  else if (IMAGE_LIBRARY.includes(image)) select.value = image;
  else { $("pfCustomOption").hidden = false; select.value = "__custom__"; }
  $("pfImageFile").value = "";

  const category = CATEGORIES.find((c) => c.key === $("pfCategory").value);
  $("pfPreview").innerHTML = image
    ? `<img src="${esc(image)}" alt="Product preview">`
    : `<div class="placeholder-icon">${category ? category.icon : "🍽️"}</div>`;
}

/* Shrinks an uploaded picture so it fits comfortably in localStorage. */
function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a valid image."));
      img.onload = () => {
        const maxSize = 700;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  const field = event.target.closest(".field");
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    setFieldError(event.target, "Please choose a JPG, PNG or WEBP image.");
    event.target.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setFieldError(event.target, "That image is larger than 5 MB. Please choose a smaller one.");
    event.target.value = "";
    return;
  }
  try {
    formState.image = await resizeImageFile(file);
    field.classList.remove("error");
    syncImageControls();
  } catch (error) {
    setFieldError(event.target, error.message);
  }
}

function handleProductFormSubmit(event) {
  event.preventDefault();
  if (!requireAdmin()) return;

  const name = $("pfName").value.trim();
  const categoryKey = $("pfCategory").value;
  const priceText = $("pfPrice").value.trim();
  const quantityText = $("pfQuantity").value.trim();
  const description = $("pfDescription").value.trim();
  const price = Number(priceText);
  const quantity = Number(quantityText);

  const duplicate = products.some(
    (p) => p.id !== formState.editingId && p.name.toLowerCase() === name.toLowerCase()
  );
  const checks = [
    { input: $("pfName"), error: !name ? "Please enter a product name." : name.length > 60 ? "Name must be 60 characters or fewer." : duplicate ? "A product with this name already exists." : "" },
    { input: $("pfCategory"), error: categoryKey ? "" : "Please choose a category." },
    { input: $("pfPrice"), error: priceText === "" || !isFinite(price) ? "Please enter a valid price."
        : price <= 0 ? "Price must be greater than 0."
        : price > 100000 ? "Price must be ₱100,000 or less."
        : round2(price) !== price ? "Use at most 2 decimal places." : "" },
    { input: $("pfQuantity"), error: quantityText === "" || !isFinite(quantity) ? "Please enter the quantity in stock."
        : !Number.isInteger(quantity) ? "Quantity must be a whole number."
        : quantity < 0 ? "Quantity cannot be negative."
        : quantity > 9999 ? "Quantity must be 9,999 or less." : "" },
    { input: $("pfDescription"), error: description.length < 10 ? "Description must be at least 10 characters." : description.length > 250 ? "Description must be 250 characters or fewer." : "" }
  ];
  if (!applyChecks(checks)) {
    showStatus($("productFormStatus"), "Please fix the highlighted fields.", "error");
    return;
  }

  const category = CATEGORIES.find((c) => c.key === categoryKey);
  const image = safeImage(formState.image);
  let next;

  if (formState.editingId) {
    next = products.map((p) => (p.id === formState.editingId ? applyProductEdits(p, { name, category, price, quantity, description, image }) : p));
  } else {
    const newProduct = normalizeProduct({
      id: "p-" + makeId("x"),
      name,
      category: category.key,
      description,
      image,
      placeholderIcon: category.icon,
      rating: 0,
      basePrice: price,
      quantity,
      badges: ["new"],
      variantGroups: [],
      addonGroup: null
    });
    next = [newProduct, ...products]; // newest first
  }

  if (!commitProducts(next)) {
    showStatus($("productFormStatus"), "Could not save (browser storage is full). Try a smaller image or delete some products.", "error");
    return;
  }
  const wasEditing = Boolean(formState.editingId);
  closeProductForm();
  refreshAfterProductChange();
  showToast(wasEditing ? `Updated ${name}` : `Added ${name} to the menu`);
}

/* Edit an existing product. If its price changes and it has size/option
   prices (like "Solo / With Fries / Meal"), those prices move by the same
   amount so the starting price stays correct. */
function applyProductEdits(product, { name, category, price, quantity, description, image }) {
  const updated = {
    ...product,
    name,
    category: category.key,
    categoryLabel: category.label,
    description,
    image,
    quantity,
    placeholderIcon: product.placeholderIcon || category.icon
  };
  if (price !== product.basePrice) {
    const difference = price - product.basePrice;
    updated.basePrice = price;
    if (hasVariants(product)) {
      // The group that carries the base price is the one whose cheapest choice costs the most.
      let pricingIndex = 0;
      product.variantGroups.forEach((group, i) => {
        const cheapest = Math.min(...group.choices.map((c) => c.price));
        const best = Math.min(...product.variantGroups[pricingIndex].choices.map((c) => c.price));
        if (cheapest > best) pricingIndex = i;
      });
      updated.variantGroups = product.variantGroups.map((group, i) =>
        i !== pricingIndex ? group : { ...group, choices: group.choices.map((c) => ({ ...c, price: round2(c.price + difference) })) }
      );
    }
  }
  return updated;
}

/* After ANY product change, refresh everything that shows products. */
function refreshAfterProductChange() {
  cleanCart();
  refreshCartUI();
  renderHome();
  applyMenuFilters();
  renderAdminDashboard();
  renderUserDashboard();
}

/* ---------- "Are you sure?" pop-up ---------- */
let confirmResolver = null;

function confirmDialog({ title, message, okText }) {
  $("confirmTitle").textContent = title;
  $("confirmMessage").textContent = message;
  $("confirmOk").textContent = okText || "Confirm";
  $("confirmOverlay").classList.add("open");
  updateScrollLock();
  $("confirmCancel").focus();
  return new Promise((resolve) => { confirmResolver = resolve; });
}

function closeConfirm(answer) {
  $("confirmOverlay").classList.remove("open");
  updateScrollLock();
  if (confirmResolver) {
    confirmResolver(answer);
    confirmResolver = null;
  }
}

async function deleteProductFlow(productId) {
  if (!requireAdmin()) return;
  const product = getProductById(productId);
  if (!product) return;
  const yes = await confirmDialog({
    title: "Delete this product?",
    message: `"${product.name}" will be removed from the menu. This cannot be undone.`,
    okText: "Delete"
  });
  if (!yes || !requireAdmin()) return;
  if (!commitProducts(products.filter((p) => p.id !== productId))) {
    showToast("Could not delete (browser storage problem).", "error");
    return;
  }
  refreshAfterProductChange();
  showToast(`Deleted ${product.name}`);
}

async function resetProductsFlow() {
  if (!requireAdmin()) return;
  const yes = await confirmDialog({
    title: "Reset the menu?",
    message: "All products go back to the original menu (changes, additions and deletions will be lost).",
    okText: "Reset menu"
  });
  if (!yes || !requireAdmin()) return;
  if (!commitProducts(freshDefaultProducts())) {
    showToast("Could not reset (browser storage problem).", "error");
    return;
  }
  refreshAfterProductChange();
  showToast("Menu reset to the original products.");
}

/* =====================================================================
   14. LOG IN / REGISTER FORMS + CONTACT FORM
   ===================================================================== */
function handleLoginSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const emailInput = $("loginEmail");
  const passwordInput = $("loginPassword");
  const status = $("loginStatus");
  showStatus(status, "");

  const ok = applyChecks([
    { input: emailInput, error: validateEmail(emailInput.value) },
    { input: passwordInput, error: passwordInput.value ? "" : "Please enter your password." }
  ]);
  if (!ok) return;

  const user = checkLogin(emailInput.value, passwordInput.value);
  if (!user) {
    // Same message for "no such email" and "wrong password" on purpose.
    showStatus(status, "Incorrect email or password. Please try again.", "error");
    return;
  }
  startSession(user);
  form.reset();
  clearFieldErrors(form);
  updateAuthUI();
  showToast(`Welcome back, ${firstName(user.name)}!`);
  navigate(user.role === "admin" ? "admin" : "home"); // role decides the destination
}

function handleRegisterSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const nameInput = $("regName");
  const emailInput = $("regEmail");
  const passwordInput = $("regPassword");
  const confirmInput = $("regConfirm");
  const status = $("registerStatus");
  showStatus(status, "");

  const ok = applyChecks([
    { input: nameInput, error: validateName(nameInput.value) },
    { input: emailInput, error: validateEmail(emailInput.value) },
    { input: passwordInput, error: validatePassword(passwordInput.value) },
    { input: confirmInput, error: !confirmInput.value ? "Please confirm your password." : confirmInput.value !== passwordInput.value ? "Passwords do not match." : "" }
  ]);
  if (!ok) { showStatus(status, "Please fix the highlighted fields.", "error"); return; }

  const result = registerUser(nameInput.value, emailInput.value, passwordInput.value);
  if (!result.ok) { showStatus(status, result.error, "error"); return; }

  // Registration worked: log the new user in and open the main page.
  const newUser = findUserByEmail(emailInput.value);
  showStatus(status, "✓ Account created! Taking you to the main page…", "success");
  setTimeout(() => {
    startSession(newUser);
    form.reset();
    clearFieldErrors(form);
    showStatus(status, "");
    updateAuthUI();
    navigate("home");
    showToast(`Welcome to JBN F-Store, ${firstName(newUser.name)}!`);
  }, 900);
}

let feedbackRating = 0;

function paintStars(value) {
  $$("#starRating button").forEach((star) => star.classList.toggle("active", Number(star.dataset.value) <= value));
}

function prefillContactForm() {
  const user = getCurrentUser();
  if (!user) return;
  if (!$("fbName").value) $("fbName").value = user.name;
  if (!$("fbEmail").value) $("fbEmail").value = user.email;
}

function handleFeedbackSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const status = $("formStatus");
  const fields = { name: $("fbName"), email: $("fbEmail"), subject: $("fbSubject"), message: $("fbMessage") };
  showStatus(status, "");

  const ok = applyChecks([
    { input: fields.name, error: validateName(fields.name.value) },
    { input: fields.email, error: validateEmail(fields.email.value) },
    { input: fields.subject, error: fields.subject.value.trim() ? "" : "Please enter a subject." },
    { input: fields.message, error: fields.message.value.trim().length < 10 ? "Please write at least 10 characters." : "" }
  ]);
  if (!ok) { showStatus(status, "Please complete all required fields correctly.", "error"); return; }

  const button = $("fbSubmitBtn");
  const originalLabel = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="spinner"></span> Sending...`;

  setTimeout(() => {
    // Demo only: there is no server yet, so we just log what would be sent.
    console.log("JBN F-Store - feedback submitted:", {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      subject: fields.subject.value.trim(),
      rating: feedbackRating || null,
      message: fields.message.value.trim(),
      submittedAt: new Date().toISOString()
    });
    button.disabled = false;
    button.innerHTML = originalLabel;
    showStatus(status, "✓ Thank you! Your feedback form was submitted successfully.", "success");
    form.reset();
    clearFieldErrors(form);
    feedbackRating = 0;
    paintStars(0);
  }, 900);
}

/* =====================================================================
   15. CLICK HANDLING + START-UP
   Instead of putting onclick="..." on every button, buttons carry a
   data-action name and ONE listener below decides what to do.
   ===================================================================== */
function handleClick(event) {
  // Category links (home page cards, footer links) open the menu filtered.
  const categoryLink = event.target.closest("[data-category]");
  if (categoryLink) {
    event.preventDefault();
    setMenuCategory(categoryLink.dataset.category, true);
    navigate("menu");
    return;
  }

  // Clicking the dark background behind a pop-up closes it.
  if (event.target.classList.contains("modal-overlay")) {
    if (event.target.id === "modalOverlay") closeProductModal();
    if (event.target.id === "formOverlay") closeProductForm();
    if (event.target.id === "confirmOverlay") closeConfirm(false);
    return;
  }
  if (event.target.id === "cartOverlay") { closeCart(); return; }

  const el = event.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const { action, id } = el.dataset;

  switch (action) {
    case "view-product": openProductModal(id); break;
    case "quick-add": {
      const product = getProductById(id);
      if (!product) break;
      if (hasVariants(product)) openProductModal(id); // needs a choice first
      else addToCart({ productId: id, selectionIds: {}, addonIds: [], qty: 1 });
      break;
    }
    case "close-modal": closeProductModal(); break;
    case "modal-variant": selectVariant(el.dataset.key, id); break;
    case "modal-addon": toggleAddon(id); break;
    case "modal-qty": changeModalQty(Number(el.dataset.delta)); break;
    case "modal-add": addModalItemToCart(); break;

    case "open-cart": openCart(); break;
    case "close-cart": closeCart(); break;
    case "cart-qty": changeCartQty(el.dataset.cartId, Number(el.dataset.delta)); break;
    case "cart-remove": removeCartItem(el.dataset.cartId); break;
    case "checkout": {
      const note = $("checkoutNote");
      note.textContent = "🚧 Online checkout is not part of this version of the project yet. Your cart is saved in this browser.";
      note.classList.add("show");
      break;
    }

    case "menu-filter": setMenuCategory(el.dataset.key, false); break;
    case "toggle-nav": toggleMobileNav(); break;
    case "logout": logout(); break;
    case "toggle-password": {
      const input = $(el.dataset.target);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      el.textContent = show ? "Hide" : "Show";
      break;
    }
    case "star": feedbackRating = Number(el.dataset.value); paintStars(feedbackRating); break;

    case "admin-tab": if (requireAdmin()) showAdminTab(el.dataset.tab); break;
    case "admin-add": openProductForm(null); break;
    case "admin-edit": openProductForm(id); break;
    case "admin-delete": deleteProductFlow(id); break;
    case "admin-reset": resetProductsFlow(); break;
    case "close-form": closeProductForm(); break;
    case "confirm-yes": closeConfirm(true); break;
    case "confirm-no": closeConfirm(false); break;
  }
}

function handleKeydown(event) {
  if (event.key !== "Escape") return;
  if ($("confirmOverlay").classList.contains("open")) closeConfirm(false);
  else if ($("formOverlay").classList.contains("open")) closeProductForm();
  else if ($("modalOverlay").classList.contains("open")) closeProductModal();
  else if ($("cartDrawer").classList.contains("open")) closeCart();
  else closeMobileNav();
}

function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("hashchange", handleRoute);

  $("loginForm").addEventListener("submit", handleLoginSubmit);
  $("registerForm").addEventListener("submit", handleRegisterSubmit);
  $("profileForm").addEventListener("submit", handleProfileSubmit);
  $("passwordForm").addEventListener("submit", handlePasswordSubmit);
  $("feedbackForm").addEventListener("submit", handleFeedbackSubmit);
  $("productForm").addEventListener("submit", handleProductFormSubmit);

  // Menu page search
  $("menuSearch").addEventListener("input", (e) => {
    menuState.query = e.target.value.trim().toLowerCase();
    applyMenuFilters();
  });

  // Admin: product + user search and filters
  $("adminProductSearch").addEventListener("input", (e) => {
    adminState.productQuery = e.target.value.trim().toLowerCase();
    renderAdminProducts();
  });
  $("adminProductCategory").addEventListener("change", (e) => {
    adminState.productCategory = e.target.value;
    renderAdminProducts();
  });
  $("adminUserSearch").addEventListener("input", (e) => {
    adminState.userQuery = e.target.value.trim().toLowerCase();
    renderAdminUsers();
  });
  $("adminUserRole").addEventListener("change", (e) => {
    adminState.userRole = e.target.value;
    renderAdminUsers();
  });

  // Admin: product form image controls
  $("pfImageSelect").addEventListener("change", (e) => {
    if (e.target.value === "__custom__") return; // keep the uploaded picture
    formState.image = e.target.value || null;
    syncImageControls();
  });
  $("pfImageFile").addEventListener("change", handleImageUpload);
  $("pfCategory").addEventListener("change", syncImageControls); // updates the placeholder icon

  // Star rating hover effect (contact form)
  $$("#starRating button").forEach((star) => {
    star.addEventListener("mouseenter", () => paintStars(Number(star.dataset.value)));
  });
  $("starRating").addEventListener("mouseleave", () => paintStars(feedbackRating));
}

function fillStoreInfo() {
  $$("[data-store]").forEach((el) => { el.textContent = STORE_INFO[el.dataset.store] || ""; });
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
}

function init() {
  ensureDefaultAdmin();
  products = loadProducts();
  cleanCart();
  fillStoreInfo();
  buildMenuFilters();
  buildAdminSelects();
  renderHome();
  bindEvents();
  updateAuthUI();
  refreshCartUI();
  handleRoute();
}

document.addEventListener("DOMContentLoaded", init);
