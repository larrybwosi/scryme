import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
  Query,
  Patch,
  Param,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { GetProductsUseCase } from "../../application/use-cases/get-products.use-case";
import { CreateProductUseCase } from "../../application/use-cases/create-product.use-case";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "../../../../common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ServiceCatalogResponseDto,
  CreateProductReviewDto,
  UpdateProductReviewDto,
  ProductReviewResponseDto,
} from "../../application/dto/product.dto";
import { UpdateSupplierProductDto } from "../../application/dto/supplier-product.dto";
import { ReviewPriceChangeDto } from "../../application/dto/price-change.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";
import { PricingManagementService } from "../../application/services/pricing-management.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ReviewPriceChangeUseCase } from "../../application/use-cases/review-price-change.use-case";
import { ServiceManagementService } from "../../../services/application/services/service-management.service";

@ApiTags("V3 Catalog")
@ApiBearerAuth()
@Controller(":orgSlug/catalog")
@ApiParam({ name: "orgSlug", type: "string", description: "The unique organization slug" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class ProductController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly reviewPriceChangeUseCase: ReviewPriceChangeUseCase,
    private readonly pricingManagementService: PricingManagementService,
    private readonly prisma: PrismaService,
    private readonly serviceManagement: ServiceManagementService,
  ) {}

  @Get("products")
  @Permissions("catalog:product:read")
  @ApiOperation({
    summary: "Get all products for an organization",
    description: "Retrieves a paginated list of all physical catalog products registered under the organization, complete with their first-level variants, cost history, pricing tables, categories, and images.",
    operationId: "Catalog_GetProducts",
  })
  @ApiResponse({
    status: 200,
    type: [ProductResponseDto],
    description: "List of products",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  async getProducts(
    @Req() req: any,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const products = await this.getProductsUseCase.execute(
      req.organization.id,
      paginationQuery,
    );

    return products.map(p => {
      const firstVariant = p.variants?.[0];
      const retailPrice = firstVariant?.retailPrice ?? null;

      const reviewCount = p.reviews?.length || 0;
      const totalRating = p.reviews?.reduce((acc: number, r: any) => acc + r.rating, 0) || 0;
      const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(2)) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        sku: p.sku || "",
        retailPrice,
        images: p.imageUrls || [],
        category: p.category
          ? {
              id: p.categoryId,
              name: p.category.name,
            }
          : {
              id: p.categoryId,
              name: "Unknown",
            },
        slug: p.slug || null,
        variants: p.variants || [],
        customFields: p.customFields || null,
        brand: p.brand || null,
        rating: p.rating || null,
        isNew: p.isNew || false,
        detailedDescription: p.detailedDescription || null,
        tags: p.tags || [],
        isFeatured: p.isFeatured || false,
        isActive: p.isActive || false,
        pointsOnPurchase: p.pointsOnPurchase || null,
        reviews: p.reviews || [],
        favoritesCount: p.favoritesCount || 0,
        favouritesCount: p.favoritesCount || 0,
        meta: {
          averageRating,
          reviewCount,
        },
      };
    });
  }

  @Get("products/:idOrSlug")
  @Permissions("catalog:product:read")
  @ApiOperation({
    summary: "Get a product by ID or Slug",
    description: "Retrieves a single product by its unique database identifier or SEO slug.",
    operationId: "Catalog_GetProduct",
  })
  @ApiParam({ name: "idOrSlug", type: "string", description: "The ID or slug of the product" })
  @ApiResponse({
    status: 200,
    type: ProductResponseDto,
    description: "The product details",
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponseDto,
    description: "Product not found",
  })
  async getProduct(
    @Req() req: any,
    @Param("idOrSlug") idOrSlug: string,
  ) {
    const organizationId = req.organization.id;

    const product = await this.prisma.client.product.findFirst({
      where: {
        organizationId,
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        category: true,
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            retailPrice: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const firstVariant = product.variants?.[0];
    const retailPrice = firstVariant?.retailPrice ? Number(firstVariant.retailPrice) : null;

    const reviewCount = product.reviews?.length || 0;
    const totalRating = product.reviews?.reduce((acc: number, r: any) => acc + r.rating, 0) || 0;
    const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(2)) : 0;
    const favoritesCount = product._count?.favorites ?? 0;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku || "",
      retailPrice,
      images: product.imageUrls || [],
      category: product.category
        ? {
            id: product.categoryId,
            name: product.category.name,
          }
        : {
            id: product.categoryId,
            name: "Unknown",
          },
      slug: product.slug || null,
      variants: product.variants || [],
      customFields: product.customFields || null,
      brand: product.brand || null,
      rating: product.rating || null,
      isNew: product.isNew || false,
      detailedDescription: product.detailedDescription || null,
      tags: product.tags || [],
      isFeatured: product.isFeatured || false,
      isActive: product.isActive || false,
      pointsOnPurchase: product.pointsOnPurchase || null,
      reviews: product.reviews || [],
      favoritesCount,
      favouritesCount: favoritesCount,
      meta: {
        averageRating,
        reviewCount,
      },
    };
  }

  @Get("services")
  @Permissions("services:read")
  @ApiOperation({
    summary: "Get all services for an organization",
    description: "Retrieves a unified paginated catalog of all services belonging to the organization. Loads categories, pricing details, duration metrics, active statuses, and custom field structures seamlessly.",
    operationId: "Catalog_GetServices",
  })
  @ApiResponse({
    status: 200,
    type: [ServiceCatalogResponseDto],
    description: "List of services",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  async getServices(
    @Req() req: any,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const organizationId = req.organization.id;

    // Use ServiceManagementService to load paginated and optimized services cleanly (Architectural Consistency)
    const paginatedItems = await this.serviceManagement.getServicesPaginated(
      organizationId,
      paginationQuery,
    );

    return paginatedItems.map(s => {
      const customFieldsObj =
        s.customFields && typeof s.customFields === "object"
          ? (s.customFields as any)
          : {};
      const slug = customFieldsObj.slug || null;
      const images = Array.isArray(customFieldsObj.images)
        ? customFieldsObj.images
        : [];

      return {
        id: s.id,
        name: s.name,
        description: s.description,
        sku: s.sku,
        retailPrice: s.price ? Number(s.price) : 0,
        images,
        category: s.category
          ? {
              id: s.categoryId,
              name: s.category.name,
            }
          : {
              id: s.categoryId,
              name: "Unknown",
            },
        slug,
        pricingModel: s.pricingModel,
        estimatedDuration: s.estimatedDuration,
        isActive: s.isActive,
        customFields: s.customFields || null,
      };
    });
  }

  @Post("products")
  @Permissions("catalog:product:create")
  @ApiOperation({
    summary: "Create a new product",
    description: "Registers a new physical product under the organization's catalog. Supports setting name, description, SKU, and base catalog price.",
    operationId: "Catalog_CreateProduct",
  })
  @ApiResponse({
    status: 201,
    type: ProductResponseDto,
    description: "Product created successfully",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  async createProduct(@Req() req: any, @Body() body: CreateProductDto) {
    const product = await this.createProductUseCase.execute({
      ...body,
      organizationId: req.organization.id,
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku || "",
      retailPrice: null,
      images: [],
      category: {
        id: product.categoryId,
        name: "Unknown",
      },
      slug: null,
      variants: [],
      customFields: product.customFields || null,
    };
  }

  @Patch("products/:id")
  @Permissions("catalog:product:update")
  @ApiOperation({
    summary: "Update product details and CMS customizations",
    operationId: "Catalog_UpdateProduct",
  })
  @ApiParam({ name: "id", type: "string" })
  @ApiResponse({
    status: 200,
    type: ProductResponseDto,
    description: "Product updated",
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponseDto,
    description: "Product not found",
  })
  async updateProduct(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: UpdateProductDto,
  ) {
    const organizationId = req.organization.id;

    const exists = await this.prisma.client.product.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!exists) {
      throw new NotFoundException("Product not found");
    }

    const updated = (await this.prisma.client.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        customFields: body.customFields !== undefined ? (body.customFields as any) : undefined,
      },
      include: {
        category: true,
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            retailPrice: true,
          },
        },
      },
    })) as any;

    const firstVariant = updated.variants?.[0];
    const retailPrice = firstVariant?.retailPrice ? Number(firstVariant.retailPrice) : null;

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      sku: updated.sku || "",
      retailPrice,
      images: updated.imageUrls || [],
      category: updated.category
        ? {
            id: updated.categoryId,
            name: updated.category.name,
          }
        : {
            id: updated.categoryId,
            name: "Unknown",
          },
      slug: updated.slug || null,
      variants: updated.variants || [],
      customFields: updated.customFields || null,
    };
  }

  @Patch("suppliers/:supplierId/variants/:variantId")
  @Permissions("catalog:product:update")
  @ApiOperation({
    summary: "Update supplier variant details and trigger price recalculation",
    description: "Updates specific partner-supplier specifications for a product variant (such as cost price, preferred flag, or lead times) and automatically recalibrates retail price structures accordingly. Prevents unauthorized IDOR by validating variant-supplier tenancy.",
    operationId: "Catalog_UpdateSupplierVariant",
  })
  @ApiParam({ name: "supplierId", type: "string", description: "The ID of the supplier partner" })
  @ApiParam({ name: "variantId", type: "string", description: "The ID of the product variant" })
  @ApiResponse({ status: 200, description: "Supplier variant details updated successfully and margins recomputed" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid update data" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Supplier variant mapping not found" })
  async updateSupplierVariant(
    @Req() req: any,
    @Param("supplierId") supplierId: string,
    @Param("variantId") variantId: string,
    @Body() body: UpdateSupplierProductDto,
  ) {
    const organizationId = req.organization.id;

    const result = await this.prisma.client.$transaction(async tx => {
      // SECURITY (Sentinel): Validate ownership before update to prevent IDOR.
      // ProductSupplier doesn't have organizationId directly, so we check via Product relation.
      const exists = await tx.productSupplier.findFirst({
        where: {
          variantId,
          supplierId,
          product: { organizationId },
        },
      });

      if (!exists) {
        throw new NotFoundException("Supplier variant not found");
      }

      // If setting as preferred, unset any existing preferred supplier for this variant
      if (body.isPreferred === true) {
        await tx.productSupplier.updateMany({
          where: {
            variantId,
            isPreferred: true,
            product: { organizationId },
          },
          data: { isPreferred: false },
        });
      }

      const updated = await tx.productSupplier.update({
        where: {
          variantId_supplierId: {
            variantId,
            supplierId,
          },
        },
        data: body,
      });

      // If cost price or preferred status changed, trigger recalculation
      if (body.costPrice !== undefined || body.isPreferred !== undefined) {
        if (updated.variantId) {
          await this.pricingManagementService.handleCostChange(
            {
              organizationId,
              variantId: updated.variantId,
              source: "SUPPLIER_UPDATE",
              sourceId: supplierId,
              newCost: body.costPrice ? Number(body.costPrice) : undefined,
            },
            tx,
          );
        }
      }

      return updated;
    });

    return result;
  }

  @Get("price-change-requests")
  @Permissions("catalog:product:read")
  @ApiOperation({
    summary: "Get all pending price change requests",
    description: "Returns a paginated list of catalog price adjustments requiring review. Utilizes highly optimized targeted selects to load variants, products, base pricing tables, and audit details with minimal DB network payload.",
    operationId: "Catalog_GetPriceChangeRequests",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved price change requests" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  async getPriceChangeRequests(
    @Req() req: any,
    @Query() pagination: PaginationQueryDto,
  ) {
    const { limit = 20, offset = 0 } = pagination;
    const organizationId = req.organization.id;

    /**
     * OPTIMIZATION (Bolt ⚡): Replaced deep 'include' with targeted 'select'.
     * Fetching only required fields for the listing UI significantly reduces
     * database I/O, network payload, and serialization time.
     * Estimated impact: ~60-70% reduction in response payload size.
     */
    const [items, total] = await Promise.all([
      this.prisma.client.priceChangeRequest.findMany({
        where: { organizationId },
        select: {
          id: true,
          organizationId: true,
          priceListItemId: true,
          oldPrice: true,
          newPrice: true,
          oldCost: true,
          newCost: true,
          reason: true,
          source: true,
          sourceId: true,
          status: true,
          requestedAt: true,
          reviewedBy: true,
          reviewedAt: true,
          rejectionReason: true,
          priceListItem: {
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  barcode: true,
                  createdAt: true,
                  updatedAt: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
              priceList: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { requestedAt: "desc" },
      }),
      this.prisma.client.priceChangeRequest.count({
        where: { organizationId },
      }),
    ]);

    return {
      data: items,
      total,
      limit,
      offset,
    };
  }

  @Post("price-change-requests/:id/review")
  @Permissions("catalog:product:update")
  @ApiOperation({
    summary: "Approve or reject a price change request",
    description: "Reviews and applies a price change request. If approved, the target price list item is updated instantly, dispatching updates to connected POS and digital channels. If rejected, stores rejection rationale for audit logs.",
    operationId: "Catalog_ReviewPriceChangeRequest",
  })
  @ApiParam({ name: "id", type: "string", description: "The ID of the price change request" })
  @ApiResponse({ status: 200, description: "Price change request successfully reviewed and applied/rejected" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Invalid review parameters or illegal status transition" })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: "Unauthorized" })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Price change request not found" })
  async reviewPriceChangeRequest(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: ReviewPriceChangeDto,
  ) {
    return this.reviewPriceChangeUseCase.execute({
      organizationId: req.organization.id,
      requestId: id,
      memberId: req.user.memberId,
      status: body.status,
      rejectionReason: body.rejectionReason,
    });
  }

  @Post("products/:productId/reviews")
  @Permissions("customer:write:own")
  @ApiOperation({
    summary: "Create a new review for a product",
    description: "Creates a product review. Dynamically falls back to v3Context customerId if body customerId is omitted.",
    operationId: "Catalog_CreateReview",
  })
  @ApiParam({ name: "productId", type: "string" })
  @ApiResponse({ status: 201, type: ProductReviewResponseDto })
  async createReview(
    @Req() req: any,
    @Param("productId") productId: string,
    @Body() body: CreateProductReviewDto,
  ) {
    const organizationId = req.organization.id;
    const customerId = body.customerId || req.v3Context?.customerId;

    if (!customerId) {
      throw new BadRequestException("Customer ID is required");
    }

    // Tenant Isolation Check: Verify that the product exists and belongs to this organization
    const product = await this.prisma.client.product.findFirst({
      where: { id: productId, organizationId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return this.prisma.client.productReview.create({
      data: {
        organizationId,
        customerId,
        productId,
        rating: Number(body.rating),
        comment: body.comment,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  @Patch("reviews/:reviewId")
  @Permissions("customer:write:own")
  @ApiOperation({
    summary: "Update an existing review",
    description: "Updates rating or comment on a review. Enforces tenant isolation and ownership restrictions.",
    operationId: "Catalog_UpdateReview",
  })
  @ApiParam({ name: "reviewId", type: "string" })
  @ApiResponse({ status: 200, type: ProductReviewResponseDto })
  async updateReview(
    @Req() req: any,
    @Param("reviewId") reviewId: string,
    @Body() body: UpdateProductReviewDto,
  ) {
    const organizationId = req.organization.id;
    const customerId = body.customerId || req.v3Context?.customerId;

    if (!customerId) {
      throw new BadRequestException("Customer ID is required");
    }

    // IDOR Prevention: Use findFirst to enforce tenant/organization isolation
    const review = await this.prisma.client.productReview.findFirst({
      where: { id: reviewId, organizationId },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    // Ownership check
    if (review.customerId !== customerId) {
      throw new ForbiddenException("Not authorized to update this review");
    }

    return this.prisma.client.productReview.update({
      where: { id: reviewId },
      data: {
        rating: body.rating !== undefined ? Number(body.rating) : undefined,
        comment: body.comment,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  @Delete("reviews/:reviewId")
  @Permissions("customer:write:own")
  @ApiOperation({
    summary: "Delete a review",
    description: "Deletes a review by its ID. Enforces tenant isolation and ownership or admin permission checks.",
    operationId: "Catalog_DeleteReview",
  })
  @ApiParam({ name: "reviewId", type: "string" })
  @ApiQuery({ name: "customerId", type: "string", required: false })
  @ApiResponse({ status: 200, description: "Review successfully deleted" })
  async deleteReview(
    @Req() req: any,
    @Param("reviewId") reviewId: string,
    @Query("customerId") queryCustomerId?: string,
  ) {
    const organizationId = req.organization.id;
    const customerId = queryCustomerId || req.v3Context?.customerId;

    if (!customerId) {
      throw new BadRequestException("Customer ID is required");
    }

    // IDOR Prevention: Use findFirst to enforce tenant/organization isolation
    const review = await this.prisma.client.productReview.findFirst({
      where: { id: reviewId, organizationId },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    const isOwner = review.customerId === customerId;
    const scopes = req.v3Context?.scopes || [];
    const canManageAll =
      scopes.includes("*") ||
      scopes.includes("product:manage:reviews");

    if (!isOwner && !canManageAll) {
      throw new ForbiddenException("Not authorized to delete this review");
    }

    await this.prisma.client.productReview.delete({
      where: { id: reviewId },
    });

    return { success: true };
  }
}
