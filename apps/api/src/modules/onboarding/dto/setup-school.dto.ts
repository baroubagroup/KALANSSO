import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassroomInputDto {
  @ApiProperty({ example: 'CP1 A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CP1' })
  @IsString()
  @IsNotEmpty()
  levelCode: string;

  @ApiProperty({ example: 'PRIMAIRE' })
  @IsString()
  @IsNotEmpty()
  cycle: string;

  @ApiProperty({ example: 60 })
  @IsNumber()
  capacity: number;

  @ApiPropertyOptional({ example: 'Salle 04' })
  @IsString()
  @IsOptional()
  roomNumber?: string;
}

export class SubjectInputDto {
  @ApiProperty({ example: 'Mathématiques' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'MATH' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'PRIMAIRE' })
  @IsString()
  @IsNotEmpty()
  cycle: string;

  @ApiProperty({ example: 4.0 })
  @IsNumber()
  coefficient: number;
}

export class FeeItemInputDto {
  @ApiProperty({ example: 'Scolarité 1ère Tranche' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'TUITION' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: true })
  isMandatory: boolean;
}

export class SetupSchoolDto {
  @ApiProperty({ example: 'Complexe Scolaire Wend-Manegda' })
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @ApiProperty({ example: 'PRIVATE_LAIC' })
  @IsString()
  @IsNotEmpty()
  schoolType: string;

  @ApiPropertyOptional({ example: 'MENAPLN-BF-0042' })
  @IsString()
  @IsOptional()
  codeMenapln?: string;

  @ApiProperty({ example: 'Ouagadougou' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '+22670000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'contact@wendmanegda.bf' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Discipline - Travail - Succès' })
  @IsString()
  @IsOptional()
  motto?: string;

  @ApiProperty({ example: ['MATERNELLE', 'PRIMAIRE', 'POST_PRIMAIRE_COLLEGE', 'SECONDAIRE_LYCEE_GENERAL'] })
  @IsArray()
  activeCycles: string[];

  @ApiProperty({ type: [ClassroomInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassroomInputDto)
  classrooms: ClassroomInputDto[];

  @ApiProperty({ example: 'TRIMESTER' })
  @IsString()
  periodType: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  gradingScale: number;

  @ApiProperty({ type: [SubjectInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectInputDto)
  subjects: SubjectInputDto[];

  @ApiProperty({ type: [FeeItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeItemInputDto)
  feeItems: FeeItemInputDto[];

  @ApiProperty({ example: 3 })
  @IsNumber()
  paymentInstallments: number;

  @ApiProperty({ example: '#1B4D3E' })
  @IsString()
  primaryColor: string;

  @ApiProperty({ example: 'FASO_DAN_FANI' })
  @IsString()
  watermarkPattern: string;
}
