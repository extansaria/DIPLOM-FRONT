import { html, useState } from "../lib.js";

export function ReviewsPage({ initialReviews }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");

  function submitReview() {
    if (!author.trim() || !text.trim()) return;
    setReviews((prev) => [{ id: `r-${Date.now()}`, author: author.trim(), text: text.trim() }, ...prev]);
    setAuthor("");
    setText("");
  }

  return html`
    <h2 className="section-title">Отзывы пользователей</h2>
    <section className="layout-two">
      <div>
        <div className="card-grid">
          ${reviews.map(
            (review) => html`
              <article key=${review.id} className="card">
                <h3>${review.author}</h3>
                <p>${review.text}</p>
              </article>
            `
          )}
        </div>
      </div>
      <div className="card">
        <h3 style=${{ marginTop: 0 }}>Добавить отзыв</h3>
        <div className="form-grid">
          <input className="input" value=${author} onChange=${(e) => setAuthor(e.target.value)} placeholder="Ваше имя" />
          <textarea value=${text} onChange=${(e) => setText(e.target.value)} placeholder="Ваш отзыв" />
          <button className="btn primary" onClick=${submitReview}>Отправить отзыв</button>
        </div>
      </div>
    </section>
  `;
}
