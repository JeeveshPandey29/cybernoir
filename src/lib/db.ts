import GithubSlugger from "github-slugger";
import { createSupabaseAdminClient } from "@/lib/supabase";

type UserRow = {
  id: string;
  email: string;
  username: string;
  password: string | null;
  avatar: string | null;
  role: string;
  bio: string;
  website_url: string | null;
  x_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
};

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string;
  cover_image: string | null;
  published: boolean;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  blog_id: string;
  parent_comment_id: string | null;
};

type CommentMetricRow = {
  comment_id: string;
  likes_count?: number | null;
  reports_count?: number | null;
};

type CountRow = {
  user_id?: string;
  blog_id?: string;
  comments_count?: number | null;
  likes_count?: number | null;
  bookmarks_count?: number | null;
};

type AuthorProfile = {
  username: string;
  role: string;
  avatar: string | null;
  bio: string;
  websiteUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
};

type PublicBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  published: boolean;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  _count: {
    comments: number;
    likes: number;
    bookmarks: number;
  };
  author?: AuthorProfile;
};

type PublicComment = {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  canEdit?: boolean;
  likesCount: number;
  reportsCount: number;
  liked: boolean;
  reported: boolean;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

type AuditLogRow = {
  id: string;
  action: string;
  status: string;
  actor_user_id: string | null;
  actor_email: string | null;
  ip_address: string | null;
  route: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type NewsletterSubscriptionRow = {
  id: string;
  email: string;
  active: boolean;
  created_at: string;
};

const DEFAULT_AUTHOR: AuthorProfile = {
  username: "Jeevesh Pandey",
  role: "AUTHOR",
  avatar: "/images/jeevesh-pandey.svg",
  bio: "Cybersecurity researcher, builder, and curator of practical cloud and offensive security write-ups.",
  websiteUrl: null,
  xUrl: null,
  linkedinUrl: null,
};

function unwrapSingle<T>(data: T | null, error: { message: string } | null | undefined) {
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function estimateReadingMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function isBlogLive(blog: Pick<BlogRow, "published" | "scheduled_for">) {
  return Boolean(blog.published || (blog.scheduled_for && new Date(blog.scheduled_for).getTime() <= Date.now()));
}

function getBlogLiveDate(blog: Pick<BlogRow, "published_at" | "scheduled_for" | "created_at">) {
  return blog.published_at ?? blog.scheduled_for ?? blog.created_at;
}

function isMissingSchemaFeature(error: { message?: string; code?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  const message = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    message.includes("column") ||
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("view")
  );
}

async function notifyUsersOfPublishedBlog(blog: Pick<BlogRow, "title" | "slug">) {
  const supabase = createSupabaseAdminClient();
  const usersResult = await supabase.from("users").select("id");

  if (usersResult.error) {
    throw new Error("Failed to load users for notifications.");
  }

  const users = usersResult.data ?? [];
  if (users.length === 0) {
    return;
  }

  const existingResult = await supabase
    .from("notifications")
    .select("user_id")
    .eq("type", "NEW_POST")
    .eq("link", `/blogs/${blog.slug}`);

  if (existingResult.error) {
    if (isMissingSchemaFeature(existingResult.error)) {
      return;
    }
    throw new Error("Failed to inspect existing notifications.");
  }

  const existingUserIds = new Set((existingResult.data ?? []).map((item) => item.user_id as string));
  const payload = users
    .filter((user) => !existingUserIds.has(user.id as string))
    .map((user) => ({
      user_id: user.id,
      type: "NEW_POST",
      title: "New post published",
      body: `${blog.title} is now live to read.`,
      link: `/blogs/${blog.slug}`,
    }));

  if (payload.length === 0) {
    return;
  }

  const insertResult = await supabase.from("notifications").insert(payload);
  if (insertResult.error && !isMissingSchemaFeature(insertResult.error)) {
    throw new Error(insertResult.error.message);
  }
}

async function syncScheduledBlogs() {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const dueResult = await supabase
    .from("blogs")
    .select("id, title, slug, scheduled_for")
    .eq("published", false)
    .not("scheduled_for", "is", null)
    .lte("scheduled_for", now);

  if (dueResult.error) {
    if (isMissingSchemaFeature(dueResult.error)) {
      return;
    }
    throw new Error(`Failed to sync scheduled blogs: ${dueResult.error.message}`);
  }

  for (const blog of dueResult.data ?? []) {
    const updateResult = await supabase
      .from("blogs")
      .update({ published: true, published_at: blog.scheduled_for ?? now })
      .eq("id", blog.id);

    if (updateResult.error) {
      if (isMissingSchemaFeature(updateResult.error)) {
        return;
      }
      throw new Error(updateResult.error.message);
    }

    await notifyUsersOfPublishedBlog({ title: blog.title, slug: blog.slug });
  }
}

function toUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    password: user.password,
    avatar: user.avatar,
    role: user.role,
    bio: user.bio,
    websiteUrl: user.website_url,
    xUrl: user.x_url,
    linkedinUrl: user.linkedin_url,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function toBlog(blog: BlogRow) {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    excerpt: blog.excerpt,
    tags: blog.tags,
    coverImage: blog.cover_image,
    published: blog.published,
    scheduledFor: blog.scheduled_for,
    publishedAt: blog.published_at,
    createdAt: blog.created_at,
    updatedAt: blog.updated_at,
  };
}

function toPublicBlog(blog: BlogRow, counts?: CountRow | null): PublicBlog {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    coverImage: blog.cover_image,
    tags: parseTags(blog.tags),
    published: blog.published,
    scheduledFor: blog.scheduled_for,
    publishedAt: blog.published_at,
    createdAt: blog.created_at,
    updatedAt: blog.updated_at,
    readingTimeMinutes: estimateReadingMinutes(blog.content),
    _count: {
      comments: counts?.comments_count ?? 0,
      likes: counts?.likes_count ?? 0,
      bookmarks: counts?.bookmarks_count ?? 0,
    },
  };
}

export async function getDefaultAuthor() {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("users")
    .select("username, role, avatar, bio, website_url, x_url, linkedin_url")
    .eq("role", "ADMIN")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{
      username: string;
      role: string;
      avatar: string | null;
      bio: string;
      website_url: string | null;
      x_url: string | null;
      linkedin_url: string | null;
    }>();

  if (result.error || !result.data) {
    return DEFAULT_AUTHOR;
  }

  return {
    username:
      !result.data.username || result.data.username === "CYBERNOIR Editorial"
        ? DEFAULT_AUTHOR.username
        : result.data.username,
    role: result.data.role || DEFAULT_AUTHOR.role,
    avatar: result.data.avatar || DEFAULT_AUTHOR.avatar,
    bio: result.data.bio || DEFAULT_AUTHOR.bio,
    websiteUrl: result.data.website_url || DEFAULT_AUTHOR.websiteUrl,
    xUrl: result.data.x_url || DEFAULT_AUTHOR.xUrl,
    linkedinUrl: result.data.linkedin_url || DEFAULT_AUTHOR.linkedinUrl,
  };
}

export async function getAuthorProfileByUsername(username: string) {
  const supabase = createSupabaseAdminClient();
  const normalized = decodeURIComponent(username).trim();

  if (!normalized) {
    return null;
  }

  const result = await supabase
    .from("users")
    .select("username, role, avatar, bio, website_url, x_url, linkedin_url")
    .eq("username", normalized)
    .maybeSingle<{
      username: string;
      role: string;
      avatar: string | null;
      bio: string;
      website_url: string | null;
      x_url: string | null;
      linkedin_url: string | null;
    }>();

  if (result.error) {
    if (isMissingSchemaFeature(result.error)) {
      const fallback = await getDefaultAuthor();
      return fallback.username === normalized ? fallback : null;
    }
    throw new Error("Failed to load author profile.");
  }

  if (!result.data) {
    const fallback = await getDefaultAuthor();
    return fallback.username === normalized ? fallback : null;
  }

  return {
    username:
      !result.data.username || result.data.username === "CYBERNOIR Editorial"
        ? DEFAULT_AUTHOR.username
        : result.data.username,
    role: result.data.role || DEFAULT_AUTHOR.role,
    avatar: result.data.avatar || DEFAULT_AUTHOR.avatar,
    bio: result.data.bio || DEFAULT_AUTHOR.bio,
    websiteUrl: result.data.website_url || DEFAULT_AUTHOR.websiteUrl,
    xUrl: result.data.x_url || DEFAULT_AUTHOR.xUrl,
    linkedinUrl: result.data.linkedin_url || DEFAULT_AUTHOR.linkedinUrl,
  };
}

function toCountMap(rows: CountRow[], key: "user_id" | "blog_id") {
  return new Map(
    rows.map((row) => [
      row[key] as string,
      {
        comments: row.comments_count ?? 0,
        likes: row.likes_count ?? 0,
        bookmarks: row.bookmarks_count ?? 0,
      },
    ])
  );
}

async function fetchBlogMetricsRows(blogId?: string) {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("blog_metrics").select("*");

  if (blogId) {
    query = query.eq("blog_id", blogId);
  }

  const result = await query;

  if (result.error) {
    if (isMissingSchemaFeature(result.error)) {
      return [] as CountRow[];
    }
    throw new Error("Failed to load blog metrics.");
  }

  return (result.data as CountRow[] | null) ?? [];
}

async function getUsersByIds(userIds: string[]) {
  const supabase = createSupabaseAdminClient();

  if (userIds.length === 0) {
    return new Map<string, UserRow>();
  }

  const usersResult = await supabase
    .from("users")
    .select("id, username, email, avatar, role, created_at, updated_at, password")
    .in("id", userIds);

  if (usersResult.error) {
    throw new Error("Failed to load users.");
  }

  return new Map((usersResult.data ?? []).map((user) => [user.id, user as UserRow]));
}

async function getCommentMetricsMap(commentIds: string[]) {
  const supabase = createSupabaseAdminClient();

  if (commentIds.length === 0) {
    return new Map<string, CommentMetricRow>();
  }

  const result = await supabase.from("comment_metrics").select("*").in("comment_id", commentIds);

  if (result.error) {
    if (isMissingSchemaFeature(result.error)) {
      return new Map<string, CommentMetricRow>();
    }
    throw new Error("Failed to load comment metrics.");
  }

  return new Map(((result.data as CommentMetricRow[] | null) ?? []).map((row) => [row.comment_id, row]));
}

async function fetchCommentsWithSchemaFallback(
  filter?: { blogId?: string }
): Promise<CommentRow[]> {
  const supabase = createSupabaseAdminClient();

  let baseQuery = supabase
    .from("comments")
    .select("id, content, created_at, user_id, blog_id, parent_comment_id");

  if (filter?.blogId) {
    baseQuery = baseQuery.eq("blog_id", filter.blogId);
  }

  const primaryResult = await baseQuery.order("created_at", { ascending: true });

  if (!primaryResult.error) {
    return (primaryResult.data as CommentRow[] | null) ?? [];
  }

  if (!isMissingSchemaFeature(primaryResult.error)) {
    throw new Error("Failed to load comments.");
  }

  let fallbackQuery = supabase
    .from("comments")
    .select("id, content, created_at, user_id, blog_id");

  if (filter?.blogId) {
    fallbackQuery = fallbackQuery.eq("blog_id", filter.blogId);
  }

  const fallbackResult = await fallbackQuery.order("created_at", { ascending: true });

  if (fallbackResult.error) {
    throw new Error("Failed to load comments.");
  }

  return (((fallbackResult.data as Omit<CommentRow, "parent_comment_id">[] | null) ?? []).map((comment) => ({
    ...comment,
    parent_comment_id: null,
  })));
}

async function fetchSingleCommentWithSchemaFallback(commentId: string) {
  const supabase = createSupabaseAdminClient();

  const primaryResult = await supabase
    .from("comments")
    .select("id, user_id, parent_comment_id")
    .eq("id", commentId)
    .maybeSingle<{ id: string; user_id: string; parent_comment_id: string | null }>();

  if (!primaryResult.error) {
    return primaryResult.data;
  }

  if (!isMissingSchemaFeature(primaryResult.error)) {
    throw new Error(primaryResult.error.message);
  }

  const fallbackResult = await supabase
    .from("comments")
    .select("id, user_id")
    .eq("id", commentId)
    .maybeSingle<{ id: string; user_id: string }>();

  if (fallbackResult.error) {
    throw new Error(fallbackResult.error.message);
  }

  return fallbackResult.data
    ? { ...fallbackResult.data, parent_comment_id: null }
    : null;
}

async function insertCommentWithSchemaFallback(
  blogId: string,
  userId: string,
  content: string,
  parentCommentId?: string | null
) {
  const supabase = createSupabaseAdminClient();

  const primaryResult = await supabase
    .from("comments")
    .insert({ blog_id: blogId, user_id: userId, content, parent_comment_id: parentCommentId ?? null })
    .select("id, content, created_at, user_id, blog_id, parent_comment_id")
    .single<CommentRow>();

  if (!primaryResult.error) {
    return primaryResult.data;
  }

  if (!isMissingSchemaFeature(primaryResult.error)) {
    throw new Error(primaryResult.error.message);
  }

  if (parentCommentId) {
    throw new Error("Reply support is not enabled yet. Run the latest Supabase schema.sql update first.");
  }

  const fallbackResult = await supabase
    .from("comments")
    .insert({ blog_id: blogId, user_id: userId, content })
    .select("id, content, created_at, user_id, blog_id")
    .single<Omit<CommentRow, "parent_comment_id">>();

  if (fallbackResult.error) {
    throw new Error(fallbackResult.error.message);
  }

  return fallbackResult.data
    ? { ...fallbackResult.data, parent_comment_id: null }
    : null;
}

async function updateCommentWithSchemaFallback(commentId: string, content: string) {
  const supabase = createSupabaseAdminClient();

  const primaryResult = await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId)
    .select("id, content, created_at, user_id, blog_id, parent_comment_id")
    .single<CommentRow>();

  if (!primaryResult.error) {
    return primaryResult.data;
  }

  if (!isMissingSchemaFeature(primaryResult.error)) {
    throw new Error(primaryResult.error.message);
  }

  const fallbackResult = await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId)
    .select("id, content, created_at, user_id, blog_id")
    .single<Omit<CommentRow, "parent_comment_id">>();

  if (fallbackResult.error) {
    throw new Error(fallbackResult.error.message);
  }

  return fallbackResult.data
    ? { ...fallbackResult.data, parent_comment_id: null }
    : null;
}

