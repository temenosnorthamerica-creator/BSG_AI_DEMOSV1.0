import styles from './ApiList.module.scss'

function ApiList({ apis, color }) {
  if (!apis || apis.length === 0) {
    return null
  }

  return (
    <div className={styles.apiList}>
      <h3 className={styles.title}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        APIs & Developer Portal
      </h3>
      <ul className={styles.list}>
        {apis.map((api, index) => (
          <li key={index} className={styles.item}>
            <div className={styles.apiInfo}>
              <span className={styles.apiName}>{api.name}</span>
              {api.version && (
                <span className={styles.apiVersion}>v{api.version}</span>
              )}
              {api.description && (
                <p className={styles.apiDescription}>{api.description}</p>
              )}
            </div>
            <a
              href={api.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.portalLink}
              style={{ '--link-color': color }}
            >
              <span>View in Portal</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ApiList
