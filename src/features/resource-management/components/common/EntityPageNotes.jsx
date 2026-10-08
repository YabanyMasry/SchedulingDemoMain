const EntityPageNotes = ({
  todos = [],
  tags = [],
}) => {
  return (
    <>
      {todos.length ? (
        <ul className="todo-list" style={{ marginTop: '18px', paddingLeft: '18px' }}>
          {todos.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {tags.length ? (
        <div className="tag-row" style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
          {tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      ) : null}
    </>
  )
}

export default EntityPageNotes
