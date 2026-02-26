import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import {
  resetDataFiles,
  validProductPayload,
  uniqueSku,
  expectApiSuccess,
  expectErrorResponse,
  CreateProductPayload,
} from "./utils/e2e-helpers";

describe("Products API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    resetDataFiles();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /* ================================================================
   *  HAPPY PATH
   * ================================================================ */

  describe("GET /products", () => {
    it("should return an empty array when no products exist", async () => {
      const { body } = await request(app.getHttpServer())
        .get("/products")
        .expect(200);

      const data = expectApiSuccess<any[]>(body);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });
  });

  describe("POST /products — happy path", () => {
    let createdId: string;
    const payload = validProductPayload();

    it("should create a valid product (201)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(201);

      const data = expectApiSuccess(body);
      createdId = data.id;
      expect(data.id).toBeDefined();
      expect(data.name).toBe(payload.name);
      expect(data.sku).toBe(payload.sku);
      expect(data.price).toBe(payload.price);
      expect(data.stockQuantity).toBe(payload.stockQuantity);
      expect(data.category).toBe(payload.category);
      expect(data.brand).toBe(payload.brand);
      expect(data.images).toEqual(payload.images);
      expect(data.status).toBe("ACTIVE");
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it("GET /products should now include the created product", async () => {
      const { body } = await request(app.getHttpServer())
        .get("/products")
        .expect(200);

      const data = expectApiSuccess<any[]>(body);
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data.some((p: any) => p.sku === payload.sku)).toBe(true);
    });

    it("GET /products/:id should return the specific product", async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/products/${createdId}`)
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.id).toBe(createdId);
      expect(data.sku).toBe(payload.sku);
    });
  });

  describe("PUT /products/:id — full update", () => {
    let productId: string;
    let originalSku: string;

    beforeAll(async () => {
      originalSku = uniqueSku("PUT");
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ sku: originalSku }))
        .expect(201);
      productId = body.data.id;
    });

    it("should fully update a product", async () => {
      const updatePayload: CreateProductPayload = {
        name: "Updated Product Name",
        description: "Updated description",
        price: 999.99,
        stockQuantity: 10,
        sku: originalSku, // keep same SKU
        category: "CLOTHING",
        brand: "UpdatedBrand",
        images: ["https://example.com/updated.jpg"],
        status: "ACTIVE",
      };

      const { body } = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .send(updatePayload)
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.name).toBe("Updated Product Name");
      expect(data.price).toBe(999.99);
      expect(data.category).toBe("CLOTHING");
      expect(data.brand).toBe("UpdatedBrand");
    });
  });

  describe("PATCH /products/:id — partial update", () => {
    let productId: string;

    beforeAll(async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ price: 100, stockQuantity: 20 }))
        .expect(201);
      productId = body.data.id;
    });

    it("should update only the price", async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .send({ price: 250 })
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.price).toBe(250);
      expect(data.stockQuantity).toBe(20); // unchanged
    });

    it("should update only the stockQuantity", async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .send({ stockQuantity: 99 })
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.stockQuantity).toBe(99);
      expect(data.price).toBe(250); // from previous patch
    });

    it("should update the status", async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .send({ status: "DISCONTINUED" })
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.status).toBe("DISCONTINUED");
    });
  });

  describe("DELETE /products/:id", () => {
    let productId: string;

    beforeAll(async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload())
        .expect(201);
      productId = body.data.id;
    });

    it("should delete the product", async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(200);

      expectApiSuccess(body);
    });

    it("GET after delete should return 404", async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  /* ================================================================
   *  ERROR / VALIDATION PATHS
   * ================================================================ */

  describe("POST /products — duplicate SKU", () => {
    const sku = uniqueSku("DUP");

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ sku }))
        .expect(201);
    });

    it("should reject a second product with the same SKU (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ sku }))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("POST /products — missing required fields", () => {
    it("should reject when name is missing (400)", async () => {
      const payload = validProductPayload();
      delete (payload as any).name;

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject when sku is missing (400)", async () => {
      const payload = validProductPayload();
      delete (payload as any).sku;

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject when category is missing (400)", async () => {
      const payload = validProductPayload();
      delete (payload as any).category;

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject when brand is missing (400)", async () => {
      const payload = validProductPayload();
      delete (payload as any).brand;

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject when description is missing (400)", async () => {
      const payload = validProductPayload();
      delete (payload as any).description;

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject when images is missing (400)", async () => {
      const payload = validProductPayload();
      delete (payload as any).images;

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("POST /products — invalid enum values", () => {
    it("should reject invalid category (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ category: "INVALID_CATEGORY" }))
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject invalid status (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ status: "INVALID_STATUS" }))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("POST /products — numeric constraints", () => {
    it("should reject negative price (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ price: -10 }))
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject zero price (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ price: 0 }))
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject negative stockQuantity (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ stockQuantity: -5 }))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("POST /products — invalid images", () => {
    it("should reject non-URL strings in images (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ images: ["not-a-url"] }))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("POST /products — name too short", () => {
    it("should reject name shorter than 3 chars (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ name: "AB" }))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("POST /products — string for numeric field", () => {
    it("should reject string for price (400)", async () => {
      const payload: any = validProductPayload();
      payload.price = "not-a-number";

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject string for stockQuantity (400)", async () => {
      const payload: any = validProductPayload();
      payload.stockQuantity = "abc";

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("GET /products/:id — not found", () => {
    it("should return 404 for non-existent UUID", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const { body } = await request(app.getHttpServer())
        .get(`/products/${fakeId}`)
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  describe("PUT /products/:id — not found", () => {
    it("should return 404 for non-existent UUID", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const { body } = await request(app.getHttpServer())
        .put(`/products/${fakeId}`)
        .send(
          validProductPayload({
            status: "ACTIVE",
          }),
        )
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  describe("PATCH /products/:id — not found", () => {
    it("should return 404 for non-existent UUID", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const { body } = await request(app.getHttpServer())
        .patch(`/products/${fakeId}`)
        .send({ price: 100 })
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  describe("DELETE /products/:id — not found", () => {
    it("should return 404 for non-existent UUID", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const { body } = await request(app.getHttpServer())
        .delete(`/products/${fakeId}`)
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  describe("PATCH /products/:id — invalid enum in patch", () => {
    let productId: string;

    beforeAll(async () => {
      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload())
        .expect(201);
      productId = body.data.id;
    });

    it("should reject invalid status value (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .send({ status: "BOGUS" })
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it("should reject invalid category value (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .send({ category: "BOGUS" })
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("PUT /products/:id — duplicate SKU on update", () => {
    let productIdA: string;
    let skuB: string;

    beforeAll(async () => {
      const resA = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload())
        .expect(201);
      productIdA = resA.body.data.id;

      skuB = uniqueSku("SKU-B");
      await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ sku: skuB }))
        .expect(201);
    });

    it("should reject PUT that changes SKU to existing one (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .put(`/products/${productIdA}`)
        .send(
          validProductPayload({
            sku: skuB,
            status: "ACTIVE",
          }),
        )
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("PATCH /products/:id — duplicate SKU on patch", () => {
    let productIdC: string;
    let skuD: string;

    beforeAll(async () => {
      const resC = await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload())
        .expect(201);
      productIdC = resC.body.data.id;

      skuD = uniqueSku("SKU-D");
      await request(app.getHttpServer())
        .post("/products")
        .send(validProductPayload({ sku: skuD }))
        .expect(201);
    });

    it("should reject PATCH that changes SKU to existing one (400)", async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/products/${productIdC}`)
        .send({ sku: skuD })
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe("POST /products — forbid non-whitelisted fields", () => {
    it("should strip or reject unknown fields", async () => {
      const payload: any = validProductPayload();
      payload.unknownField = "should be rejected";

      const { body } = await request(app.getHttpServer())
        .post("/products")
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });
});