import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './entities/todo.entity';
import { TodosService } from './todos.service';

/**
 * CRUD classique sur une ressource en memoire. Toutes les routes exigent un
 * token JWT valide (proteges par le JwtAuthGuard global, voir AuthModule) —
 * pas de @Public() ici. Chemin "todoitems" pour rester compatible avec le
 * front Angular du starter (voir TodoStore, qui appelle `${baseUrl}/todoitems`).
 */
@ApiTags('todoitems')
@ApiBearerAuth()
@Controller('todoitems')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des taches' })
  findAll(): Todo[] {
    return this.todosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: "Detail d'une tache" })
  @ApiResponse({ status: 404, description: 'Non trouvee' })
  findOne(@Param('id', ParseIntPipe) id: number): Todo {
    const todo = this.todosService.findOne(id);
    if (!todo) {
      throw new NotFoundException();
    }
    return todo;
  }

  @Post()
  @ApiOperation({ summary: 'Creation' })
  @ApiResponse({ status: 201, type: Todo })
  create(@Body() dto: CreateTodoDto): Todo {
    return this.todosService.create(dto.title);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mise a jour' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Non trouvee' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTodoDto): void {
    const updated = this.todosService.update(id, dto.title, dto.isDone);
    if (!updated) {
      throw new NotFoundException();
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Suppression' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Non trouvee' })
  remove(@Param('id', ParseIntPipe) id: number): void {
    const removed = this.todosService.remove(id);
    if (!removed) {
      throw new NotFoundException();
    }
  }
}
