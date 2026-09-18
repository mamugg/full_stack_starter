import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({ example: 'Ecrire la documentation' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  title!: string;
}