async function getCommentStateMaps(commentIds: string[], userId?: string) {
  const supabase = createSupabaseAdminClient();

  if (!userId || commentIds.length === 0) {
    return { likedIds: new Set<string>(), reportedIds: new Set<string>() };
  }

  const [likesResult, reportsResult] = await Promise.all([
    supabase.from("comment_likes").select("comment_id").eq("user_id", userId).in("comment_id", commentIds),
    supabase.from("comment_reports").select("comment_id").eq("user_id", userId).eq("status", "OPEN").in("comment_id", commentIds),
  ]);

  if (likesResult.error || reportsResult.error) {
    if (isMissingSchemaFeature(likesResult.error) || isMissingSchemaFeature(reportsResult.error)) {
      return { likedIds: new Set<string>(), reportedIds: new Set<string>() };
    }
    throw new Error("Failed to load comment state.");
  }

  return {
    likedIds: new Set((likesResult.data ?? []).map((row) => row.comment_id as string)),
    reportedIds: new Set((reportsResult.data ?? []).map((row) => row.comment_id as string)),
  };
}

export async function getUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle<UserRow>();

  const user = unwrapSingle(result.data, result.error);
  return user ? toUser(user) : null;
}

export async function getUserByUsername(username: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle<UserRow>();

  const user = unwrapSingle(result.data, result.error);
  return user ? toUser(user) : null;
}

