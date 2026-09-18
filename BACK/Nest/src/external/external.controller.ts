import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ExternalPost, PostWithComments } from './dto/external-post.dto';
import { ExternalService } from './external.service';

/**
 * Exemple de routes qui appellent une API publique tierce (JSONPlaceholder,
 * https://jsonplaceholder.typicode.com) via ExternalService (HttpModule
 * typé + retries). Montre comment agréger/relayer des données externes
 * depuis notre propre API.
 */
@ApiTags('external')
@Controller('external')
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  /** Liste des posts de l'API publique, avec filtre optionnel par userId. */
  @Public()
  @Get('posts')
  @ApiOperation({ summary: 'Liste des posts (proxy JSONPlaceholder)' })
  getPosts(@Query('userId') userId?: string): Promise<ExternalPost[]> {
    const parsedUserId = userId !== undefined ? Number(userId) : undefined;
    return this.externalService.getPosts(parsedUserId);
  }

  /** Detail d'un post de l'API publique. */
  @Public()
  @Get('posts/:id')
  @ApiOperation({ summary: "Detail d'un post (proxy JSONPlaceholder)" })
  @ApiResponse({ status: 404, description: 'Non trouve' })
  async getPost(@Param('id', ParseIntPipe) id: number): Promise<ExternalPost> {
    const post = await this.externalService.getPost(id);
    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }

  /**
   * Route protegee qui combine deux appels externes (post + commentaires).
   * Necessite un token JWT : montre comment mixer authentification et appels sortants.
   */
  @Get('posts/:id/with-comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post + commentaires (proxy JSONPlaceholder, protege)' })
  @ApiResponse({ status: 401, description: 'Non authentifie' })
  @ApiResponse({ status: 404, description: 'Non trouve' })
  async getPostWithComments(@Param('id', ParseIntPipe) id: number): Promise<PostWithComments> {
    const post = await this.externalService.getPost(id);
    if (!post) {
      throw new NotFoundException();
    }

    const comments = await this.externalService.getCommentsForPost(id);
    return { post, comments };
  }
}
