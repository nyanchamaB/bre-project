import jwt from "jsonwebtoken";

const token = jwt.sign(
  { userId: "123456", role: "student" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
console.log("Generated Token:", token);