export async function getUserById(id: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from("users").select("*").eq("id", id).maybeSingle<UserRow>();
  const user = unwrapSingle(result.data, result.error);
  return user ? toUser(user) : null;
}

export async function getAdminAuthorUser() {
  const supabase = createSupabaseAdminClient();
  const adminEmail = process.env.ADMIN_EMAIL?.trim();

  if (adminEmail) {
    const byEmail = await supabase
      .from("users")
      .select("*")
      .eq("email", adminEmail)
      .maybeSingle<UserRow>();

    const matched = unwrapSingle(byEmail.data, byEmail.error);
    if (matched) {
      return toUser(matched);
    }
  }

  const fallback = await supabase
    .from("users")
    .select("*")
    .eq("role", "ADMIN")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<UserRow>();

  const user = unwrapSingle(fallback.data, fallback.error);
  return user ? toUser(user) : null;
}

export async function ensureAdminAuthorUser() {
  const supabase = createSupabaseAdminClient();
  const existing = await getAdminAuthorUser();

  if (existing) {
    return existing;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim() || "author@cybernoir.local";
  const adminUsernameBase = process.env.ADMIN_AUTHOR_NAME?.trim() || "Jeevesh Pandey";

  const existingByEmail = await supabase
    .from("users")
    .select("*")
    .eq("email", adminEmail)
    .maybeSingle<UserRow>();

  const matchedByEmail = unwrapSingle(existingByEmail.data, existingByEmail.error);
  if (matchedByEmail) {
    if (matchedByEmail.role !== "ADMIN") {
      const promoted = await supabase
        .from("users")
        .update({ role: "ADMIN" })
        .eq("id", matchedByEmail.id)
        .select("*")
        .single<UserRow>();

      const user = unwrapSingle(promoted.data, promoted.error);
      if (!user) {
        throw new Error("Failed to promote admin author.");
      }
      return toUser(user);
    }

    return toUser(matchedByEmail);
  }

  let adminUsername = adminUsernameBase;
  let suffix = 1;
  while (await getUserByUsername(adminUsername)) {
    suffix += 1;
    adminUsername = `${adminUsernameBase}${suffix}`;
  }

  return createUser({
    email: adminEmail,
    username: adminUsername,
    avatar: null,
    role: "ADMIN",
  });
}

export async function createUser(input: {
  email: string;
  username: string;
  password?: string | null;
  avatar?: string | null;
  role: string;
}) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("users")
    .insert({
      email: input.email,
      username: input.username,
      password: input.password ?? null,
      avatar: input.avatar ?? null,
      role: input.role,
    })
    .select("*")
    .single<UserRow>();

  const user = unwrapSingle(result.data, result.error);
  if (!user) {
    throw new Error("Failed to create user.");
  }

  return toUser(user);
}

