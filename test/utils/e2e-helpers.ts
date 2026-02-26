import { expect } from "@jest/globals";

import { writeFileSync } from 'fs';
import { join } from 'path';

/* ------------------------------------------------------------------ */
/*  Paths                                                              */
/* ------------------------------------------------------------------ */
const DATA_DIR = join(process.cwd(), 'data');
export const PRODUCTS_FILE = join(DATA_DIR, 'products.json');
export const ORDERS_FILE = join(DATA_DIR, 'orders.json');

/* ------------------------------------------------------------------ */
/*  Data reset                                                         */
/* ------------------------------------------------------------------ */

/** Overwrite both JSON data files with empty arrays. */
export function resetDataFiles(): void {
  writeFileSync(PRODUCTS_FILE, '[]', 'utf-8');
  writeFileSync(ORDERS_FILE, '[]', 'utf-8');
}

/* ------------------------------------------------------------------ */
/*  Unique identifier factories                                        */
/* ------------------------------------------------------------------ */

let skuCounter = 0;
/** Return a unique SKU string per test run. */
export function uniqueSku(prefix = 'TEST'): string {
  return `${prefix}-${Date.now()}-${++skuCounter}`;
}

/* ------------------------------------------------------------------ */
/*  Payload factories                                                  */
/* ------------------------------------------------------------------ */

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  sku: string;
  category: string;
  brand: string;
  images: string[];
  weight?: number;
  status?: string;
}

export function validProductPayload(
  overrides: Partial<CreateProductPayload> = {},
): CreateProductPayload {
  return {
    name: 'Test Product',
    description: 'A product created by E2E tests',
    price: 199.99,
    stockQuantity: 50,
    sku: uniqueSku(),
    category: 'ELECTRONICS',
    brand: 'TestBrand',
    images: ['https://example.com/img.jpg'],
    ...overrides,
  };
}

export interface CreateOrderPayload {
  customerId: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: string;
  shippingAddress: string;
  note?: string;
}

export function validOrderPayload(
  productId: string,
  quantity = 1,
  overrides: Partial<CreateOrderPayload> = {},
): CreateOrderPayload {
  return {
    customerId: 'CUST-E2E-001',
    items: [{ productId, quantity }],
    paymentMethod: 'CREDIT_CARD',
    shippingAddress: '123 Test Street, Test City 10000',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Assertion helpers                                                  */
/* ------------------------------------------------------------------ */

/**
 * Assert the standard success ApiResponse shape.
 * Returns the `data` property for further assertions.
 */
export function expectApiSuccess<T = any>(body: any): T {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('message');
  expect(typeof body.message).toBe('string');
  expect(body).toHaveProperty('data');
  return body.data as T;
}

/**
 * Assert the standard NestJS error response shape.
 */
export function expectErrorResponse(
  body: any,
  expectedStatus: number,
): void {
  expect(body).toHaveProperty('statusCode', expectedStatus);
  expect(body).toHaveProperty('message');
}