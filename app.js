const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

/**routers */
const userRouter = require("./routes/userRouter");
const productRouter = require("./routes/productRouter");
const authRouter = require("./routes/authRouter");
const reviewRouter = require("./routes/reviewRouter");
const bookingRouter = require("./routes/bookingRouter");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("dotenv").config(); // to read .env file and make them available in process.env
console.log(process.env.PORT);
const PORT = process.env.PORT || 3300;

/** database connectiobn starts */
mongoose
  .connect(process.env.DB_URL)
  .then((connection) => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

/** database connection ends */

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Use an external store for consistency across multiple server instances.
})

// Apply the rate limiting middleware to all requests.

const app = express();

app.use(express.json());
app.use(cookieParser());
// app.use(cors());
app.use(cors({ origin: true, credentials: true }));
app.use(limiter)
app.use(mongoSanitize());

app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.path}`);
  next();
});

app.use("/search", async function (req, res) {
  const sortQuery = req.query.sort;
  const selectQuery = req.query.select;
  /** sorting logic */
  let queryResPromise = Product.find();
  if (sortQuery) {
    const [sortParam, order] = sortQuery.split(" ");
    console.log("sortParam", sortParam);
    console.log("order", order);
    if (order === "asc") {
      queryResPromise = queryResPromise.sort(sortParam);
    } else {
      queryResPromise = queryResPromise.sort(`-${sortParam}`);
    }
  }
  const result = await queryResPromise;

  console.log("sort ", sortParams);
  console.log("select ", selectParams);
  res.status(200).json({
    message: "search successfull",
    data: req.query,
  });
});

/** lets say the requested path is /api/user/123 */
app.use("/api/user", userRouter); // should be accessible only to valid user with valid token
/** lets say the requested url is to delete a product with id abc ; url -> /api/product/abc*/
app.use("/api/product", productRouter);
app.use("/api/auth", authRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/reviews", reviewRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    status: statusCode,
    message: message,
  });
})

app.use(function (req, res) {
  res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
