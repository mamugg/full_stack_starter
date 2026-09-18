import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { ExternalPost } from '../../data-access/models/post.model';
import { PostListPage } from './post-list-page';

const BASE_URL = 'https://api.test/api';

const posts: ExternalPost[] = [
  { userId: 1, id: 1, title: 'Premier post', body: 'Contenu' },
  { userId: 2, id: 2, title: 'Second post', body: 'Contenu' },
];

async function createFixture() {
  TestBed.configureTestingModule({
    imports: [PostListPage],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', children: [] }]), { provide: API_BASE_URL, useValue: BASE_URL }],
  });

  const fixture = TestBed.createComponent(PostListPage);
  fixture.detectChanges();

  return { fixture, httpMock: TestBed.inject(HttpTestingController) };
}

describe('PostListPage', () => {
  it('loads all posts by default', async () => {
    const { fixture, httpMock } = await createFixture();

    httpMock.expectOne(`${BASE_URL}/external/posts`).flush(posts);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Premier post');
    expect(fixture.nativeElement.textContent).toContain('Second post');

    httpMock.verify();
  });

  it('re-fetches filtered by author when the filter changes', async () => {
    const { fixture, httpMock } = await createFixture();
    httpMock.expectOne(`${BASE_URL}/external/posts`).flush(posts);
    await fixture.whenStable();

    fixture.componentInstance.onFilterChange('1');
    fixture.detectChanges();

    httpMock.expectOne(`${BASE_URL}/external/posts?userId=1`).flush([posts[0]]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Premier post');
    expect(fixture.nativeElement.textContent).not.toContain('Second post');

    httpMock.verify();
  });

  it('filters the already-loaded posts by title as the search query changes', async () => {
    const { fixture, httpMock } = await createFixture();
    httpMock.expectOne(`${BASE_URL}/external/posts`).flush(posts);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.onSearchChange('second');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Second post');
    expect(fixture.nativeElement.textContent).not.toContain('Premier post');

    // Search is client-side only — verify() below fails if it triggered any extra HTTP call.
    httpMock.verify();
  });

  it('shows an empty state when the search matches nothing', async () => {
    const { fixture, httpMock } = await createFixture();
    httpMock.expectOne(`${BASE_URL}/external/posts`).flush(posts);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.onSearchChange('inexistant');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucun article ne correspond');

    httpMock.verify();
  });
});
