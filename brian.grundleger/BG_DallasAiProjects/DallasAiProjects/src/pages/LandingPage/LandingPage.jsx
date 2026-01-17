import SystemCard from '../../components/SystemCard'
import systemsData from '../../data/systems.json'
import styles from './LandingPage.module.scss'

function LandingPage() {
  const { systems } = systemsData

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Banking Ecosystem Demo</h1>
          <p className={styles.heroDescription}>
            Explore our comprehensive suite of banking solutions. Each system below
            provides detailed information about APIs, documentation, and demo environments.
          </p>
        </div>
      </section>

      <section className={styles.systems}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Systems</h2>
          <p className={styles.sectionDescription}>
            Click on any system to view detailed information, API documentation, and demo links.
          </p>
          <div className={styles.grid}>
            {systems.map((system) => (
              <SystemCard key={system.id} system={system} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
