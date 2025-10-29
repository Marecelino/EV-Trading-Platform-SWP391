import { IsBoolean } from 'class-validator';

export class ToggleVisibilityDto {
  @IsBoolean()
  is_visible: boolean;
}
