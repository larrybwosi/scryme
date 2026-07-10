import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { CrmRecordService } from "../../application/use-cases/crm-record.service";
import { CrmNoteService } from "../../application/use-cases/crm-note.service";
import { CrmDefinitionService } from "../../application/use-cases/crm-definition.service";
import { CrmActivityService } from "../../application/use-cases/crm-activity.service";
import { CrmRelationshipService } from "../../application/use-cases/crm-relationship.service";
import {
  CreateCrmRecordDto,
  UpdateCrmRecordDto,
  CreateCrmNoteDto,
  CrmRecordResponseDto,
  CrmNoteResponseDto,
} from "../../application/dto/crm.dto";
import {
  CreateCrmObjectDto,
  CreateCrmFieldDto,
} from "../../application/dto/crm-definitions.dto";
import { CreateCrmActivityDto } from "../../application/dto/crm-activity.dto";
import {
  CreateCrmRelationshipDto,
  CreateCrmAssociationDto,
} from "../../application/dto/crm-relationships.dto";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";

@ApiTags("V3 CRM")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/crm")
@ApiParam({ name: "orgSlug", type: "string" })
export class CrmController {
  constructor(
    private readonly recordService: CrmRecordService,
    private readonly noteService: CrmNoteService,
    private readonly definitionService: CrmDefinitionService,
    private readonly activityService: CrmActivityService,
    private readonly relationshipService: CrmRelationshipService,
  ) {}

  @Post("records")
  @ApiOperation({ summary: "Create a new CRM record" })
  @ApiResponse({ status: 201, type: CrmRecordResponseDto })
  async createRecord(@Request() req: any, @Body() dto: CreateCrmRecordDto) {
    return this.recordService.createRecord(
      req.organization.id,
      dto.objectId,
      dto,
    );
  }

  @Get("records/:id")
  @ApiOperation({ summary: "Get a CRM record by ID" })
  @ApiResponse({ status: 200, type: CrmRecordResponseDto })
  async getRecord(@Request() req: any, @Param("id") id: string) {
    return this.recordService.getRecord(req.organization.id, id);
  }

  @Patch("records/:id")
  @ApiOperation({ summary: "Update a CRM record" })
  @ApiResponse({ status: 200, type: CrmRecordResponseDto })
  async updateRecord(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateCrmRecordDto,
  ) {
    return this.recordService.updateRecord(req.organization.id, id, dto);
  }

  @Post("notes")
  @ApiOperation({ summary: "Create a new CRM note" })
  @ApiResponse({ status: 201, type: CrmNoteResponseDto })
  async createNote(@Request() req: any, @Body() dto: CreateCrmNoteDto) {
    return this.noteService.createNote(
      req.organization.id,
      req.user.memberId,
      dto,
    );
  }

  @Get("records/:id/notes")
  @ApiOperation({ summary: "Get all notes for a CRM record" })
  @ApiResponse({ status: 200, type: [CrmNoteResponseDto] })
  async getRecordNotes(@Request() req: any, @Param("id") id: string) {
    return this.noteService.getNotesForRecord(req.organization.id, id);
  }

  @Post("activities")
  @ApiOperation({ summary: "Create a new CRM activity" })
  async createActivity(@Request() req: any, @Body() dto: CreateCrmActivityDto) {
    return this.activityService.createActivity(
      req.organization.id,
      req.user.memberId,
      dto,
    );
  }

  @Get("records/:id/timeline")
  @ApiOperation({
    summary: "Get a unified timeline of notes and activities for a CRM record",
  })
  async getTimeline(@Request() req: any, @Param("id") id: string) {
    return this.activityService.getTimeline(req.organization.id, id);
  }

  // --- Definitions ---

  @Post("objects")
  @ApiOperation({ summary: "Create a new CRM object definition" })
  async createObject(@Request() req: any, @Body() dto: CreateCrmObjectDto) {
    return this.definitionService.createObjectDefinition(
      req.organization.id,
      dto,
    );
  }

  @Get("objects")
  @ApiOperation({ summary: "List all CRM object definitions" })
  async listObjects(@Request() req: any) {
    return this.definitionService.getObjectDefinitions(req.organization.id);
  }

  @Post("objects/:objectId/fields")
  @ApiOperation({ summary: "Create a new CRM field definition" })
  async createField(
    @Request() req: any,
    @Param("objectId") objectId: string,
    @Body() dto: CreateCrmFieldDto,
  ) {
    return this.definitionService.createFieldDefinition(
      req.organization.id,
      objectId,
      dto,
    );
  }

  @Get("objects/:objectId/fields")
  @ApiOperation({ summary: "List all fields for a CRM object" })
  async listFields(@Request() req: any, @Param("objectId") objectId: string) {
    return this.definitionService.getFieldsForObject(
      req.organization.id,
      objectId,
    );
  }

  // --- Relationships ---

  @Post("relationships")
  @ApiOperation({ summary: "Define a new CRM relationship" })
  async createRelationship(
    @Request() req: any,
    @Body() dto: CreateCrmRelationshipDto,
  ) {
    return this.relationshipService.createRelationshipDefinition(
      req.organization.id,
      dto,
    );
  }

  @Get("relationships")
  @ApiOperation({ summary: "List all defined CRM relationships" })
  async listRelationships(@Request() req: any) {
    return this.relationshipService.getRelationships(req.organization.id);
  }

  @Post("associations")
  @ApiOperation({ summary: "Associate two CRM records" })
  async createAssociation(
    @Request() req: any,
    @Body() dto: CreateCrmAssociationDto,
  ) {
    return this.relationshipService.createAssociation(req.organization.id, dto);
  }

  @Get("records/:id/associations")
  @ApiOperation({ summary: "Get all associations for a CRM record" })
  async listRecordAssociations(@Request() req: any, @Param("id") id: string) {
    return this.relationshipService.getAssociationsForRecord(
      req.organization.id,
      id,
    );
  }
}
