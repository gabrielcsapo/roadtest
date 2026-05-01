export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

/** Fetch a single user by ID. */
export async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch user ${id}: ${res.status}`);
  return res.json() as Promise<User>;
}

/** Fetch posts for a given user. */
export async function fetchUserPosts(userId: number): Promise<Post[]> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch posts for user ${userId}: ${res.status}`);
  return res.json() as Promise<Post[]>;
}

/** Fetch a user and their posts together. */
export async function fetchUserWithPosts(id: number): Promise<{ user: User; posts: Post[] }> {
  const [user, posts] = await Promise.all([fetchUser(id), fetchUserPosts(id)]);
  return { user, posts };
}