export async function getDashboardStats() {
  const supabase = createSupabaseAdminClient();

  const [
    totalUsersResult,
    totalBlogsResult,
    totalCommentsResult,
    totalLikesResult,
    totalBookmarksResult,
    recentUsersResult,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("blogs").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase.from("likes").select("*", { count: "exact", head: true }),
    supabase.from("bookmarks").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id, username, email, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (
    totalUsersResult.error ||
    totalBlogsResult.error ||
    totalCommentsResult.error ||
    totalLikesResult.error ||
    totalBookmarksResult.error ||
    recentUsersResult.error
  ) {
    throw new Error("Failed to load dashboard stats.");
  }

  return {
    totalUsers: totalUsersResult.count ?? 0,
    totalBlogs: totalBlogsResult.count ?? 0,
    totalComments: totalCommentsResult.count ?? 0,
    totalLikes: totalLikesResult.count ?? 0,
    totalBookmarks: totalBookmarksResult.count ?? 0,
    recentUsers: (recentUsersResult.data ?? []).map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.created_at,
    })),
  };
}

export async function getAuditLogs(limit = 100) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("audit_logs")
    .select("id, action, status, actor_user_id, actor_email, ip_address, route, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    if (isMissingSchemaFeature(result.error)) {
      return [];
    }
    throw new Error("Failed to load audit logs.");
  }

  return ((result.data as AuditLogRow[] | null) ?? []).map((log) => ({
    id: log.id,
    action: log.action,
    status: log.status,
    actorUserId: log.actor_user_id,
    actorEmail: log.actor_email,
    ipAddress: log.ip_address,
    route: log.route,
    metadata: log.metadata ?? {},
    createdAt: log.created_at,
  }));
}

export async function getNewsletterSubscribers() {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("newsletter_subscriptions")
    .select("id, email, active, created_at")
    .order("created_at", { ascending: false });

  if (result.error) {
    if (isMissingSchemaFeature(result.error)) {
      return [];
    }
    throw new Error("Failed to load newsletter subscribers.");
  }

  return ((result.data as NewsletterSubscriptionRow[] | null) ?? []).map((item) => ({
    id: item.id,
    email: item.email,
    active: item.active,
    createdAt: item.created_at,
  }));
}

export async function updateNewsletterSubscriptionStatus(id: string, active: boolean) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("newsletter_subscriptions")
    .update({ active })
    .eq("id", id)
    .select("id, email, active, created_at")
    .maybeSingle<NewsletterSubscriptionRow>();

  const subscription = unwrapSingle(result.data, result.error);
  if (!subscription) {
    throw new Error("Subscriber not found.");
  }

  return {
    id: subscription.id,
    email: subscription.email,
    active: subscription.active,
    createdAt: subscription.created_at,
  };
}

export async function getHomepageStats() {
  const supabase = createSupabaseAdminClient();

  const [blogsResult, usersResult, commentsResult] = await Promise.all([
    supabase.from("blogs").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
  ]);

  if (blogsResult.error || usersResult.error || commentsResult.error) {
    throw new Error("Failed to load homepage stats.");
  }

  return {
    publishedBlogs: blogsResult.count ?? 0,
    users: usersResult.count ?? 0,
    comments: commentsResult.count ?? 0,
  };
}

export async function getUsersWithCounts() {
  const supabase = createSupabaseAdminClient();

  const [usersResult, countsResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, username, avatar, role, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_metrics").select("*"),
  ]);

  if (usersResult.error || countsResult.error) {
    throw new Error("Failed to load users.");
  }

  const countMap = toCountMap((countsResult.data as CountRow[] | null) ?? [], "user_id");

  return (usersResult.data ?? []).map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    role: user.role,
    createdAt: user.created_at,
    _count: countMap.get(user.id) ?? { comments: 0, likes: 0, bookmarks: 0 },
  }));
}

export async function getBlogsWithCounts() {
  const supabase = createSupabaseAdminClient();

  const [blogsResult, countsResult] = await Promise.all([
    supabase
      .from("blogs")
      .select("id, title, slug, excerpt, tags, published, created_at")
      .order("created_at", { ascending: false }),
    fetchBlogMetricsRows(),
  ]);

  if (blogsResult.error) {
    throw new Error("Failed to load blogs.");
  }

  const countMap = toCountMap(countsResult, "blog_id");

  return (blogsResult.data ?? []).map((blog) => ({
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    tags: blog.tags,
    published: blog.published,
    createdAt: blog.created_at,
    _count: countMap.get(blog.id) ?? { comments: 0, likes: 0, bookmarks: 0 },
  }));
}

