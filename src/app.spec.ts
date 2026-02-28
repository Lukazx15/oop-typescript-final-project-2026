import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});