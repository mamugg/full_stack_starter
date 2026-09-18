import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { ErrorAlert } from '../../../../shared/ui/error-alert/error-alert';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { ExternalPost } from '../../data-access/models/post.model';

/**
 * Public endpoint (`GET /api/external/posts`) fetched with `httpResource`:
 * the request re-fires automatically whenever `authorFilter` changes,
 * no manual subscribe/unsubscribe needed.
 */
@Component({
  selector: 'app-post-list-page',
  imports: [RouterLink, LoadingSpinner, ErrorAlert, HlmCardImports, HlmInput],
  templateUrl: './post-list-page.html',
})
export class PostListPage {
  private readonly baseUrl = inject(API_BASE_URL);

  readonly authorFilter = signal<number | null>(null);
  readonly authors = Array.from({ length: 10 }, (_, index) => index + 1);

  readonly posts = httpResource<ExternalPost[]>(
    () => {
      const userId = this.authorFilter();
      return userId ? `${this.baseUrl}/external/posts?userId=${userId}` : `${this.baseUrl}/external/posts`;
    },
    { defaultValue: [] },
  );

  // Search is applied client-side, on top of whatever `posts` currently holds:
  // JSONPlaceholder has no free-text search endpoint to call instead.
  readonly searchQuery = signal('');

  readonly filteredPosts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return query ? this.posts.value().filter((post) => post.title.toLowerCase().includes(query)) : this.posts.value();
  });

  onFilterChange(value: string): void {
    this.authorFilter.set(value ? Number(value) : null);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }
}