export async function getPublishedBlogs() {
  await syncScheduledBlogs();
  const supabase = createSupabaseAdminClient();
  const author = await getDefaultAuthor();

  const [blogsResult, countsResult] = await Promise.all([
    supabase.from("blogs").select("*").order("created_at", { ascending: false }),
    fetchBlogMetricsRows(),
  ]);

  if (blogsResult.error) {
    throw new Error("Failed to load published blogs.");
  }

  const countMap = new Map(countsResult.map((row) => [row.blog_id as string, row]));

  return ((blogsResult.data as BlogRow[] | null) ?? [])
    .filter((blog) => isBlogLive(blog))
    .sort((a, b) => new Date(getBlogLiveDate(b)).getTime() - new Date(getBlogLiveDate(a)).getTime())
    .map((blog) => ({
      ...toPublicBlog(blog, countMap.get(blog.id) ?? null),
      author,
    }));
}

export async function getPublishedBlogBySlug(slug: string, currentUserId?: string) {
  await syncScheduledBlogs();
  const supabase = createSupabaseAdminClient();
  const author = await getDefaultAuthor();

  const [blogResult, comments, metricsRows] = await Promise.all([
    supabase.from("blogs").select("*").eq("slug", slug).maybeSingle<BlogRow>(),
    fetchCommentsWithSchemaFallback(),
    fetchBlogMetricsRows(),
  ]);

  const blog = unwrapSingle(blogResult.data, blogResult.error);
  if (!blog || !isBlogLive(blog)) {
    return null;
  }

  const blogComments = comments.filter((comment) => comment.blog_id === blog.id);
  const counts = metricsRows.find((row) => row.blog_id === blog.id);
  const usersById = await getUsersByIds([...new Set(blogComments.map((comment) => comment.user_id))]);
  const metricsByComment = await getCommentMetricsMap(blogComments.map((comment) => comment.id));
  const stateMaps = await getCommentStateMaps(blogComments.map((comment) => comment.id), currentUserId);

  return {
    blog: {
      ...toPublicBlog(blog, counts ?? null),
      author,
    },
    comments: blogComments.map((comment) => {
      const user = usersById.get(comment.user_id);
      const metric = metricsByComment.get(comment.id);

      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        parentId: comment.parent_comment_id,
        canEdit: currentUserId === comment.user_id,
        likesCount: metric?.likes_count ?? 0,
        reportsCount: metric?.reports_count ?? 0,
        liked: stateMaps.likedIds.has(comment.id),
        reported: stateMaps.reportedIds.has(comment.id),
        user: {
          id: comment.user_id,
          username: user?.username ?? "Unknown",
          avatar: user?.avatar ?? null,
        },
      };
    }),
  };
}

export async function getLatestPublishedBlogs(limit = 3) {
  const blogs = await getPublishedBlogs();
  return blogs.slice(0, limit);
}

