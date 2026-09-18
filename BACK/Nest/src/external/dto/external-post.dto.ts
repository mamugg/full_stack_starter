export class ExternalPost {
  userId!: number;
  id!: number;
  title!: string;
  body!: string;
}

export class ExternalComment {
  postId!: number;
  id!: number;
  name!: string;
  email!: string;
  body!: string;
}

export class PostWithComments {
  post!: ExternalPost;
  comments!: ExternalComment[];
}
