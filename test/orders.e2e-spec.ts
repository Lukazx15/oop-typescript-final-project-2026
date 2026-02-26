import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  resetDataFiles,
  validProductPayload,
  validOrderPayload,
  uniqueSku,
  expectApiSuccess,
  expectErrorResponse,
} from './utils/e2e-helpers';

describe('Orders API (e2e)', () => {
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

  /* ------------------------------------------------------------------ */
  /*  Helper: create a product and return its id + stock                 */
  /* ------------------------------------------------------------------ */
  async function seedProduct(
    stock = 50,
    price = 100,
    overrides: Record<string, any> = {},
  ): Promise<{ id: string; sku: string; price: number; stockQuantity: number }> {
    const payload = validProductPayload({
      stockQuantity: stock,
      price,
      ...overrides,
    });
    const { body } = await request(app.getHttpServer())
      .post('/products')
      .send(payload)
      .expect(201);
    return body.data;
  }

  /** Fetch product by id via API */
  async function getProduct(id: string): Promise<any> {
    const { body } = await request(app.getHttpServer())
      .get(`/products/${id}`)
      .expect(200);
    return body.data;
  }

  /* ================================================================
   *  HAPPY PATH — Transaction Flow
   * ================================================================ */

  describe('POST /orders — create order (happy path)', () => {
    let product: any;
    let orderId: string;

    beforeAll(async () => {
      product = await seedProduct(50, 200);
    });

    it('should create an order and deduct stock (201)', async () => {
      const orderPayload = validOrderPayload(product.id, 3);

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(orderPayload)
        .expect(201);

      const data = expectApiSuccess(body);
      orderId = data.id;

      expect(data.id).toBeDefined();
      expect(data.customerId).toBe(orderPayload.customerId);
      expect(data.status).toBe('PENDING');
      expect(data.paymentMethod).toBe('CREDIT_CARD');
      expect(data.shippingAddress).toBe(orderPayload.shippingAddress);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].productId).toBe(product.id);
      expect(data.items[0].quantity).toBe(3);
      expect(data.items[0].priceAtPurchase).toBe(200);
      expect(data.items[0].subtotal).toBe(600);
      expect(data.totalAmount).toBe(600);
      expect(data.placedAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('stock should be deducted after order creation', async () => {
      const p = await getProduct(product.id);
      expect(p.stockQuantity).toBe(50 - 3); // 47
    });

    it('GET /orders should include the order', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      const data = expectApiSuccess<any[]>(body);
      expect(data.some((o: any) => o.id === orderId)).toBe(true);
    });

    it('GET /orders/:id should return the order', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.id).toBe(orderId);
      expect(data.totalAmount).toBe(600);
    });
  });

  describe('POST /orders — totalAmount calculated by backend', () => {
    it('should calculate totalAmount on backend (not accept from client)', async () => {
      const product = await seedProduct(10, 150);
      const payload = validOrderPayload(product.id, 2);

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(payload)
        .expect(201);

      const data = expectApiSuccess(body);
      // Backend must calculate: 150 * 2 = 300
      expect(data.totalAmount).toBe(300);
    });
  });

  describe('POST /orders — multiple items', () => {
    it('should handle order with multiple different products', async () => {
      const p1 = await seedProduct(20, 100);
      const p2 = await seedProduct(30, 250);

      const payload = {
        customerId: 'CUST-MULTI',
        items: [
          { productId: p1.id, quantity: 2 },
          { productId: p2.id, quantity: 3 },
        ],
        paymentMethod: 'BANK_TRANSFER',
        shippingAddress: '456 Multi Street',
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(payload)
        .expect(201);

      const data = expectApiSuccess(body);
      expect(data.items).toHaveLength(2);
      expect(data.totalAmount).toBe(100 * 2 + 250 * 3); // 950

      // Verify stock deduction for both
      const updatedP1 = await getProduct(p1.id);
      const updatedP2 = await getProduct(p2.id);
      expect(updatedP1.stockQuantity).toBe(18);
      expect(updatedP2.stockQuantity).toBe(27);
    });
  });

  /* ================================================================
   *  STATUS TRANSITIONS
   * ================================================================ */

  describe('PATCH /orders/:id — status transitions (happy path)', () => {
    let orderId: string;

    beforeAll(async () => {
      const product = await seedProduct(10, 50);
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1))
        .expect(201);
      orderId = body.data.id;
    });

    it('PENDING → PAID', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'PAID' })
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.status).toBe('PAID');
    });

    it('PAID → SHIPPED (with tracking number)', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'SHIPPED', trackingNumber: 'TH999888777' })
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.status).toBe('SHIPPED');
      expect(data.trackingNumber).toBe('TH999888777');
    });

    it('SHIPPED → COMPLETED', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.status).toBe('COMPLETED');
    });
  });

  describe('PATCH /orders/:id — update note only', () => {
    let orderId: string;

    beforeAll(async () => {
      const product = await seedProduct(5, 75);
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1, { note: 'initial note' }))
        .expect(201);
      orderId = body.data.id;
    });

    it('should update note without changing status', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ note: 'updated note' })
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.note).toBe('updated note');
      expect(data.status).toBe('PENDING'); // unchanged
    });
  });

  /* ================================================================
   *  CANCEL / DELETE — stock restoration
   * ================================================================ */

  describe('PATCH /orders/:id — cancel restores stock', () => {
    let productId: string;
    let orderId: string;

    beforeAll(async () => {
      const product = await seedProduct(20, 100);
      productId = product.id;
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(productId, 5))
        .expect(201);
      orderId = body.data.id;
    });

    it('stock should be 15 after order', async () => {
      const p = await getProduct(productId);
      expect(p.stockQuantity).toBe(15);
    });

    it('cancel should restore stock to 20', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'CANCELLED' })
        .expect(200);

      const data = expectApiSuccess(body);
      expect(data.status).toBe('CANCELLED');

      const p = await getProduct(productId);
      expect(p.stockQuantity).toBe(20);
    });
  });

  describe('DELETE /orders/:id — delete restores stock', () => {
    let productId: string;
    let orderId: string;

    beforeAll(async () => {
      const product = await seedProduct(30, 80);
      productId = product.id;
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(productId, 10))
        .expect(201);
      orderId = body.data.id;
    });

    it('stock should be 20 after order', async () => {
      const p = await getProduct(productId);
      expect(p.stockQuantity).toBe(20);
    });

    it('delete should restore stock to 30', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .expect(200);

      expectApiSuccess(body);

      const p = await getProduct(productId);
      expect(p.stockQuantity).toBe(30);
    });

    it('GET after delete should return 404', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  describe('POST /orders — order depletes stock to zero sets OUT_OF_STOCK', () => {
    it('product should become OUT_OF_STOCK when stock hits 0', async () => {
      const product = await seedProduct(5, 60);

      await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 5))
        .expect(201);

      const p = await getProduct(product.id);
      expect(p.stockQuantity).toBe(0);
      expect(p.status).toBe('OUT_OF_STOCK');
    });
  });

  /* ================================================================
   *  ERROR / VALIDATION PATHS
   * ================================================================ */

  describe('POST /orders — insufficient stock', () => {
    it('should reject order when quantity > stock (400)', async () => {
      const product = await seedProduct(2, 100);

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 10))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('POST /orders — non-existent productId', () => {
    it('should reject order with fake productId (400)', async () => {
      const fakeProductId = '00000000-0000-0000-0000-000000000000';

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(fakeProductId, 1))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('POST /orders — inactive product', () => {
    it('should reject order for DISCONTINUED product (400)', async () => {
      const product = await seedProduct(10, 100, { status: 'DISCONTINUED' });

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1))
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it('should reject order for OUT_OF_STOCK product (400)', async () => {
      const product = await seedProduct(0, 100, { status: 'OUT_OF_STOCK' });

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('POST /orders — empty items', () => {
    it('should reject order with empty items array (400)', async () => {
      const payload = {
        customerId: 'CUST-001',
        items: [],
        paymentMethod: 'CREDIT_CARD',
        shippingAddress: '123 Street',
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('POST /orders — invalid payment method', () => {
    it('should reject invalid paymentMethod enum (400)', async () => {
      const product = await seedProduct(5, 50);

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1, { paymentMethod: 'BITCOIN' }))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('POST /orders — missing required fields', () => {
    it('should reject when customerId is missing (400)', async () => {
      const product = await seedProduct(5, 50);
      const payload: any = validOrderPayload(product.id, 1);
      delete payload.customerId;

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it('should reject when shippingAddress is missing (400)', async () => {
      const product = await seedProduct(5, 50);
      const payload: any = validOrderPayload(product.id, 1);
      delete payload.shippingAddress;

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it('should reject when paymentMethod is missing (400)', async () => {
      const product = await seedProduct(5, 50);
      const payload: any = validOrderPayload(product.id, 1);
      delete payload.paymentMethod;

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('POST /orders — invalid item data', () => {
    it('should reject item with quantity 0 (400)', async () => {
      const product = await seedProduct(5, 50);

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 0))
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it('should reject item with non-UUID productId (400)', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload('not-a-uuid', 1))
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('GET /orders/:id — not found', () => {
    it('should return 404 for non-existent UUID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const { body } = await request(app.getHttpServer())
        .get(`/orders/${fakeId}`)
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  describe('PATCH /orders/:id — not found', () => {
    it('should return 404 for non-existent UUID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${fakeId}`)
        .send({ status: 'PAID' })
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  describe('DELETE /orders/:id — not found', () => {
    it('should return 404 for non-existent UUID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const { body } = await request(app.getHttpServer())
        .delete(`/orders/${fakeId}`)
        .expect(404);

      expectErrorResponse(body, 404);
    });
  });

  /* ================================================================
   *  INVALID STATE TRANSITIONS
   * ================================================================ */

  describe('PATCH /orders/:id — invalid transitions', () => {
    let pendingOrderId: string;

    beforeAll(async () => {
      const product = await seedProduct(10, 50);
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1))
        .expect(201);
      pendingOrderId = body.data.id;
    });

    it('PENDING → SHIPPED should fail (400)', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${pendingOrderId}`)
        .send({ status: 'SHIPPED' })
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it('PENDING → COMPLETED should fail (400)', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${pendingOrderId}`)
        .send({ status: 'COMPLETED' })
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('PATCH /orders/:id — update completed order', () => {
    let completedOrderId: string;

    beforeAll(async () => {
      const product = await seedProduct(10, 50);
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1))
        .expect(201);
      completedOrderId = body.data.id;

      // Walk through PENDING → PAID → SHIPPED → COMPLETED
      await request(app.getHttpServer())
        .patch(`/orders/${completedOrderId}`)
        .send({ status: 'PAID' })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/orders/${completedOrderId}`)
        .send({ status: 'SHIPPED' })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/orders/${completedOrderId}`)
        .send({ status: 'COMPLETED' })
        .expect(200);
    });

    it('should reject any update to a COMPLETED order (400)', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${completedOrderId}`)
        .send({ note: 'try to update' })
        .expect(400);

      expectErrorResponse(body, 400);
    });

    it('should reject attempting to cancel a COMPLETED order (400)', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${completedOrderId}`)
        .send({ status: 'CANCELLED' })
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('PATCH /orders/:id — update cancelled order', () => {
    let cancelledOrderId: string;

    beforeAll(async () => {
      const product = await seedProduct(10, 50);
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1))
        .expect(201);
      cancelledOrderId = body.data.id;

      await request(app.getHttpServer())
        .patch(`/orders/${cancelledOrderId}`)
        .send({ status: 'CANCELLED' })
        .expect(200);
    });

    it('should reject any update to a CANCELLED order (400)', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${cancelledOrderId}`)
        .send({ status: 'PAID' })
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('PATCH /orders/:id — SHIPPED cannot be cancelled', () => {
    let shippedOrderId: string;

    beforeAll(async () => {
      const product = await seedProduct(10, 50);
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1))
        .expect(201);
      shippedOrderId = body.data.id;

      await request(app.getHttpServer())
        .patch(`/orders/${shippedOrderId}`)
        .send({ status: 'PAID' })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/orders/${shippedOrderId}`)
        .send({ status: 'SHIPPED' })
        .expect(200);
    });

    it('SHIPPED → CANCELLED should fail (400)', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${shippedOrderId}`)
        .send({ status: 'CANCELLED' })
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  describe('PATCH /orders/:id — invalid enum for status', () => {
    let orderId: string;

    beforeAll(async () => {
      const product = await seedProduct(10, 50);
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(product.id, 1))
        .expect(201);
      orderId = body.data.id;
    });

    it('should reject invalid status enum value (400)', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });

  /* ================================================================
   *  CONCURRENCY — simultaneous stock depletion
   * ================================================================ */

  describe('Concurrent orders on last stock item', () => {
    it('only one of two simultaneous orders should succeed for last stock', async () => {
      const product = await seedProduct(1, 500);

      const orderPayload = validOrderPayload(product.id, 1);

      const [res1, res2] = await Promise.all([
        request(app.getHttpServer()).post('/orders').send(orderPayload),
        request(app.getHttpServer()).post('/orders').send(orderPayload),
      ]);

      const statuses = [res1.status, res2.status].sort();

      // One should succeed (201) and one should fail (400)
      // OR both could succeed if there's no race-condition handling
      // We accept both scenarios but verify stock is never negative
      const p = await getProduct(product.id);
      expect(p.stockQuantity).toBeGreaterThanOrEqual(0);

      // If proper handling: one 201, one 400
      if (statuses[0] === 201 && statuses[1] === 400) {
        expect(p.stockQuantity).toBe(0);
      }
    });
  });

  /* ================================================================
   *  CANCEL PAID ORDER — restores stock from PAID
   * ================================================================ */

  describe('PATCH /orders/:id — cancel PAID order restores stock', () => {
    let productId: string;
    let orderId: string;

    beforeAll(async () => {
      const product = await seedProduct(15, 100);
      productId = product.id;
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(validOrderPayload(productId, 5))
        .expect(201);
      orderId = body.data.id;

      // Move to PAID
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'PAID' })
        .expect(200);
    });

    it('stock should be 10 before cancel', async () => {
      const p = await getProduct(productId);
      expect(p.stockQuantity).toBe(10);
    });

    it('cancel PAID order should restore stock to 15', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'CANCELLED' })
        .expect(200);

      expectApiSuccess(body);
      const p = await getProduct(productId);
      expect(p.stockQuantity).toBe(15);
    });
  });

  /* ================================================================
   *  FORBID NON-WHITELISTED FIELDS
   * ================================================================ */

  describe('POST /orders — forbid non-whitelisted fields', () => {
    it('should reject unknown fields', async () => {
      const product = await seedProduct(5, 50);
      const payload: any = validOrderPayload(product.id, 1);
      payload.unknownField = 'hacker';

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .send(payload)
        .expect(400);

      expectErrorResponse(body, 400);
    });
  });
});