export async function getRelatedPublishedBlogs(slug: string, tags: string[], limit = 3) {
  const blogs = await getPublishedBlogs();
  return blogs
    .filter((blog) => blog.slug !== slug)
    .map((blog) => ({
      blog,
      score: blog.tags.filter((tag) => tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || new Date(b.blog.createdAt).getTime() - new Date(a.blog.createdAt).getTime())
    .filter((item) => item.score > 0 || tags.length === 0)
    .slice(0, limit)
    .map((item) => item.blog);
}

export async function getBlogCounts(blogId: string) {
  const counts = (await fetchBlogMetricsRows(blogId))[0] ?? null;

  return {
    comments: counts?.comments_count ?? 0,
    likes: counts?.likes_count ?? 0,
    bookmarks: counts?.bookmarks_count ?? 0,
  };
}

async function ensureUniqueSlug(title: string, currentId?: string) {
  const supabase = createSupabaseAdminClient();
  const slugger = new GithubSlugger();
  let slug = slugger.slug(title);

  const existing = await supabase
    .from("blogs")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data && existing.data.id !== currentId) {
    slug = `${slug}-${Date.now()}`;
  }

  return slug;
}

function normalizeSchedule(input?: string | null) {
  if (!input) {
    return null;
  }

  const value = new Date(input);
  if (Number.isNaN(value.getTime())) {
    throw new Error("Invalid scheduled publish time.");
  }

  return value.toISOString();
}

export async function createBlog(input: {
  title: string;
  content: string;
  excerpt: string;
  tags?: string;
  coverImage?: string | null;
  published?: boolean;
  scheduledFor?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const slug = await ensureUniqueSlug(input.title);
  const scheduledFor = normalizeSchedule(input.scheduledFor);
  const shouldPublish = Boolean(input.published) || (scheduledFor ? new Date(scheduledFor).getTime() <= Date.now() : false);

  const result = await supabase
    .from("blogs")
    .insert({
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt,
      tags: input.tags ?? "",
      cover_image: input.coverImage ?? null,
      published: shouldPublish,
      scheduled_for: scheduledFor,
      published_at: shouldPublish ? new Date().toISOString() : null,
    })
    .select("*")
    .single<BlogRow>();

  const blog = unwrapSingle(result.data, result.error);
  if (!blog) {
    throw new Error("Failed to create blog.");
  }

  if (shouldPublish) {
    await notifyUsersOfPublishedBlog(blog);
  }

  return toBlog(blog);
}

export async function getBlogByIdWithDetails(id: string) {
  const supabase = createSupabaseAdminClient();

  const [blogResult, commentsResult, metricsResult] = await Promise.all([
    supabase.from("blogs").select("*").eq("id", id).maybeSingle<BlogRow>(),
    fetchCommentsWithSchemaFallback({ blogId: id }),
    fetchBlogMetricsRows(id),
  ]);

  const blog = unwrapSingle(blogResult.data, blogResult.error);
  if (!blog) {
    return null;
  }

  const comments = commentsResult;
  const usersById = await getUsersByIds([...new Set(comments.map((comment) => comment.user_id))]);

  const counts = metricsResult[0]
    ? {
        likes: metricsResult[0].likes_count ?? 0,
        bookmarks: metricsResult[0].bookmarks_count ?? 0,
      }
    : { likes: 0, bookmarks: 0 };

  return {
    ...toBlog(blog),
    comments: comments.map((comment) => {
      const user = usersById.get(comment.user_id);

      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        user: {
          username: user?.username ?? "Unknown",
          email: user?.email ?? "unknown@example.com",
        },
      };
    }),
    _count: counts,
  };
}

export async function updateBlogById(
  id: string,
  updates: {
    title?: string;
    content?: string;
    excerpt?: string;
    tags?: string;
    coverImage?: string | null;
    published?: boolean;
    scheduledFor?: string | null;
  }
) {
  const supabase = createSupabaseAdminClient();
  const existingResult = await supabase.from("blogs").select("*").eq("id", id).maybeSingle<BlogRow>();
  const existing = unwrapSingle(existingResult.data, existingResult.error);
  if (!existing) {
    return null;
  }

  const payload: Record<string, string | boolean | null> = {};

  if (updates.title !== undefined) {
    payload.title = updates.title;
    payload.slug = await ensureUniqueSlug(updates.title, id);
  }
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.excerpt !== undefined) payload.excerpt = updates.excerpt;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.coverImage !== undefined) payload.cover_image = updates.coverImage;
  if (updates.scheduledFor !== undefined) payload.scheduled_for = normalizeSchedule(updates.scheduledFor);

  const nextScheduledFor = (payload.scheduled_for as string | null | undefined) ?? existing.scheduled_for;
  const nextLive =
    updates.published !== undefined
      ? Boolean(updates.published) || (nextScheduledFor ? new Date(nextScheduledFor).getTime() <= Date.now() : false)
      : existing.published || (nextScheduledFor ? new Date(nextScheduledFor).getTime() <= Date.now() : false);
  const wasLive = isBlogLive(existing);

  if (updates.published !== undefined || updates.scheduledFor !== undefined) {
    payload.published = nextLive;
    payload.published_at = nextLive ? existing.published_at ?? new Date().toISOString() : null;
  }

  const result = await supabase
    .from("blogs")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle<BlogRow>();

  const blog = unwrapSingle(result.data, result.error);
  if (blog && !wasLive && isBlogLive(blog)) {
    await notifyUsersOfPublishedBlog(blog);
  }

  return blog ? toBlog(blog) : null;
}

export async function getBlogReactionState(blogId: string, userId: string) {
  const supabase = createSupabaseAdminClient();

  const [likeResult, bookmarkResult] = await Promise.all([
    supabase
      .from("likes")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("bookmarks")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (likeResult.error || bookmarkResult.error) {
    if (isMissingSchemaFeature(likeResult.error) || isMissingSchemaFeature(bookmarkResult.error)) {
      return {
        liked: false,
        bookmarked: false,
        disabled: true,
      };
    }
    throw new Error("Failed to load blog reaction state.");
  }

  return {
    liked: Boolean(likeResult.data),
    bookmarked: Boolean(bookmarkResult.data),
    disabled: false,
  };
}

export async function toggleBlogLike(blogId: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const existingResult = await supabase
    .from("likes")
    .select("id")
    .eq("blog_id", blogId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingResult.error) {
    if (isMissingSchemaFeature(existingResult.error)) {
      return {
        liked: false,
        bookmarked: false,
        disabled: true,
      };
    }
    throw new Error(existingResult.error.message);
  }

  if (existingResult.data) {
    const deleteResult = await supabase.from("likes").delete().eq("id", existingResult.data.id);
    if (deleteResult.error) {
      if (isMissingSchemaFeature(deleteResult.error)) {
        return {
          liked: false,
          bookmarked: false,
          disabled: true,
        };
      }
      throw new Error(deleteResult.error.message);
    }
  } else {
    const insertResult = await supabase.from("likes").insert({ blog_id: blogId, user_id: userId });
    if (insertResult.error) {
      if (isMissingSchemaFeature(insertResult.error)) {
        return {
          liked: false,
          bookmarked: false,
          disabled: true,
        };
      }
      throw new Error(insertResult.error.message);
    }
  }

  return getBlogReactionState(blogId, userId);
}

export async function toggleBlogBookmark(blogId: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const existingResult = await supabase
    .from("bookmarks")
    .select("id")
    .eq("blog_id", blogId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingResult.error) {
    if (isMissingSchemaFeature(existingResult.error)) {
      return {
        liked: false,
        bookmarked: false,
        disabled: true,
      };
    }
    throw new Error(existingResult.error.message);
  }

  if (existingResult.data) {
    const deleteResult = await supabase.from("bookmarks").delete().eq("id", existingResult.data.id);
    if (deleteResult.error) {
      if (isMissingSchemaFeature(deleteResult.error)) {
        return {
          liked: false,
          bookmarked: false,
          disabled: true,
        };
      }
      throw new Error(deleteResult.error.message);
    }
  } else {
    const insertResult = await supabase
      .from("bookmarks")
      .insert({ blog_id: blogId, user_id: userId });
    if (insertResult.error) {
      if (isMissingSchemaFeature(insertResult.error)) {
        return {
          liked: false,
          bookmarked: false,
          disabled: true,
        };
      }
      throw new Error(insertResult.error.message);
    }
  }

  return getBlogReactionState(blogId, userId);
}

export async function addCommentToBlog(blogId: string, userId: string, content: string, parentCommentId?: string | null) {
  const trimmed = content.trim();
  const supabase = createSupabaseAdminClient();

  if (!trimmed) {
    throw new Error("Comment cannot be empty.");
  }

  if (parentCommentId) {
    const parentResult = await supabase
      .from("comments")
      .select("id, user_id, blog_id")
      .eq("id", parentCommentId)
      .maybeSingle<{ id: string; user_id: string; blog_id: string }>();

    const parent = unwrapSingle(parentResult.data, parentResult.error);
    if (!parent || parent.blog_id !== blogId) {
      throw new Error("Reply target not found.");
    }
  }

  const comment = await insertCommentWithSchemaFallback(blogId, userId, trimmed, parentCommentId);
  if (!comment) {
    throw new Error("Failed to create comment.");
  }

  if (parentCommentId) {
    const parentResult = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", parentCommentId)
      .maybeSingle<{ user_id: string }>();
    const parent = unwrapSingle(parentResult.data, parentResult.error);

    if (parent && parent.user_id !== userId) {
      const user = await getUserById(userId);
      const insertNotification = await supabase.from("notifications").insert({
        user_id: parent.user_id,
        type: "COMMENT_REPLY",
        title: "New reply to your comment",
        body: `${user?.username ?? "Someone"} replied to your comment.`,
        link: `/blogs/${blogId}`,
      });
      if (insertNotification.error && !isMissingSchemaFeature(insertNotification.error)) {
        throw new Error(insertNotification.error.message);
      }
    }
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.created_at,
    parentId: comment.parent_comment_id,
    canEdit: true,
    likesCount: 0,
    reportsCount: 0,
    liked: false,
    reported: false,
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    },
  } satisfies PublicComment;
}

export async function getCommentsForBlog(blogId: string) {
  const comments = await fetchCommentsWithSchemaFallback({ blogId });
  const usersById = await getUsersByIds([...new Set(comments.map((comment) => comment.user_id))]);
  const metricsByComment = await getCommentMetricsMap(comments.map((comment) => comment.id));

  return comments.map((comment) => {
    const user = usersById.get(comment.user_id);
    const metric = metricsByComment.get(comment.id);

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      parentId: comment.parent_comment_id,
      likesCount: metric?.likes_count ?? 0,
      reportsCount: metric?.reports_count ?? 0,
      liked: false,
      reported: false,
      user: {
        id: comment.user_id,
        username: user?.username ?? "Unknown",
        avatar: user?.avatar ?? null,
      },
    };
  });
}

