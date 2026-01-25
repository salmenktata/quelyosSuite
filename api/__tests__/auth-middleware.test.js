const express = require("express");
const request = require("supertest");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../src/middleware/auth");

describe("auth middleware - cookies and bearer", () => {
  const JWT_SECRET = "test-secret-middleware";
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Protected route using the middleware under test
    app.get("/protected", authMiddleware, (req, res) => {
      res.json({ user: req.user });
    });
  });

  const signToken = (overrides = {}) =>
    jwt.sign(
      {
        userId: "user-123",
        companyId: "company-456",
        role: "ADMIN",
        ...overrides,
      },
      JWT_SECRET,
      { expiresIn: "15m" },
    );

  it("accepts a valid Bearer token", async () => {
    const token = signToken();

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      userId: "user-123",
      companyId: "company-456",
      role: "ADMIN",
    });
  });

  it("accepts a valid accessToken cookie", async () => {
    const token = signToken({ role: "USER" });

    const res = await request(app)
      .get("/protected")
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      userId: "user-123",
      companyId: "company-456",
      role: "USER",
    });
  });

  it("rejects missing token", async () => {
    const res = await request(app).get("/protected");

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("rejects invalid token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});
