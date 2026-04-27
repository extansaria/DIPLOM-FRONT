import { html } from "../lib.js";

export function BlogPage({ posts }) {
  return html`
    <h2 className="section-title">Блог и полезные материалы</h2>
    <div className="card-grid">
      ${posts.map(
        (post) => html`
          <article key=${post.id} className="card">
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <div className="card-footer">
              <span className="muted">${post.category}</span>
              <button className="btn">Читать</button>
            </div>
          </article>
        `
      )}
    </div>
  `;
}
