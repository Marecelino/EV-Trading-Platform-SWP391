import { IsOptional, IsString } from 'class-validator';
import { FilterListingsDto } from './filter-listings.dto';

export class SearchListingsDto extends FilterListingsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  q?: string;
}
