import styles from './LinkSection.module.scss'

function LinkSection({ title, icon, links, color }) {
  if (!links || links.length === 0) {
    return null
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {title}
      </h3>
      <ul className={styles.list}>
        {links.map((link, index) => (
          <li key={index} className={styles.item}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              style={{ '--link-color': color }}
            >
              <div className={styles.linkContent}>
                <span className={styles.linkTitle}>{link.title}</span>
                {link.description && (
                  <span className={styles.linkDescription}>{link.description}</span>
                )}
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.arrow}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default LinkSection
