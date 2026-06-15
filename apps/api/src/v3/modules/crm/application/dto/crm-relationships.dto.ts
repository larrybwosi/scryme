import {ApiProperty} from "@nestjs/swagger";
import {IsString, IsNotEmpty, IsEnum} from "class-validator";
import {CrmRelationshipType} from "@repo/db";

export class CreateCrmRelationshipDto {
  @ApiProperty({example: "company_employees"})
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({enum: CrmRelationshipType, example: "ONE_TO_MANY"})
  @IsEnum(CrmRelationshipType)
  type: CrmRelationshipType;

  @ApiProperty({example: "obj_company_id"})
  @IsString()
  @IsNotEmpty()
  sourceObjectId: string;

  @ApiProperty({example: "obj_person_id"})
  @IsString()
  @IsNotEmpty()
  targetObjectId: string;

  @ApiProperty({example: "Employees"})
  @IsString()
  @IsNotEmpty()
  sourceLabel: string;

  @ApiProperty({example: "Company"})
  @IsString()
  @IsNotEmpty()
  targetLabel: string;
}

export class CreateCrmAssociationDto {
  @ApiProperty({example: "rel_123"})
  @IsString()
  @IsNotEmpty()
  relationshipId: string;

  @ApiProperty({example: "rec_company_1"})
  @IsString()
  @IsNotEmpty()
  sourceRecordId: string;

  @ApiProperty({example: "rec_person_1"})
  @IsString()
  @IsNotEmpty()
  targetRecordId: string;
}
