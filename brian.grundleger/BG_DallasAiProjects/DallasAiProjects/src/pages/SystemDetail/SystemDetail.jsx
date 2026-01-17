import { useParams, Link, Navigate } from 'react-router-dom'
import ApiList from '../../components/ApiList'
import LinkSection from '../../components/LinkSection'
import systemsData from '../../data/systems.json'
import styles from './SystemDetail.module.scss'

function SystemDetail() {
  const { systemId } = useParams()
  const system = systemsData.systems.find(s => s.id === systemId)

  if (!system) {
    return <Navigate to="/" replace />
  }

  const { name, description, overview, color, apis, documentation, demoLinks } = system

  const docIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )

  const demoIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header} style={{ '--system-color': color }}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>Back to Systems</span>
          </Link>
          <h1 className={styles.title}>{name}</h1>
          <p className={styles.description}>{description}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          {overview && (
            <section className={styles.overview}>
              <h2 className={styles.sectionTitle}>Overview</h2>
              <p className={styles.overviewText}>{overview}</p>
            </section>
          )}

          <div className={styles.grid}>
            <div className={styles.mainColumn}>
              <ApiList apis={apis} color={color} />
            </div>
            <div className={styles.sideColumn}>
              <LinkSection
                title="Documentation"
                icon={docIcon}
                links={documentation}
                color={color}
              />
              <LinkSection
                title="Demo Environment"
                icon={demoIcon}
                links={demoLinks}
                color={color}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemDetail
