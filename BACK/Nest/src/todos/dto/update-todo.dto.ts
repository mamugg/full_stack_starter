import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateTodoDto {
  @ApiProperty({ example: 'Ecrire la documentation' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  title!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isDone!: boolean;
}
