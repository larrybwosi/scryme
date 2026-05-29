import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsJSON, IsDateString } from 'class-validator';
import { CrmFieldType } from '@repo/db';

export class CreateCrmRecordDto {
  @ApiProperty({ example: 'crm_obj_123' })
  @IsString()
  @IsNotEmpty()
  objectId: string;

  @ApiProperty({ example: { first_name: 'John', last_name: 'Doe' } })
  @IsJSON()
  data: any;

  @ApiProperty({ example: 'mem_123', required: false })
  @IsString()
  @IsOptional()
  ownerId?: string;
}

export class UpdateCrmRecordDto {
  @ApiProperty({ example: { first_name: 'John', last_name: 'Smith' } })
  @IsJSON()
  @IsOptional()
  data?: any;

  @ApiProperty({ example: 'mem_123', required: false })
  @IsString()
  @IsOptional()
  ownerId?: string;
}

export class CreateCrmNoteDto {
  @ApiProperty({ example: 'rec_123' })
  @IsString()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({ example: '# Meeting Notes\nDiscussed pricing.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '2023-10-27T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  timelineDate?: string;
}

export class CrmRecordResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  objectId: string;
  @ApiProperty()
  data: any;
  @ApiProperty()
  ownerId: string | null;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class CrmNoteResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  recordId: string;
  @ApiProperty()
  content: string;
  @ApiProperty()
  createdById: string | null;
  @ApiProperty()
  timelineDate: Date;
  @ApiProperty()
  createdAt: Date;
}
