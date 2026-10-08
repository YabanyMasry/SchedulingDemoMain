const EntityListHeader = ({
  title = 'List View',
  subtitle,
}) => {
  return (
    <div className="card-title-row" style={{ marginTop: '20px' }}>
      <div>
        <h2 className="card-title">{title}</h2>
        {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      </div>
    </div>
  )
}

export default EntityListHeader
