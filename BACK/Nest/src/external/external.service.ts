import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom, throwError, timer } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { ExternalComment, ExternalPost } from './dto/external-post.dto';

const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;

/** Retries network errors and 5xx only — a 4xx (e.g. 404) is a real answer, not a transient failure. */
function retryTransientErrors<T>() {
  return retry<T>({
    count: RETRY_ATTEMPTS,
    delay: (error: unknown, retryCount: number) => {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      if (status !== undefined && status < 500) {
        return throwError(() => error);
      }
      return timer(RETRY_DELAY_MS * retryCount);
    },
  });
}

/**
 * Typed client for the free public API https://jsonplaceholder.typicode.com
 * (no API key required). Registered via HttpModule.registerAsync in
 * ExternalModule, which sets the base URL from config. Retries transient
 * failures (network errors, 5xx) with a short backoff so a slow/flaky third
 * party doesn't take our own routes down with it — the Node equivalent of
 * the .NET client's AddStandardResilienceHandler().
 */
@Injectable()
export class ExternalService {
  constructor(private readonly httpService: HttpService) {}

  async getPosts(userId?: number): Promise<ExternalPost[]> {
    const { data } = await firstValueFrom(
      this.httpService
        .get<ExternalPost[]>('posts', { params: userId ? { userId } : undefined })
        .pipe(timeout(REQUEST_TIMEOUT_MS), retryTransientErrors()),
    );
    return data;
  }

  async getPost(id: number): Promise<ExternalPost | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<ExternalPost>(`posts/${id}`)
          .pipe(timeout(REQUEST_TIMEOUT_MS), retryTransientErrors()),
      );
      return data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCommentsForPost(postId: number): Promise<ExternalComment[]> {
    const { data } = await firstValueFrom(
      this.httpService
        .get<ExternalComment[]>(`posts/${postId}/comments`)
        .pipe(timeout(REQUEST_TIMEOUT_MS), retryTransientErrors()),
    );
    return data;
  }
}
