import type { BlogPost } from "../types";

type BlogPageProps = {
  posts: BlogPost[];
};

export function BlogPage({ posts }: BlogPageProps) {
  return (
    <>
      <h2 className="section-title">Блог и полезные материалы</h2>
      <div className="card-grid">
        {posts.map((post) => (
          <article key={post.id} className="card">
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
            <div className="card-footer">
              <span className="muted">{post.category}</span>
              <button type="button" className="btn">
                Читать
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
