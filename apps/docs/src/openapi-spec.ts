export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Scryme V3 REST API Reference',
    description: 'Comprehensive API Reference for Scryme V3 multi-tenant enterprise system covering POS, Sales, Stocking, Finance, Members, Production, and Services.',
    version: '3.0.0',
    contact: {
      name: 'Scryme Developer Support',
      email: 'support@scryme.tech'
    }
  },
  servers: [
    {
      url: 'https://api.scryme.tech/v3',
      description: 'Production V3 Server'
    },
    {
      url: 'http://localhost:3000/v3',
      description: 'Local Development Server'
    }
  ],
  security: [
    {
      BearerAuth: [],
      ApiKeyAuth: []
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Organization member authentication token.'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'POS device API Key.'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Invalid parameter provided' },
          error: { type: 'string', example: 'Bad Request' }
        }
      },
      SaleTransaction: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'txn_987213' },
          orderNumber: { type: 'string', example: 'POS-17182910' },
          totalAmount: { type: 'number', example: 149.99 },
          paidAmount: { type: 'number', example: 149.99 },
          txnStatus: { type: 'string', enum: ['COMPLETED', 'PREORDER', 'CANCELLED'], example: 'COMPLETED' },
          paymentStatus: { type: 'string', enum: ['PAID', 'PARTIALLY_PAID', 'UNPAID'], example: 'PAID' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/pos/sales': {
      post: {
        summary: 'Process a new POS Sale or Preorder',
        description: 'Submits a retail transaction or preorder with line items, payments, and location bindings.',
        tags: ['POS & Sales'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items', 'payments', 'locationId'],
                properties: {
                  locationId: { type: 'string', example: 'loc_main_01' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        variantId: { type: 'string', example: 'var_coffee_beans' },
                        quantity: { type: 'number', example: 2 },
                        unitPrice: { type: 'number', example: 15.00 }
                      }
                    }
                  },
                  payments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        method: { type: 'string', example: 'CASH' },
                        amount: { type: 'number', example: 30.00 }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Sale transaction successfully created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SaleTransaction'
                }
              }
            }
          }
        }
      }
    },
    '/stocking/transfers': {
      get: {
        summary: 'List Stock Transfers',
        description: 'Retrieves multi-location inventory stock transfer requests for the organization.',
        tags: ['Stocking & Inventory'],
        responses: {
          '200': {
            description: 'Array of stock transfers'
          }
        }
      }
    }
  }
};