export async function deleteBlogById(id: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from("blogs").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function updateOwnComment(commentId: string, userId: string, content: string) {
  const trimmed = content.trim();
  const supabase = createSupabaseAdminClient();

  if (!trimmed) {
    throw new Error("Comment cannot be empty.");
  }

  const existing = await fetchSingleCommentWithSchemaFallback(commentId);

  if (!existing || existing.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  const comment = await updateCommentWithSchemaFallback(commentId, trimmed);
  const user = await getUserById(userId);

  if (!comment || !user) {
    throw new Error("Failed to update comment.");
  }

  const metricResult = await supabase
    .from("comment_metrics")
    .select("*")
    .eq("comment_id", commentId)
    .maybeSingle<CommentMetricRow>();
  const metric = unwrapSingle(metricResult.data, metricResult.error);

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.created_at,
    parentId: comment.parent_comment_id,
    canEdit: true,
    likesCount: metric?.likes_count ?? 0,
    reportsCount: metric?.reports_count ?? 0,
    liked: false,
    reported: false,
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    },
  };
}

export async function updateUserProfile(
  userId: string,
  input: {
    username?: string;
    avatar?: string | null;
    bio?: string;
    websiteUrl?: string | null;
    xUrl?: string | null;
    linkedinUrl?: string | null;
  }
) {
  const supabase = createSupabaseAdminClient();
  const payload: Record<string, string | null> = {};

  if (input.username !== undefined) {
    const nextUsername = input.username.trim();

    if (!nextUsername) {
      throw new Error("Username cannot be empty.");
    }

    const existingResult = await supabase
      .from("users")
      .select("id")
      .eq("username", nextUsername)
      .neq("id", userId)
      .maybeSingle<{ id: string }>();

    const existing = unwrapSingle(existingResult.data, existingResult.error);

    if (existing) {
      throw new Error("That username is already taken.");
    }

    payload.username = nextUsername;
  }

  if (input.avatar !== undefined) {
    payload.avatar = input.avatar?.trim() || null;
  }

  if (input.bio !== undefined) {
    payload.bio = input.bio.trim();
  }

  if (input.websiteUrl !== undefined) {
    payload.website_url = input.websiteUrl?.trim() || null;
  }

  if (input.xUrl !== undefined) {
    payload.x_url = input.xUrl?.trim() || null;
  }

  if (input.linkedinUrl !== undefined) {
    payload.linkedin_url = input.linkedinUrl?.trim() || null;
  }

  const result = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single<UserRow>();

  const user = unwrapSingle(result.data, result.error);
  if (!user) {
    throw new Error("Failed to update profile.");
  }

  return toUser(user);
}

export async function deleteOwnComment(commentId: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const existing = await fetchSingleCommentWithSchemaFallback(commentId);

  if (!existing || existing.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  const deleteResult = await supabase.from("comments").delete().eq("id", commentId);

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message);
  }
}

