import { httpResource } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { ErrorAlert } from '../../../../shared/ui/error-alert/error-alert';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { PostWithComments } from '../../data-access/models/post.model';

/**
 * `id` is bound directly from the `:id` route segment via the router's
 * component-input-binding feature (see `withComponentInputBinding()` in
 * `app.config.ts`) — no `ActivatedRoute` boilerplate needed.
 *
 * Calls the **protected** `with-comments` endpoint: the auth interceptor
 * attaches the JWT transparently, same as any other `HttpClient` request.
 */
@Component({
  selector: 'app-post-detail-page',
  imports: [RouterLink, LoadingSpinner, ErrorAlert, HlmCardImports],
  templateUrl: './post-detail-page.html',
})
export class PostDetailPage {
  private readonly baseUrl = inject(API_BASE_URL);

  readonly id = input.required<string>();

  readonly postWithComments = httpResource<PostWithComments>(
    () => `${this.baseUrl}/external/posts/${this.id()}/with-comments`,
  );
}
