/** Mirrors the `External*` records proxied from JSONPlaceholder by `ExternalController`. */
export interface ExternalPost {
  readonly userId: number;
  readonly id: number;
  readonly title: string;
  readonly body: string;
}

export interface ExternalComment {
  readonly postId: number;
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly body: string;
}

export interface PostWithComments {
  readonly post: ExternalPost;
  readonly comments: readonly ExternalComment[];
}
