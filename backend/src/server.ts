import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authroutes from "./routes/auth.route.js";
const PORT = process.env.PORT || 5500;
const API_VERSION = process.env.API_VERSION as string;
const NODE_ENV = process.env.NODE_ENV as string;
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(API_VERSION, authroutes);

app.listen(PORT, () =>
  console.log(`The server is running on PORT: ${PORT} in ${NODE_ENV} mode`),
);
