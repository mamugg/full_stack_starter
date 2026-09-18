import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { PostWithComments } from '../../data-access/models/post.model';
import { PostDetailPage } from './post-detail-page';

const BASE_URL = 'https://api.test/api';

const data: PostWithComments = {
  post: { userId: 1, id: 1, title: 'Premier post', body: 'Contenu du post' },
  comments: [{ postId: 1, id: 1, name: 'Ada', email: 'ada@example.com', body: 'Bravo !' }],
};

async function createFixture(id = '1') {
  TestBed.configureTestingModule({
    imports: [PostDetailPage],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', children: [] }]), { provide: API_BASE_URL, useValue: BASE_URL }],
  });

  const fixture = TestBed.createComponent(PostDetailPage);
  fixture.componentRef.setInput('id', id);
  fixture.detectChanges();

  return { fixture, httpMock: TestBed.inject(HttpTestingController) };
}

describe('PostDetailPage', () => {
  it('shows the post and its comments once loaded', async () => {
    const { fixture, httpMock } = await createFixture();

    httpMock.expectOne(`${BASE_URL}/external/posts/1/with-comments`).flush(data);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Premier post');
    expect(fixture.nativeElement.textContent).toContain('Ada');

    httpMock.verify();
  });

  it('shows an error message when the request fails (e.g. not authenticated)', async () => {
    const { fixture, httpMock } = await createFixture();

    httpMock.expectOne(`${BASE_URL}/external/posts/1/with-comments`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();

    httpMock.verify();
  });
});