async function getBlogsForRelation(table: "likes" | "bookmarks", userId: string) {
  const supabase = createSupabaseAdminClient();
  const author = await getDefaultAuthor();

  const relationResult = await supabase
    .from(table)
    .select("blog_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (relationResult.error) {
    throw new Error(`Failed to load ${table}.`);
  }

  const relationRows = (relationResult.data ?? []) as { blog_id: string; created_at: string }[];
  const blogIds = [...new Set(relationRows.map((row) => row.blog_id))];

  if (blogIds.length === 0) {
    return [];
  }

  const [blogsResult, countsResult] = await Promise.all([
    supabase.from("blogs").select("*").in("id", blogIds),
    fetchBlogMetricsRows(),
  ]);

  if (blogsResult.error) {
    throw new Error("Failed to load related blogs.");
  }

  const relationOrder = new Map(relationRows.map((row, index) => [row.blog_id, index]));
  const countMap = new Map(countsResult.map((row) => [row.blog_id as string, row]));

  return ((blogsResult.data as BlogRow[] | null) ?? [])
    .filter((blog) => isBlogLive(blog))
    .sort((a, b) => (relationOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (relationOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    .map((blog) => ({
      ...toPublicBlog(blog, countMap.get(blog.id) ?? null),
      author,
    }));
}

export async function getLikedBlogs(userId: string) {
  return getBlogsForRelation("likes", userId);
}

export async function getBookmarkedBlogs(userId: string) {
  return getBlogsForRelation("bookmarks", userId);
}

export async function toggleCommentLike(commentId: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const existingResult = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingResult.error) {
    if (isMissingSchemaFeature(existingResult.error)) {
      return {
        liked: false,
        likesCount: 0,
        disabled: true,
      };
    }
    throw new Error(existingResult.error.message);
  }

  if (existingResult.data) {
    const deleteResult = await supabase.from("comment_likes").delete().eq("id", existingResult.data.id);
    if (deleteResult.error) {
      if (isMissingSchemaFeature(deleteResult.error)) {
        return {
          liked: false,
          likesCount: 0,
          disabled: true,
        };
      }
      throw new Error(deleteResult.error.message);
    }
  } else {
    const insertResult = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
    if (insertResult.error) {
      if (isMissingSchemaFeature(insertResult.error)) {
        return {
          liked: false,
          likesCount: 0,
          disabled: true,
        };
      }
      throw new Error(insertResult.error.message);
    }
  }

  const metricResult = await supabase
    .from("comment_metrics")
    .select("*")
    .eq("comment_id", commentId)
    .maybeSingle<CommentMetricRow>();
  const metric = metricResult.error && isMissingSchemaFeature(metricResult.error)
    ? null
    : unwrapSingle(metricResult.data, metricResult.error);

  return {
    liked: !existingResult.data,
    likesCount: metric?.likes_count ?? 0,
    disabled: false,
  };
}

export async function reportComment(commentId: string, userId: string, reason: string) {
  const supabase = createSupabaseAdminClient();
  const existingResult = await supabase
    .from("comment_reports")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .eq("status", "OPEN")
    .maybeSingle();

  if (existingResult.error) {
    if (isMissingSchemaFeature(existingResult.error)) {
      return {
        reported: false,
        reportsCount: 0,
        disabled: true,
      };
    }
    throw new Error(existingResult.error.message);
  }

  if (!existingResult.data) {
    const insertResult = await supabase
      .from("comment_reports")
      .insert({ comment_id: commentId, user_id: userId, reason: reason.trim() || "Inappropriate" });
    if (insertResult.error) {
      if (isMissingSchemaFeature(insertResult.error)) {
        return {
          reported: false,
          reportsCount: 0,
          disabled: true,
        };
      }
      throw new Error(insertResult.error.message);
    }
  }

  const metricResult = await supabase
    .from("comment_metrics")
    .select("*")
    .eq("comment_id", commentId)
    .maybeSingle<CommentMetricRow>();
  const metric = metricResult.error && isMissingSchemaFeature(metricResult.error)
    ? null
    : unwrapSingle(metricResult.data, metricResult.error);

  return {
    reported: true,
    reportsCount: metric?.reports_count ?? 0,
    disabled: false,
  };
}

export async function subscribeToNewsletter(email: string) {
  const supabase = createSupabaseAdminClient();
  const normalized = email.trim().toLowerCase();

  if (!normalized || !normalized.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const existingResult = await supabase
    .from("newsletter_subscriptions")
    .select("id, active")
    .eq("email", normalized)
    .maybeSingle<{ id: string; active: boolean }>();

  const existing = unwrapSingle(existingResult.data, existingResult.error);

  if (existing) {
    if (existing.active) {
      const error = new Error("Already subscribed with this email.");
      (error as Error & { status?: number }).status = 409;
      throw error;
    }

    const error = new Error("This email is blocked from newsletter signup.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }

  const insertResult = await supabase.from("newsletter_subscriptions").insert({ email: normalized });
  if (insertResult.error) {
    throw new Error(insertResult.error.message);
  }

  return { email: normalized };
}

export async function getNotificationsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) {
    if (isMissingSchemaFeature(result.error)) {
      return [];
    }
    throw new Error("Failed to load notifications.");
  }

  return (result.data ?? []).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    link: item.link,
    read: item.read,
    createdAt: item.created_at,
  }));
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (result.error) {
    if (isMissingSchemaFeature(result.error)) {
      return 0;
    }
    throw new Error("Failed to load unread notification count.");
  }

  return result.count ?? 0;
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);

  if (result.error && !isMissingSchemaFeature(result.error)) {
    throw new Error(result.error.message);
  }
}

export async function deleteCommentById(id: string) {
  const supabase = createSupabaseAdminClient();
  const reportResolve = await supabase.from("comment_reports").update({ status: "RESOLVED" }).eq("comment_id", id);
  if (reportResolve.error && !isMissingSchemaFeature(reportResolve.error)) {
    throw new Error(reportResolve.error.message);
  }

  const result = await supabase.from("comments").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }
}


















