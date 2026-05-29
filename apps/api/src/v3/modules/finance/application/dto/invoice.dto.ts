import { IsString, IsOptional, IsDate, IsNumber, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsNumber() quantity: number;
  @IsNumber() rate: number;
  @IsNumber() amount: number;
  @IsString() @IsOptional() taxTemplate?: string;
}

export class CreateInvoiceDto {
  @IsString() customer: string;
  @IsDate() @Type(() => Date) postingDate: Date;
  @IsDate() @IsOptional() @Type(() => Date) dueDate?: Date;
  @IsString() @IsOptional() templateId?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceItemDto) items: InvoiceItemDto[];
  @IsString() @IsOptional() kraPin?: string;
  @IsBoolean() @IsOptional() etrMode?: boolean;
}

export class UpdateInvoiceDto extends CreateInvoiceDto {
  @IsString() @IsOptional() status?: string;
}

export class InvoiceConfigDto {
  @IsString() @IsOptional() defaultTemplate?: string;
  @IsString() @IsOptional() primaryColor?: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() companyName?: string;
  @IsString() @IsOptional() companyAddress?: string;
  @IsString() @IsOptional() companyEmail?: string;
  @IsString() @IsOptional() companyPhone?: string;
  @IsString() @IsOptional() companyWebsite?: string;
  @IsBoolean() @IsOptional() showTaxBreakdown?: boolean;
  @IsBoolean() @IsOptional() showTerms?: boolean;
  @IsBoolean() @IsOptional() showNotes?: boolean;
  @IsBoolean() @IsOptional() showLineNumbers?: boolean;
  @IsString() @IsOptional() defaultTerms?: string;
  @IsString() @IsOptional() defaultNotes?: string;
}
