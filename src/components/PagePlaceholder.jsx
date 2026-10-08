const PagePlaceholder = ({ title, summary, todos = [], tags = [] }) => {
  return (
    <section className="page-card">
      <h1>{title}</h1>
      {summary ? <p>{summary}</p> : null}
      {todos.length ? (
        <ul className="todo-list">
          {todos.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {tags.length ? (
        <div className="tag-row">
          {tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default PagePlaceholder
