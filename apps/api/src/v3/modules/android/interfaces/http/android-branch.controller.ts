import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { StandardResponseInterceptor } from "../../../../common/interceptors/standard-response.interceptor";
import { AndroidBranchUseCase } from "../../application/use-cases/android-branch.use-case";
import {
  AndroidCreateBranchDto,
  AndroidUpdateBranchCoordinatesDto,
  AndroidUpdateBranchDto,
} from "../../application/dto/android-auth.dto";

@ApiTags("V3 Android Branch")
@Controller("android/branches")
@UseGuards(V3AuthGuard)
@UseInterceptors(StandardResponseInterceptor)
@ApiBearerAuth()
@ApiHeader({ name: "x-org-slug", required: false })
export class AndroidBranchController {
  constructor(private readonly androidBranchUseCase: AndroidBranchUseCase) {}

  @Get("locations")
  @ApiOperation({ summary: "Get organization branch locations for Android" })
  @ApiResponse({ status: 200, description: "Branch locations retrieved" })
  async getBranchLocations(@Req() req: any) {
    return this.androidBranchUseCase.getBranchLocations(req.v3Context);
  }

  @Get("locations/:id")
  @ApiOperation({ summary: "Get branch location details by ID for Android" })
  @ApiResponse({ status: 200, description: "Branch location details retrieved" })
  async getBranchDetails(@Req() req: any, @Param("id") id: string) {
    return this.androidBranchUseCase.getBranchDetails(req.v3Context, id);
  }

  @Post("locations")
  @ApiOperation({ summary: "Create a new branch location for Android" })
  @ApiResponse({ status: 201, description: "Branch location created successfully" })
  async createBranch(@Req() req: any, @Body() dto: AndroidCreateBranchDto) {
    return this.androidBranchUseCase.createBranch(req.v3Context, dto);
  }

  @Patch("locations/:id")
  @ApiOperation({ summary: "Update branch location details for Android" })
  @ApiResponse({ status: 200, description: "Branch location updated successfully" })
  async updateBranch(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AndroidUpdateBranchDto
  ) {
    return this.androidBranchUseCase.updateBranch(req.v3Context, id, dto);
  }

  @Patch("locations/:id/coordinates")
  @ApiOperation({ summary: "Update branch location GPS coordinates for Android" })
  @ApiResponse({ status: 200, description: "Branch location coordinates updated successfully" })
  async updateBranchCoordinates(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AndroidUpdateBranchCoordinatesDto
  ) {
    return this.androidBranchUseCase.updateBranchCoordinates(req.v3Context, id, dto);
  }

  @Delete("locations/:id")
  @ApiOperation({ summary: "Delete branch location for Android" })
  @ApiResponse({ status: 200, description: "Branch location deleted successfully" })
  async deleteBranch(@Req() req: any, @Param("id") id: string) {
    return this.androidBranchUseCase.deleteBranch(req.v3Context, id);
  }

  @Get("locations/:id/activity")
  @ApiOperation({ summary: "Get recent user activity and attendance check-ins for a branch location" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Branch activity logs retrieved" })
  async getBranchActivity(
    @Req() req: any,
    @Param("id") id: string,
    @Query("limit") limit?: number
  ) {
    return this.androidBranchUseCase.getBranchActivity(
      req.v3Context,
      id,
      limit ? Number(limit) : 20
    );
  }

  @Get("locations/:id/sales")
  @ApiOperation({ summary: "Get recent sales transactions for a branch location" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Branch sales transactions retrieved" })
  async getBranchSales(
    @Req() req: any,
    @Param("id") id: string,
    @Query("limit") limit?: number
  ) {
    return this.androidBranchUseCase.getBranchSales(
      req.v3Context,
      id,
      limit ? Number(limit) : 20
    );
  }

  @Get("locations/:id/stock-movements")
  @ApiOperation({ summary: "Get recent stock movements for a branch location" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Branch stock movements retrieved" })
  async getBranchStockMovements(
    @Req() req: any,
    @Param("id") id: string,
    @Query("limit") limit?: number
  ) {
    return this.androidBranchUseCase.getBranchStockMovements(
      req.v3Context,
      id,
      limit ? Number(limit) : 20
    );
  }
}
